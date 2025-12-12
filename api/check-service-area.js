/**
 * Check Service Area API
 * Validates if Milestone Trucks delivers to a customer's ZIP code
 * Returns available products for that area
 * 
 * This should be called FIRST in every conversation before discussing products
 */

import { 
  getProductsByZip, 
  getProductDensity, 
  getTruckCapacity, 
  getMinimumOrder,
  getCleanProductName,
  getYardFromProduct 
} from '../lib/woocommerce.js';

/**
 * POST /api/check-service-area
 * 
 * Body: { zip_code: string }
 * 
 * Returns:
 * - serviceable: boolean
 * - zip_code: string
 * - zone_name: string (yard/location name)
 * - yard_location: string
 * - available_products: array of products
 * - message: string (for Robert to speak)
 */
export default async function handler(req, res) {
  // CORS headers for ElevenLabs webhook
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { zip_code } = req.body;

    // Validate input
    if (!zip_code) {
      return res.status(400).json({ 
        error: 'Missing required parameter',
        message: 'I need your delivery ZIP code to check if we service your area. What ZIP code would you like me to check?'
      });
    }

    // Clean ZIP code (remove spaces, dashes, non-numeric)
    const cleanZip = zip_code.toString().replace(/[^0-9]/g, '').substring(0, 5);

    if (cleanZip.length !== 5) {
      return res.status(400).json({
        error: 'Invalid ZIP code format',
        message: `"${zip_code}" doesn't look like a valid ZIP code. Can you give me the 5-digit ZIP code for your delivery address?`
      });
    }

    // Query WooCommerce for products tagged with this ZIP code
    const products = await getProductsByZip(cleanZip);

    // ZIP code not in service area
    if (!products || products.length === 0) {
      return res.status(200).json({
        serviceable: false,
        zip_code: cleanZip,
        zone_name: null,
        yard_location: null,
        available_products: [],
        message: `I'm sorry, we don't currently deliver to ZIP code ${cleanZip}. We service areas in Ohio, Indiana, Pennsylvania, West Virginia, Kentucky, and Michigan. Would you like me to check a different ZIP code, or I can give you our phone number to ask about delivery options?`
      });
    }

    // Extract yard/location information from products
    const firstProduct = products[0];
    const yardLocation = getYardFromProduct(firstProduct);

    // Format available products for response
    const availableProducts = products.map(product => ({
      product_id: product.id,
      sku: product.sku,
      name: getCleanProductName(product.name),
      full_name: product.name,
      price_per_ton: parseFloat(product.price),
      max_load_tons: getTruckCapacity(product),
      minimum_tons: getMinimumOrder(product),
      density: getProductDensity(product),
      in_stock: product.stock_status === 'instock',
      description: product.short_description || ''
    }));

    // Count unique material types
    const uniqueMaterials = new Set(availableProducts.map(p => p.name)).size;

    return res.status(200).json({
      serviceable: true,
      zip_code: cleanZip,
      zone_name: yardLocation,
      yard_location: yardLocation,
      available_products: availableProducts,
      message: `Great news! We service your area from our ${yardLocation} location. We have ${uniqueMaterials} different materials available for delivery. What kind of project are you working on?`
    });

  } catch (error) {
    console.error('Error in check-service-area:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I'm having trouble checking our service areas right now. Can you give me a moment and try again, or I can give you our phone number to check directly?"
    });
  }
}
