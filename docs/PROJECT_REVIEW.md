# Milestone Voice Agent - Project Review & Implementation Plan

**Review Date:** December 12, 2025  
**Reviewed By:** Development Team  
**Status:** In Progress

---

## Executive Summary

The Milestone Trucks voice agent has a solid foundation with well-architected APIs, accurate calculation logic, and a rich materials knowledge base. This document tracks identified issues and improvements, prioritized for implementation.

---

## 🔴 Critical Issues

### Issue 1: Cart Storage Not Persistent
**Status:** ⬜ Not Started  
**Priority:** Critical  
**Effort:** 2-4 hours  
**File:** `api/add-to-cart.js`

**Problem:**  
The `add-to-cart` endpoint generates cart data but doesn't store it anywhere. The cart ID is created but data only exists in the API response. If the conversation drops or the customer needs to resume, the cart is lost.

**Current Code (lines 166-180):**
```javascript
// CART STORAGE OPTIONS
// For now, we return the cart data to be passed to checkout
```

**Solution Options:**
1. **Vercel KV Store** - Fast, serverless key-value storage
   ```javascript
   import { kv } from '@vercel/kv';
   await kv.set(cartId, cartData, { ex: 86400 }); // 24hr expiry
   ```

2. **Create Pending WooCommerce Order** - Most reliable
   ```javascript
   const order = await wc.post("orders", { 
     status: 'pending',
     line_items: processedItems.map(item => ({
       product_id: item.product_id,
       quantity: item.quantity
     }))
   });
   ```

3. **Redis/Upstash** - Alternative KV store

**Recommended:** Option 2 (WooCommerce pending order) - Creates real order that persists in WooCommerce.

**Implementation Notes:**
- [ ] Choose storage solution
- [ ] Implement storage in add-to-cart.js
- [ ] Add retrieval endpoint if needed
- [ ] Test cart persistence across sessions

---

### Issue 2: Checkout Prefill Doesn't Actually Prefill
**Status:** ⬜ Not Started  
**Priority:** Critical  
**Effort:** 2-4 hours  
**File:** `api/prefill-checkout.js`

**Problem:**  
The endpoint prepares customer data but WooCommerce checkout doesn't receive it. Customers must re-enter all information manually, defeating the purpose.

**Current Code (lines 81-99):**
```javascript
// CHECKOUT PREFILL OPTIONS
// For now, we prepare the data and provide the checkout URL
// The customer will need to enter details at checkout
```

**Solution Options:**
1. **Create Pending Order with Customer Data**
   ```javascript
   const order = await wc.post("orders", {
     status: 'pending',
     billing: customerData.billing,
     shipping: customerData.shipping,
     line_items: cartItems
   });
   // Return order-pay URL: /checkout/order-pay/{order_id}
   ```

2. **Custom WordPress Endpoint** - Set session cookies

3. **CoCart Plugin** - Third-party cart management

**Recommended:** Option 1 - Create pending order, return order-pay URL.

**Implementation Notes:**
- [ ] Integrate with cart storage solution
- [ ] Create order with full customer data
- [ ] Return proper checkout URL
- [ ] Handle order expiration/cleanup

---

### Issue 3: Missing Material Terminology in System Prompt
**Status:** ⬜ Not Started  
**Priority:** High  
**Effort:** 5 minutes  
**File:** `docs/SYSTEM_PROMPT.md`

**Problem:**  
The refactored system prompt removed important pronunciation and unit guidelines. Robert may say "#57" incorrectly or mix up tons/yards.

**Missing Section:**
```markdown
## IMPORTANT: MATERIAL TERMINOLOGY

**Units of Measurement:**
- GRAVEL/STONE: Always measured in TONS, never yards
- SOIL/TOPSOIL: Always measured in YARDS, never tons
- Example: "You'll need 10 tons of crusher run" (correct)
- Example: "You'll need 5 yards of topsoil" (correct)

**Product Numbers - Pronunciation:**
- #304 → Say "three oh four" (NOT "three hundred four")
- #411 → Say "four eleven" (NOT "four hundred eleven")
- #57 → Say "fifty-seven" (do NOT say "hash" or "pound")
- #8 → Say "number eight"
- #4 → Say "number four"
- Always pronounce numbers digit-by-digit for aggregates
```

**Implementation Notes:**
- [ ] Add terminology section after "YOUR VOICE STYLE"
- [ ] Update ElevenLabs system prompt
- [ ] Test pronunciation in conversation

---

## 🟡 Medium Priority Improvements

### Issue 4: No Health Check Endpoint
**Status:** ✅ Completed  
**Priority:** Medium  
**Effort:** 30 minutes  
**File:** `api/health.js`

**Problem:**  
No way to monitor if the API and WooCommerce connection are healthy.

**Solution:**
```javascript
// api/health.js
export default async function handler(req, res) {
  const start = Date.now();
  try {
    const wc = getWooCommerceClient();
    await wc.get("products", { per_page: 1 });
    
    return res.status(200).json({
      status: "healthy",
      woocommerce: "connected",
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - start
    });
  } catch (error) {
    return res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

**Implementation Notes:**
- [ ] Create health.js endpoint
- [ ] Set up monitoring (Vercel, UptimeRobot, etc.)
- [ ] Add alerting for failures

---

### Issue 5: No Input Bounds Validation
**Status:** ✅ Completed  
**Priority:** Medium  
**Effort:** 1 hour  
**Files:** `api/calculate-materials.js`, `api/calculate-delivery.js`

**Problem:**  
No validation for unreasonable values (e.g., 1,000,000 feet driveway).

**Solution:**
```javascript
// Add after parsing dimensions
const MAX_DIMENSION_FT = 5000;
const MAX_DEPTH_IN = 36;
const MAX_WEIGHT_TONS = 1000;

if (length > MAX_DIMENSION_FT || width > MAX_DIMENSION_FT) {
  return res.status(400).json({
    error: 'Dimensions too large',
    message: "Those dimensions seem unusually large. Are you measuring in feet? Most driveways are under 200 feet long."
  });
}
```

**Implementation Notes:**
- [ ] Add constants for max values
- [ ] Add validation in calculate-materials.js
- [ ] Add validation in calculate-delivery.js
- [ ] Friendly error messages

---

### Issue 6: Environment Variable Validation
**Status:** ✅ Completed  
**Priority:** Medium  
**Effort:** 15 minutes  
**File:** `lib/woocommerce.js`

**Problem:**  
Missing environment variables cause cryptic errors at runtime.

**Solution:**
```javascript
// Add at module load
const REQUIRED_ENV = [
  'WOOCOMMERCE_URL',
  'WOOCOMMERCE_CONSUMER_KEY',
  'WOOCOMMERCE_CONSUMER_SECRET'
];

const missing = REQUIRED_ENV.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`⚠️ Missing environment variables: ${missing.join(', ')}`);
}
```

**Implementation Notes:**
- [ ] Add validation at module load
- [ ] Log warnings for missing vars
- [ ] Consider throwing in production

---

### Issue 7: No Request Logging
**Status:** ✅ Completed  
**Priority:** Medium  
**Effort:** 1 hour  
**File:** `lib/logger.js`

**Problem:**  
No structured logging for debugging production issues or analyzing usage patterns.

**Solution:**
```javascript
// lib/logger.js
export function logApiCall(endpoint, { request, response, duration, error }) {
  const log = {
    timestamp: new Date().toISOString(),
    endpoint,
    request_body: request,
    response_status: response?.status,
    duration_ms: duration,
    error: error?.message
  };
  
  console.log(JSON.stringify(log));
}
```

**Implementation Notes:**
- [ ] Create logger.js
- [ ] Add to each API endpoint
- [ ] Consider log aggregation service

---

## 🟢 Nice-to-Have Enhancements

### Issue 8: Response Caching for Products
**Status:** ✅ Completed  
**Priority:** Low  
**Effort:** 1-2 hours  
**File:** `lib/woocommerce.js`

**Problem:**  
Every API call fetches fresh product data from WooCommerce, adding latency.

**Solution:**
```javascript
const productCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getProductsByZipCached(zipCode) {
  const cacheKey = `products_${zipCode}`;
  const cached = productCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const products = await getProductsByZip(zipCode);
  productCache.set(cacheKey, { data: products, timestamp: Date.now() });
  return products;
}
```

**Implementation Notes:**
- [ ] Implement in-memory cache
- [ ] Consider Vercel KV for distributed caching
- [ ] Add cache invalidation strategy

---

### Issue 9: Unit Tests for Calculations
**Status:** ⬜ Not Started  
**Priority:** Low  
**Effort:** 2-3 hours  
**File:** `test/calculations.test.js` (new)

**Problem:**  
No automated tests to catch calculation regressions.

**Solution:**
```javascript
import { calculateCubicYards, cubicYardsToTons } from '../lib/calculations.js';

describe('calculateCubicYards', () => {
  test('15x60x6in = 16.67 cubic yards', () => {
    expect(calculateCubicYards(15, 60, 6)).toBeCloseTo(16.67, 1);
  });
  
  test('50x12x4in = 7.41 cubic yards', () => {
    expect(calculateCubicYards(50, 12, 4)).toBeCloseTo(7.41, 1);
  });
});
```

**Implementation Notes:**
- [ ] Set up Jest or Vitest
- [ ] Write tests for calculations.js
- [ ] Add to CI/CD pipeline

---

### Issue 10: Rate Limiting
**Status:** ⬜ Not Started  
**Priority:** Low  
**Effort:** 1-2 hours  
**File:** Vercel middleware or API wrapper

**Problem:**  
No protection against abuse or runaway API calls.

**Solution Options:**
1. Vercel Edge Middleware with rate limiting
2. Upstash Redis rate limiter
3. Simple in-memory counter (limited in serverless)

**Implementation Notes:**
- [ ] Choose rate limiting approach
- [ ] Set reasonable limits (e.g., 100 req/min per IP)
- [ ] Add friendly error messages

---

## 🚀 Performance Optimization (Latency)

### Current Latency Issues

**Identified Bottlenecks:**
1. **WooCommerce API Calls** - Each tool call may make 1-3 WooCommerce requests
2. **Sequential Tool Calls** - Tools called one after another, not in parallel
3. **Cold Starts** - Serverless function initialization
4. **Tag ID Lookup** - Two-step process to find products by ZIP

**Optimization Strategies:**

| Strategy | Impact | Effort | Status |
|----------|--------|--------|--------|
| Product caching | High | 1-2 hrs | ⬜ |
| Reduce WooCommerce calls | High | 2-3 hrs | ⬜ |
| Increase function memory | Medium | 5 min | ⬜ |
| Edge functions | Medium | 2-4 hrs | ⬜ |
| Preload product data | Medium | 1-2 hrs | ⬜ |

**See:** `docs/LATENCY_OPTIMIZATION.md` for detailed analysis

---

## Implementation Progress Tracker

| # | Issue | Priority | Status | Assigned | Completed |
|---|-------|----------|--------|----------|-----------|
| 1 | Cart Storage | 🔴 Critical | ⬜ Not Started | | |
| 2 | Checkout Prefill | 🔴 Critical | ⬜ Not Started | | |
| 3 | Material Terminology | 🔴 High | ⬜ Not Started | | |
| 4 | Health Check | 🟡 Medium | ⬜ Not Started | | |
| 5 | Input Validation | 🟡 Medium | ⬜ Not Started | | |
| 6 | Env Var Validation | 🟡 Medium | ⬜ Not Started | | |
| 7 | Request Logging | 🟡 Medium | ⬜ Not Started | | |
| 8 | Response Caching | 🟢 Low | ⬜ Not Started | | |
| 9 | Unit Tests | 🟢 Low | ⬜ Not Started | | |
| 10 | Rate Limiting | 🟢 Low | ⬜ Not Started | | |

---

## Changelog

### December 12, 2025
- Initial project review completed
- Identified 10 improvement areas
- Created implementation plan
- Fixed critical bugs:
  - ✅ ZIP code tag lookup (getProductsByZip)
  - ✅ API backward compatibility (add-to-cart, calculate-delivery, calculate-materials)
  - ✅ Price validation for cart items
  - ✅ System prompt workflow enforcement

---

## Notes

_Add implementation notes, decisions, and observations here:_

- 
- 
- 

---

**Next Review Date:** _______________  
**Review Lead:** _______________

