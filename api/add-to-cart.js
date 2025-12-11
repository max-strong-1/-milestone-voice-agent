/**
 * Add to Cart API
 * Adds calculated materials and delivery to cart
 * Prepares order data for checkout
 * 
 * NOTE: WooCommerce REST API doesn't have direct cart manipulation
 * This creates a pending order or stores cart data for checkout
 */

import { getWooCommerceClient, getProductBySku } from '../lib/woocommerce.js';

/**
 * POST /api/add-to-cart
 * 
 * Body: {
 *   session_id: string (required) - unique identifier for this conversation
 *   items: array (required) - [{sku, product_name, quantity, unit, price_per_ton}, ...]
 *   delivery: object (optional) - {fee, trucks, zip_code, address}
 *   customer_zip: string (optional)
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
      session_id,
      items,
      delivery,
      customer_zip,
      product_id,
      quantity
    } = req.body;

    // Handle simple format (product_id + quantity) or complex format (items array)
    let cartItems = items;
    
    if (!cartItems && product_id && quantity) {
      // Convert simple format to items array
      cartItems = [{
        product_id: product_id,
        quantity: quantity
      }];
    }

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ 
        error: 'No items provided',
        message: "I don't have any items to add to your cart. What materials do you want to order?"
      });
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = [];
    const wc = getWooCommerceClient();

    for (const item of cartItems) {
      // Skip if missing required fields
      if ((!item.sku && !item.product_id) || !item.quantity) continue;

      const quantity = parseFloat(item.quantity);
      
      // If we have product_id but no price, fetch from WooCommerce
      let pricePerTon = parseFloat(item.price_per_ton || item.price || 0);
      let productName = item.product_name || item.name || '';
      let sku = item.sku || '';
      
      if (item.product_id && (!pricePerTon || !productName)) {
        try {
          const response = await wc.get(`products/${item.product_id}`);
          const product = response.data;
          pricePerTon = parseFloat(product.price || 0);
          productName = product.name;
          sku = product.sku;
        } catch (error) {
          console.error(`Error fetching product ${item.product_id}:`, error.message);
          continue;
        }
      }
      
      const itemTotal = quantity * pricePerTon;
      subtotal += itemTotal;
      
      processedItems.push({
        product_id: item.product_id || null,
        sku: sku,
        product_name: productName,
        quantity: quantity,
        unit: item.unit || 'tons',
        price_per_unit: pricePerTon,
        line_total: parseFloat(itemTotal.toFixed(2))
      });
    }

    // Add delivery fee if provided
    let deliveryFee = 0;
    if (delivery && delivery.fee) {
      deliveryFee = parseFloat(delivery.fee);
      subtotal += deliveryFee;
    }

    // Estimate tax (Ohio ~7% average for materials)
    // Actual tax calculated at checkout based on delivery address
    const taxRate = 0.07;
    const taxEstimate = subtotal * taxRate;
    const cartTotal = subtotal + taxEstimate;

    // Generate cart ID
    const cartId = `cart_${session_id || 'guest'}_${Date.now()}`;

    // ============================================
    // CART STORAGE OPTIONS
    // ============================================
    // In production, you would store this cart data:
    // 
    // Option 1: Vercel KV Store
    // await kv.set(cartId, { items: processedItems, delivery, subtotal, ... }, { ex: 86400 });
    //
    // Option 2: Create draft WooCommerce order
    // const order = await wc.post("orders", { status: 'pending', line_items: [...] });
    //
    // Option 3: Use WooCommerce Store API (requires CoCart or similar plugin)
    // 
    // For now, we return the cart data to be passed to checkout
    // ============================================

    // Build response
    const response = {
      cart_id: cartId,
      session_id: session_id,
      items_added: processedItems.length,
      items: processedItems,
      delivery: delivery ? {
        fee: deliveryFee,
        trucks: delivery.trucks || 1,
        zip_code: delivery.zip_code || customer_zip,
        address: delivery.address
      } : null,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_estimate: parseFloat(taxEstimate.toFixed(2)),
      tax_note: "Tax calculated at checkout based on delivery address",
      cart_total: parseFloat(cartTotal.toFixed(2)),
      checkout_ready: true
    };

    // Build message for voice agent
    const itemDescriptions = processedItems.map(item => 
      `${item.quantity} tons of ${item.product_name}`
    ).join(', ');

    let message = `I've added ${itemDescriptions} to your cart.`;
    
    if (deliveryFee > 0) {
      message += ` With delivery, your subtotal is $${subtotal.toFixed(2)}.`;
    } else {
      message += ` Your subtotal is $${subtotal.toFixed(2)}.`;
    }
    
    message += ` Including estimated tax, your total is about $${cartTotal.toFixed(2)}.`;
    message += ` Would you like to proceed to checkout?`;

    response.message = message;

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in add-to-cart:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I had trouble adding items to your cart. Let me try again - what materials did you want to order?"
    });
  }
}
