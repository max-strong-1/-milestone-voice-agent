# Latency Optimization Guide

**Last Updated:** December 12, 2025

This document analyzes latency issues in the Milestone Voice Agent and provides actionable solutions.

---

## Current Latency Breakdown

### Typical Conversation Flow Latency

```
User speaks → ElevenLabs STT → LLM Processing → Tool Call → Your API → WooCommerce → Response → LLM → TTS → User hears

Approximate timing:
├── Speech-to-Text:        200-400ms
├── LLM Processing:        500-2000ms (depends on model)
├── Tool Call Round-trip:  300-1500ms ← YOUR CONTROL
├── LLM Response:          500-1500ms
└── Text-to-Speech:        200-400ms
                           ─────────────
Total:                     1.7-5.8 seconds per turn
```

### Your API Latency Sources

| Component | Current Time | Target | Notes |
|-----------|-------------|--------|-------|
| Vercel Cold Start | 200-500ms | 50-100ms | First request after idle |
| WooCommerce Tag Lookup | 200-400ms | 0ms | Can be cached |
| WooCommerce Product Query | 300-600ms | 50-100ms | Can be cached |
| Function Execution | 50-100ms | 50-100ms | Already fast |
| **Total API Time** | **750-1600ms** | **150-300ms** | **5x improvement possible** |

---

## 🚀 Quick Wins (Implement Today)

### 1. Increase Function Memory (5 minutes)

Higher memory = faster CPU allocation in Vercel.

**Current (`vercel.json`):**
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**Optimized:**
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "regions": ["iad1"]
}
```

**Why:** Pinning to a single region (iad1 = US East) reduces cold starts and ensures consistent latency. Choose the region closest to your WooCommerce server.

---

### 2. Add In-Memory Caching (30 minutes)

Cache WooCommerce responses to avoid repeated API calls.

**Add to `lib/woocommerce.js`:**

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Update getProductsByZip to use cache
export async function getProductsByZip(zipCode) {
  const cacheKey = `zip_${zipCode}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`Cache hit for ZIP ${zipCode}`);
    return cached;
  }

  const wc = getWooCommerceClient();
  
  try {
    // ... existing code ...
    
    setCache(cacheKey, response.data || []);
    return response.data || [];
  } catch (error) {
    // ... existing error handling ...
  }
}
```

**Impact:** Eliminates 400-800ms on repeated ZIP code checks within 5 minutes.

---

### 3. Reduce check_service_area Response Size (15 minutes)

The response includes full product details that aren't always needed.

**Current response includes:**
- Full product descriptions
- All metadata
- Large payload to send back

**Optimized response:**
```javascript
// Only include essential fields for initial check
const availableProducts = products.map(product => ({
  sku: product.sku,
  name: getCleanProductName(product.name),
  price_per_ton: parseFloat(product.price)
}));
```

**Impact:** Smaller response = faster transmission.

---

## 📈 Medium-Term Optimizations

### 4. Combine Tag Lookup with Product Query

**Current (2 API calls):**
```javascript
// Call 1: Find tag ID
const tagResponse = await wc.get("products/tags", { search: zipCode });
const tagId = tagResponse.data[0].id;

// Call 2: Get products
const response = await wc.get("products", { tag: tagId });
```

**Optimized (1 API call with caching):**
```javascript
// Cache tag IDs permanently (they don't change often)
const tagIdCache = new Map();

async function getTagId(zipCode) {
  if (tagIdCache.has(zipCode)) {
    return tagIdCache.get(zipCode);
  }
  
  const tagResponse = await wc.get("products/tags", { search: zipCode });
  if (tagResponse.data?.length > 0) {
    tagIdCache.set(zipCode, tagResponse.data[0].id);
    return tagResponse.data[0].id;
  }
  return null;
}
```

**Impact:** Saves 200-400ms on every ZIP check after the first.

---

### 5. Preload Common ZIP Codes

If you know your top 20 ZIP codes, preload them on function warm-up.

```javascript
// lib/preload.js
const TOP_ZIP_CODES = ['45640', '43560', '44124', /* ... */];

export async function preloadProducts() {
  for (const zip of TOP_ZIP_CODES) {
    try {
      await getProductsByZip(zip); // This populates cache
    } catch (e) {
      console.error(`Failed to preload ${zip}`);
    }
  }
}

// Call on first request or via cron
```

---

### 6. Use Vercel Edge Functions (Advanced)

Edge functions run closer to users with near-zero cold starts.

**Convert simple endpoints to edge:**
```javascript
// api/check-service-area.js
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Edge function code (slightly different API)
}
```

**Caveat:** Edge functions have limitations (no Node.js APIs, limited packages).

---

## 🎯 ElevenLabs-Specific Optimizations

### 7. Reduce System Prompt Length

Longer prompts = more tokens = slower LLM processing.

**Current prompt:** ~4,000 characters  
**Target:** ~2,500 characters

**Strategies:**
- Remove redundant examples
- Condense repeated instructions
- Move reference info to knowledge base

---

### 8. Optimize Tool Descriptions

ElevenLabs sends tool descriptions with every request. Shorter = faster.

**Current (verbose):**
```
"Calculates exact quantities needed based on project dimensions. 
Call this after the customer provides their measurements (length, width, depth). 
Returns tons, cubic yards, truck loads, and pricing."
```

**Optimized (concise):**
```
"Calculate material quantities from dimensions. Returns tons, yards, and pricing."
```

---

### 9. Consider Model Selection

Different models have different latencies:

| Model | Latency | Quality | Cost |
|-------|---------|---------|------|
| GPT-4 Turbo | Higher | Best | $$$ |
| GPT-3.5 Turbo | Lower | Good | $ |
| Claude 3 Haiku | Lowest | Good | $ |
| Claude 3 Sonnet | Medium | Great | $$ |

**Recommendation:** Test Claude 3 Haiku for faster responses with acceptable quality.

---

### 10. Enable Streaming Responses

If ElevenLabs supports it, stream responses so TTS can start before the full response is ready.

---

## 📊 Monitoring Latency

### Add Timing to API Responses

```javascript
export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // ... your code ...
    
    const duration = Date.now() - startTime;
    console.log(`API ${req.url} completed in ${duration}ms`);
    
    return res.status(200).json({
      ...response,
      _debug: {
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // ...
  }
}
```

### Track in ElevenLabs Dashboard

Monitor:
- Tool execution times
- LLM response times
- Overall conversation latency

---

## Implementation Priority

| Optimization | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Add region pinning | Medium | 5 min | ⭐⭐⭐⭐⭐ |
| In-memory caching | High | 30 min | ⭐⭐⭐⭐⭐ |
| Cache tag IDs | Medium | 15 min | ⭐⭐⭐⭐ |
| Reduce response size | Low | 15 min | ⭐⭐⭐ |
| Shorter tool descriptions | Medium | 10 min | ⭐⭐⭐⭐ |
| Preload ZIP codes | Medium | 30 min | ⭐⭐⭐ |
| Edge functions | High | 2-4 hrs | ⭐⭐ |
| Different model | High | Testing | ⭐⭐⭐⭐ |

---

## Expected Results

After implementing quick wins:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| check_service_area | 800-1200ms | 200-400ms | 3-4x faster |
| calculate_materials | 600-1000ms | 300-500ms | 2x faster |
| calculate_delivery | 400-600ms | 200-300ms | 2x faster |
| **Conversation turn** | **3-5 sec** | **2-3 sec** | **40% faster** |

---

## Next Steps

1. [ ] Implement in-memory caching
2. [ ] Add region pinning to vercel.json
3. [ ] Shorten tool descriptions in ElevenLabs
4. [ ] Test with Claude 3 Haiku model
5. [ ] Monitor latency improvements
6. [ ] Consider edge functions for hot paths

