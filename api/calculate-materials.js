/**
 * Calculate Materials API
 * Calculates exact quantities needed based on project dimensions
 * Returns quantities in tons, cubic yards, and truck loads with pricing
 */

import { 
  getWooCommerceClient,
  getProductBySku,
  getProductDensity, 
  getTruckCapacity,
  getCleanProductName
} from '../lib/woocommerce.js';

import { 
  calculateMaterialQuantities,
  formatNumber,
  formatCurrency,
  explainQuantity
} from '../lib/calculations.js';

/**
 * POST /api/calculate-materials
 * 
 * Body: {
 *   length_ft: number (required)
 *   width_ft: number (required)
 *   depth_inches: number (required)
 *   materials: array (required) - [{sku: string}, ...]
 *   zip_code: string (optional) - for verification
 * }
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      length_ft, 
      width_ft, 
      depth_inches, 
      materials,
      zip_code
    } = req.body;

    // Validate required inputs
    if (!length_ft || !width_ft || !depth_inches) {
      return res.status(400).json({ 
        error: 'Missing dimensions',
        message: "I need the dimensions to calculate materials. What's the length, width, and depth you're looking for?"
      });
    }

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ 
        error: 'Missing materials',
        message: "I need to know which materials to calculate. Let me recommend some based on your project first."
      });
    }

    // Parse dimensions (handle strings like "50" or "50 feet")
    const length = parseFloat(length_ft.toString().replace(/[^0-9.]/g, ''));
    const width = parseFloat(width_ft.toString().replace(/[^0-9.]/g, ''));
    const depth = parseFloat(depth_inches.toString().replace(/[^0-9.]/g, ''));

    if (isNaN(length) || isNaN(width) || isNaN(depth)) {
      return res.status(400).json({
        error: 'Invalid dimensions',
        message: "I couldn't understand those measurements. Can you give me the length and width in feet, and the depth in inches?"
      });
    }

    if (length <= 0 || width <= 0 || depth <= 0) {
      return res.status(400).json({
        error: 'Invalid dimensions',
        message: "The measurements need to be greater than zero. What are the actual dimensions of your project area?"
      });
    }

    const wc = getWooCommerceClient();
    const results = [];
    let subtotal = 0;
    let totalTons = 0;

    // Calculate for each material
    for (const material of materials) {
      if (!material.sku) continue;

      // Fetch product details from WooCommerce
      let product;
      try {
        const response = await wc.get("products", {
          sku: material.sku,
          per_page: 1
        });
        
        if (response.data && response.data.length > 0) {
          product = response.data[0];
        }
      } catch (err) {
        console.error(`Error fetching product ${material.sku}:`, err.message);
        continue;
      }

      if (!product) {
        console.warn(`Product not found: ${material.sku}`);
        continue;
      }

      const productName = getCleanProductName(product.name);
      const pricePerTon = parseFloat(product.price);
      const density = getProductDensity(product);
      const truckCapacity = getTruckCapacity(product);

      // Calculate quantities
      const calculation = calculateMaterialQuantities({
        lengthFt: length,
        widthFt: width,
        depthInches: depth,
        pricePerTon,
        density,
        truckCapacity
      });

      subtotal += calculation.pricing.total_price;
      totalTons += calculation.quantities.tons;

      results.push({
        sku: material.sku,
        product_id: product.id,
        product_name: productName,
        quantity_cubic_yards: calculation.quantities.cubic_yards,
        quantity_tons: calculation.quantities.tons,
        quantity_truck_loads: calculation.quantities.truck_loads,
        price_per_ton: pricePerTon,
        total_price: calculation.pricing.total_price,
        price_per_sq_ft: calculation.pricing.price_per_sq_ft,
        explanation: `${formatNumber(calculation.quantities.tons)} tons of ${productName} - ${explainQuantity(calculation.quantities.tons)}`
      });
    }

    if (results.length === 0) {
      return res.status(400).json({
        error: 'No valid materials',
        message: "I couldn't find the materials you specified. Let me help you pick the right ones for your project."
      });
    }

    const squareFeet = length * width;
    
    return res.status(200).json({
      dimensions: {
        length_ft: length,
        width_ft: width,
        depth_inches: depth,
        square_feet: squareFeet
      },
      materials: results,
      totals: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        total_tons: parseFloat(totalTons.toFixed(1)),
        total_truck_loads: Math.ceil(totalTons / 18)
      },
      message: `For your ${length} by ${width} foot area (${squareFeet} square feet) at ${depth} inches deep, here's what you'll need: ${results.map(r => `${r.quantity_tons} tons of ${r.product_name}`).join(', ')}. Your material total is ${formatCurrency(subtotal)}.`
    });

  } catch (error) {
    console.error('Error in calculate-materials:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I'm having trouble calculating the quantities right now. Can you give me the dimensions again?"
    });
  }
}
