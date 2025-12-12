/**
 * WooCommerce API Client
 * Handles all interactions with the Milestone Trucks WooCommerce store
 */

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
const WooCommerce = WooCommerceRestApi.default || WooCommerceRestApi;

// ============================================
// CACHING LAYER - Reduces WooCommerce API calls
// ============================================

const cache = {
  products: new Map(),    // ZIP code -> products array
  tags: new Map(),        // ZIP code -> tag ID
  skus: new Map(),        // SKU -> product
};

const CACHE_TTL = {
  products: 5 * 60 * 1000,   // 5 minutes for product lists
  tags: 30 * 60 * 1000,      // 30 minutes for tag IDs (rarely change)
  skus: 10 * 60 * 1000,      // 10 minutes for individual products
};

/**
 * Get item from cache if not expired
 * @param {Map} cacheMap - The cache map to use
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in ms
 * @returns {any|null} Cached value or null if expired/missing
 */
function getCached(cacheMap, key, ttl) {
  const item = cacheMap.get(key);
  if (item && Date.now() - item.timestamp < ttl) {
    return item.data;
  }
  if (item) {
    cacheMap.delete(key); // Clean up expired entry
  }
  return null;
}

/**
 * Set item in cache with timestamp
 * @param {Map} cacheMap - The cache map to use
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
function setCache(cacheMap, key, data) {
  cacheMap.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearCache() {
  cache.products.clear();
  cache.tags.clear();
  cache.skus.clear();
  console.log('WooCommerce cache cleared');
}

/**
 * Get cache statistics for monitoring
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    products: cache.products.size,
    tags: cache.tags.size,
    skus: cache.skus.size,
  };
}

/**
 * Initialize and return WooCommerce API client
 * @returns {WooCommerceRestApi} Configured WooCommerce client
 */
export function getWooCommerceClient() {
  if (!process.env.WOOCOMMERCE_URL) {
    throw new Error("WOOCOMMERCE_URL environment variable is not set");
  }
  if (!process.env.WOOCOMMERCE_CONSUMER_KEY) {
    throw new Error("WOOCOMMERCE_CONSUMER_KEY environment variable is not set");
  }
  if (!process.env.WOOCOMMERCE_CONSUMER_SECRET) {
    throw new Error("WOOCOMMERCE_CONSUMER_SECRET environment variable is not set");
  }

  return new WooCommerce({
    url: process.env.WOOCOMMERCE_URL,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    version: "wc/v3",
    queryStringAuth: true
  });
}

/**
 * Get a specific meta value from a product
 * @param {Object} product - WooCommerce product object
 * @param {string} key - Meta key to retrieve
 * @returns {any} Meta value or null
 */
export function getProductMeta(product, key) {
  if (!product || !product.meta_data) return null;
  const meta = product.meta_data.find(m => m.key === key);
  return meta ? meta.value : null;
}

/**
 * Get products available for a specific ZIP code
 * Products are tagged with ZIP codes they serve
 * Uses caching to reduce WooCommerce API calls
 * @param {string} zipCode - 5-digit ZIP code
 * @returns {Promise<Array>} Array of products
 */
export async function getProductsByZip(zipCode) {
  // Check product cache first
  const cachedProducts = getCached(cache.products, zipCode, CACHE_TTL.products);
  if (cachedProducts) {
    console.log(`[CACHE HIT] Products for ZIP ${zipCode}`);
    return cachedProducts;
  }

  const wc = getWooCommerceClient();
  const startTime = Date.now();
  
  try {
    // Check tag ID cache
    let tagId = getCached(cache.tags, zipCode, CACHE_TTL.tags);
    
    if (!tagId) {
      // Fetch tag ID from WooCommerce
      const tagResponse = await wc.get("products/tags", {
        search: zipCode,
        per_page: 1
      });
      
      // If no tag found, ZIP code not in service area
      if (!tagResponse.data || tagResponse.data.length === 0) {
        // Cache the "not found" result too to avoid repeated lookups
        setCache(cache.products, zipCode, []);
        return [];
      }
      
      tagId = tagResponse.data[0].id;
      setCache(cache.tags, zipCode, tagId);
      console.log(`[CACHE SET] Tag ID ${tagId} for ZIP ${zipCode}`);
    } else {
      console.log(`[CACHE HIT] Tag ID for ZIP ${zipCode}`);
    }
    
    // Now get products with this tag ID
    const response = await wc.get("products", {
      tag: tagId,
      per_page: 100,
      status: "publish"
    });
    
    const products = response.data || [];
    setCache(cache.products, zipCode, products);
    
    const duration = Date.now() - startTime;
    console.log(`[CACHE SET] ${products.length} products for ZIP ${zipCode} (${duration}ms)`);
    
    return products;
  } catch (error) {
    console.error("Error fetching products by ZIP:", error.message);
    return [];
  }
}

/**
 * Get product by SKU
 * Uses caching to reduce WooCommerce API calls
 * @param {string} sku - Product SKU (e.g., "OHMS-6")
 * @returns {Promise<Object|null>} Product object or null
 */
export async function getProductBySku(sku) {
  // Check SKU cache first
  const cachedProduct = getCached(cache.skus, sku, CACHE_TTL.skus);
  if (cachedProduct !== null) {
    console.log(`[CACHE HIT] Product SKU ${sku}`);
    return cachedProduct;
  }

  const wc = getWooCommerceClient();
  const startTime = Date.now();
  
  try {
    const response = await wc.get("products", {
      sku: sku,
      per_page: 1
    });
    
    const product = response.data && response.data.length > 0 ? response.data[0] : null;
    
    // Cache the result (even null to avoid repeated lookups for invalid SKUs)
    setCache(cache.skus, sku, product);
    
    const duration = Date.now() - startTime;
    console.log(`[CACHE SET] Product SKU ${sku} (${duration}ms)`);
    
    return product;
  } catch (error) {
    console.error("Error fetching product by SKU:", error.message);
    return null;
  }
}

/**
 * Get material density (tons per cubic yard)
 * Used for converting cubic yards to tons
 * @param {Object} product - WooCommerce product object
 * @returns {number} Density value (default 1.4)
 */
export function getProductDensity(product) {
  const density = getProductMeta(product, "density");
  if (density) {
    const parsed = parseFloat(density);
    return isNaN(parsed) ? 1.4 : parsed;
  }
  return 1.4; // Default density for gravel/stone
}

/**
 * Get maximum truck capacity for a product
 * @param {Object} product - WooCommerce product object
 * @returns {number} Max tons per truck (default 18)
 */
export function getTruckCapacity(product) {
  const capacity = getProductMeta(product, "truck_max_quantity");
  if (capacity) {
    const parsed = parseInt(capacity);
    return isNaN(parsed) ? 18 : parsed;
  }
  return 18; // Default truck capacity
}

/**
 * Get minimum order quantity in tons
 * @param {Object} product - WooCommerce product object
 * @returns {number} Minimum tons (default 3)
 */
export function getMinimumOrder(product) {
  const min = getProductMeta(product, "minimum_quantity");
  if (min) {
    const parsed = parseInt(min);
    return isNaN(parsed) ? 3 : parsed;
  }
  return 3; // Default minimum order
}

/**
 * Get orders by phone number or email
 * @param {Object} searchParams - Search parameters
 * @param {string} [searchParams.phone] - Customer phone
 * @param {string} [searchParams.email] - Customer email
 * @returns {Promise<Array>} Array of orders
 */
export async function getOrdersByCustomer(searchParams) {
  const wc = getWooCommerceClient();
  
  try {
    const params = {
      per_page: 10,
      orderby: 'date',
      order: 'desc'
    };

    if (searchParams.email) {
      params.search = searchParams.email;
    }

    const response = await wc.get("orders", params);
    let orders = response.data || [];

    // Filter by phone if provided
    if (searchParams.phone && orders.length > 0) {
      const cleanPhone = searchParams.phone.replace(/\D/g, '');
      orders = orders.filter(order => {
        const orderPhone = (order.billing?.phone || '').replace(/\D/g, '');
        return orderPhone.includes(cleanPhone) || cleanPhone.includes(orderPhone);
      });
    }

    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return [];
  }
}

/**
 * Get a specific order by ID
 * @param {string|number} orderId - WooCommerce order ID
 * @returns {Promise<Object|null>} Order object or null
 */
export async function getOrderById(orderId) {
  const wc = getWooCommerceClient();
  
  try {
    const response = await wc.get(`orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order:", error.message);
    return null;
  }
}

/**
 * Extract clean product name from WooCommerce title
 * Removes " | STONE DELIVERY | Location" suffix
 * @param {string} fullName - Full product name
 * @returns {string} Clean product name
 */
export function getCleanProductName(fullName) {
  if (!fullName) return '';
  return fullName.split('|')[0].trim();
}

/**
 * Parse yard/location name from product category
 * @param {Object} product - WooCommerce product object
 * @returns {string} Yard/location name
 */
export function getYardFromProduct(product) {
  // Try to get from map_title meta
  const mapTitle = getProductMeta(product, 'map_title');
  if (mapTitle) return mapTitle;

  // Try to parse from category
  if (product.categories && product.categories.length > 0) {
    const category = product.categories[0].name;
    const match = category.match(/Gravel & Stone (.+)/);
    if (match) return match[1];
    return category;
  }

  // Try to parse from product name
  const nameParts = product.name.split('|');
  if (nameParts.length >= 3) {
    return nameParts[2].trim();
  }

  return 'Local Yard';
}
