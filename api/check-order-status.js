/**
 * Check Order Status API
 * Retrieves order information for returning customers
 * Can lookup by order ID, phone number, or email
 */

import { 
  getWooCommerceClient, 
  getOrderById, 
  getOrdersByCustomer,
  getCleanProductName 
} from '../lib/woocommerce.js';

/**
 * POST /api/check-order-status
 * 
 * Body: {
 *   order_id: string (optional) - WooCommerce order ID
 *   phone: string (optional) - Customer phone number
 *   email: string (optional) - Customer email
 * }
 * 
 * At least one of order_id, phone, or email must be provided
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
    const { order_id, phone, email } = req.body;

    // Validate - need at least one identifier
    if (!order_id && !phone && !email) {
      return res.status(400).json({ 
        error: 'Missing identifier',
        message: "I can look up your order, but I'll need either your order number, phone number, or email address. Which one can you give me?"
      });
    }

    let order = null;
    let orders = [];

    // Try to find order by ID first (most specific)
    if (order_id) {
      const cleanOrderId = order_id.toString().replace(/[^0-9]/g, '');
      
      if (cleanOrderId) {
        order = await getOrderById(cleanOrderId);
        
        if (!order) {
          return res.status(404).json({
            found: false,
            message: `I couldn't find an order with number ${cleanOrderId}. Can you double-check the order number? It should have been in your confirmation email.`
          });
        }
      }
    }

    // If no order found by ID, search by phone or email
    if (!order) {
      orders = await getOrdersByCustomer({ phone, email });
      
      if (!orders || orders.length === 0) {
        let searchedBy = [];
        if (phone) searchedBy.push(`phone number ending in ${phone.slice(-4)}`);
        if (email) searchedBy.push(`email ${email}`);
        
        return res.status(404).json({
          found: false,
          message: `I couldn't find any orders with that ${searchedBy.join(' or ')}. Do you have your order number handy? It would have been in your confirmation email.`
        });
      }
      
      // Get most recent order
      order = orders[0];
    }

    // Order status descriptions
    const statusInfo = {
      'pending': {
        display: 'Pending',
        description: 'Waiting for payment confirmation',
        next_step: 'Once payment is confirmed, we\'ll schedule your delivery.'
      },
      'processing': {
        display: 'Processing',
        description: 'Being processed and scheduled for delivery',
        next_step: 'Our team is preparing your order. You\'ll receive a call 24 hours before delivery.'
      },
      'on-hold': {
        display: 'On Hold',
        description: 'On hold - our team will contact you',
        next_step: 'Someone from our team will reach out to you shortly.'
      },
      'completed': {
        display: 'Delivered',
        description: 'Has been delivered',
        next_step: 'We hope everything looks great! Let us know if you need anything else.'
      },
      'cancelled': {
        display: 'Cancelled',
        description: 'Was cancelled',
        next_step: 'If you\'d like to place a new order, I can help with that.'
      },
      'refunded': {
        display: 'Refunded',
        description: 'Has been refunded',
        next_step: 'The refund should appear in your account within 5-7 business days.'
      },
      'failed': {
        display: 'Payment Failed',
        description: 'Payment failed',
        next_step: 'You may need to update your payment method or try again.'
      }
    };

    const status = statusInfo[order.status] || {
      display: order.status,
      description: 'is being processed',
      next_step: 'Our team is working on it.'
    };

    // Extract delivery info from order meta
    const getMetaValue = (key) => {
      const meta = order.meta_data?.find(m => m.key === key);
      return meta ? meta.value : null;
    };

    const deliveryDate = getMetaValue('delivery_date') || getMetaValue('_delivery_date');
    const deliveryTime = getMetaValue('delivery_time') || getMetaValue('_delivery_time');

    // Format line items
    const items = order.line_items?.map(item => ({
      name: getCleanProductName(item.name),
      quantity: item.quantity,
      total: parseFloat(item.total)
    })) || [];

    // Build response
    const response = {
      found: true,
      order_id: order.id,
      order_number: order.number || order.id,
      status: order.status,
      status_display: status.display,
      status_description: status.description,
      order_date: order.date_created,
      total: parseFloat(order.total),
      items: items,
      delivery: {
        date: deliveryDate,
        time: deliveryTime,
        address: order.shipping ? 
          `${order.shipping.address_1}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postcode}` : 
          null
      },
      billing: {
        name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        email: order.billing?.email,
        phone: order.billing?.phone
      }
    };

    // Build message for voice agent
    let message = `I found your order number ${order.id}. `;
    message += `Your order ${status.description}. `;
    
    if (deliveryDate) {
      message += `Delivery is scheduled for ${deliveryDate}`;
      if (deliveryTime) message += ` between ${deliveryTime}`;
      message += `. `;
    }
    
    message += status.next_step;

    // If multiple orders found, mention that
    if (orders.length > 1) {
      message += ` I found ${orders.length} orders on your account. This is the most recent one. Would you like information about a different order?`;
      response.total_orders_found = orders.length;
    }

    response.message = message;

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in check-order-status:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I'm having trouble looking up your order right now. Can you call us at our main number and someone can help you with your order status?"
    });
  }
}
