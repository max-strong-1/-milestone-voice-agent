/**
 * Prefill Checkout API
 * Updates the pending WooCommerce order with customer information
 * Returns checkout URL for the customer to complete payment
 */

import { getWooCommerceClient } from '../lib/woocommerce.js';
import { logApiRequest, startTimer } from '../lib/logger.js';

/**
 * POST /api/prefill-checkout
 * 
 * Body: {
 *   order_id: number (required) - from add-to-cart response
 *   order_key: string (optional) - for checkout URL
 *   customer_name: string (required)
 *   delivery_address: string (required)
 *   city: string (required)
 *   state: string (required)
 *   zip_code: string (required)
 *   phone: string (required)
 *   email: string (optional)
 *   company: string (optional)
 *   delivery_notes: string (optional)
 *   delivery_date: string (optional)
 * }
 */
export default async function handler(req, res) {
  const getElapsed = startTimer();
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
      order_id,
      order_key,
      cart_id,  // Legacy support
      customer_name,
      delivery_address,
      city,
      state,
      zip_code,
      phone,
      email,
      company,
      delivery_notes,
      delivery_date
    } = req.body;

    // Validate required fields - need order_id from add-to-cart
    if (!order_id && !cart_id) {
      return res.status(400).json({ 
        error: 'Missing order_id',
        message: "I don't have your order information. Let me add your items to the cart first."
      });
    }

    // Validate customer info (at minimum need name and phone)
    if (!customer_name) {
      return res.status(400).json({
        error: 'Missing customer_name',
        message: "I'll need your name for the order. What name should I put this under?"
      });
    }

    if (!phone) {
      return res.status(400).json({
        error: 'Missing phone',
        message: "I'll need a phone number so our driver can reach you before delivery. What's the best number?"
      });
    }

    // Parse customer name into first/last
    const nameParts = customer_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Build customer note with delivery info
    let customerNote = '';
    if (delivery_date) {
      customerNote += `Requested delivery date: ${delivery_date}. `;
    }
    if (delivery_notes) {
      customerNote += delivery_notes;
    }

    // ============================================
    // UPDATE WOOCOMMERCE ORDER WITH CUSTOMER DATA
    // ============================================
    const wc = getWooCommerceClient();
    const baseUrl = process.env.WOOCOMMERCE_URL || 'https://milestonetrucks.com';
    let checkoutUrl = `${baseUrl}/checkout/`;
    let updatedOrderKey = order_key;

    if (order_id) {
      try {
        const updateData = {
          billing: {
            first_name: firstName,
            last_name: lastName,
            company: company || '',
            address_1: delivery_address || '',
            city: city || '',
            state: state || 'OH',
            postcode: zip_code || '',
            phone: cleanPhone,
            email: email || ''
          },
          shipping: {
            first_name: firstName,
            last_name: lastName,
            company: company || '',
            address_1: delivery_address || '',
            city: city || '',
            state: state || 'OH',
            postcode: zip_code || ''
          },
          customer_note: customerNote
        };

        const orderResponse = await wc.put(`orders/${order_id}`, updateData);
        updatedOrderKey = orderResponse.data.order_key;
        
        // Build checkout URL for this specific order
        checkoutUrl = `${baseUrl}/checkout/order-pay/${order_id}/?pay_for_order=true&key=${updatedOrderKey}`;
        
        console.log(`Updated order ${order_id} with customer info`);
      } catch (updateError) {
        console.error('Error updating WooCommerce order:', updateError.message);
        // Continue with generic checkout URL
      }
    }

    // Build response
    const response = {
      checkout_url: checkoutUrl,
      order_id: order_id || null,
      order_key: updatedOrderKey || null,
      customer_data: {
        first_name: firstName,
        last_name: lastName,
        phone: cleanPhone,
        email: email || '',
        address: delivery_address || '',
        city: city || '',
        state: state || 'OH',
        zip_code: zip_code || ''
      },
      delivery_date: delivery_date || null,
      delivery_notes: delivery_notes || null,
      ready_for_checkout: true
    };

    // Build message for voice agent
    let message = `Perfect! I'm sending you to checkout now.`;
    
    if (delivery_date) {
      message += ` I've noted that you'd like delivery on ${delivery_date}.`;
    }
    
    message += ` Your information is ready - you'll just need to review it and add your payment details to complete the order.`;
    
    if (delivery_notes) {
      message += ` I've included your delivery instructions.`;
    }
    
    message += ` After you place the order, you'll get a confirmation email and our driver will call you 24 hours before delivery.`;

    response.message = message;

    logApiRequest('prefill-checkout', {
      request: { order_id, customer_name, zip_code },  // Don't log full address
      response,
      status: 200,
      duration_ms: getElapsed()
    });

    return res.status(200).json(response);

  } catch (error) {
    logApiRequest('prefill-checkout', {
      request: req.body,
      status: 500,
      duration_ms: getElapsed(),
      error
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I had trouble setting up checkout. Let me give you the checkout link and you can enter your information there. Or I can give you our phone number to complete the order."
    });
  }
}
