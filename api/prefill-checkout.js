/**
 * Prefill Checkout API
 * Prepares checkout with customer information collected during conversation
 * Returns checkout URL for the voice agent to direct the customer
 */

/**
 * POST /api/prefill-checkout
 * 
 * Body: {
 *   cart_id: string (required)
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
      cart_id,
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

    // Validate required fields
    if (!cart_id) {
      return res.status(400).json({ 
        error: 'Missing cart_id',
        message: "I don't have your cart information. Let me add your items to the cart first."
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

    // Build checkout URL
    // WooCommerce checkout page (from screenshots: ID 10)
    const baseUrl = process.env.WOOCOMMERCE_URL || 'https://milestonetrucks.com';
    let checkoutUrl = `${baseUrl}/checkout/`;

    // ============================================
    // CHECKOUT PREFILL OPTIONS
    // ============================================
    // 
    // Option 1: URL Parameters (limited support in WooCommerce)
    // WooCommerce doesn't natively support prefilling checkout via URL params
    //
    // Option 2: Create pending order with customer data
    // Use WooCommerce REST API to create order with billing/shipping info
    //
    // Option 3: Custom WordPress solution
    // Create a custom endpoint that sets session data for checkout
    //
    // Option 4: Use a plugin like "Checkout Field Editor"
    // Some plugins support URL-based prefilling
    //
    // For now, we prepare the data and provide the checkout URL
    // The customer will need to enter details at checkout
    // ============================================

    // Parse customer name into first/last
    const nameParts = customer_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Prepare customer data for checkout
    const customerData = {
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
      customer_note: delivery_notes || ''
    };

    // If delivery date requested, add to notes
    if (delivery_date) {
      customerData.customer_note = `Requested delivery date: ${delivery_date}. ${customerData.customer_note}`;
    }

    // Build response
    const response = {
      checkout_url: checkoutUrl,
      cart_id: cart_id,
      customer_data: customerData,
      prefilled_fields: [
        'first_name',
        'last_name',
        'phone',
        delivery_address ? 'address' : null,
        city ? 'city' : null,
        state ? 'state' : null,
        zip_code ? 'postcode' : null,
        email ? 'email' : null,
        company ? 'company' : null
      ].filter(Boolean),
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

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in prefill-checkout:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I had trouble setting up checkout. Let me give you the checkout link and you can enter your information there. Or I can give you our phone number to complete the order."
    });
  }
}
