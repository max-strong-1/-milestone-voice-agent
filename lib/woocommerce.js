/**
 * WooCommerce API Client
 * Handles all interactions with the Milestone Trucks WooCommerce store
 */

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

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

  return new WooCommerceRestApi({
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
 * @param {string} zipCode - 5-digit ZIP code
 * @returns {Promise<Array>} Array of products
 */
export async function getProductsByZip(zipCode) {
  const wc = getWooCommerceClient();
  
  try {
    const response = await wc.get("products", {
      tag: zipCode,
      per_page: 100,
      status: "publish"
    });
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching products by ZIP:", error.message);
    return [];
  }
}

/**
 * Get product by SKU
 * @param {string} sku - Product SKU (e.g., "OHMS-6")
 * @returns {Promise<Object|null>} Product object or null
 */
export async function getProductBySku(sku) {
  const wc = getWooCommerceClient();
  
  try {
    const response = await wc.get("products", {
      sku: sku,
      per_page: 1
    });
    
    return response.data && response.data.length > 0 ? response.data[0] : null;
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
