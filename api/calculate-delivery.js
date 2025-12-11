/**
 * Calculate Delivery API
 * Calculates delivery fee based on location and order weight
 * 
 * NOTE: The "Shipping Zones by Drawing Premium" plugin calculates fees dynamically
 * This endpoint provides estimates. Actual fees are calculated at checkout.
 */

import { getWooCommerceClient } from '../lib/woocommerce.js';

/**
 * POST /api/calculate-delivery
 * 
 * Body: {
 *   zip_code: string (required)
 *   delivery_address: string (required)
 *   total_weight_tons: number (required)
 *   total_volume_cubic_yards: number (optional)
 *   yard_code: string (optional)
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
      zip_code,
      delivery_address,
      total_weight_tons,
      total_volume_cubic_yards,
      yard_code
    } = req.body;

    // Validate required fields
    if (!zip_code) {
      return res.status(400).json({ 
        error: 'Missing zip_code',
        message: "I need your delivery ZIP code to calculate the delivery fee."
      });
    }

    if (!total_weight_tons || total_weight_tons <= 0) {
      return res.status(400).json({ 
        error: 'Missing total_weight_tons',
        message: "I need to know the total weight to calculate delivery. Let me calculate your material quantities first."
      });
    }

    // Parse weight
    const weight = parseFloat(total_weight_tons);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({
        error: 'Invalid weight',
        message: "I couldn't understand the weight. Let me recalculate your material quantities."
      });
    }

    // Calculate number of trucks needed
    // Max 18 tons per truck (based on product settings from screenshots)
    const truckCapacity = 18;
    const trucksRequired = Math.ceil(weight / truckCapacity);

    // ============================================
    // DELIVERY FEE CALCULATION
    // ============================================
    // 
    // The "Shipping Zones by Drawing Premium" plugin calculates actual fees
    // at checkout based on the customer's exact delivery address.
    // 
    // This provides an ESTIMATE for the voice agent to quote.
    // The actual fee may vary slightly at checkout.
    //
    // Milestone Trucks delivery fee structure (estimated):
    // - Base fee: Varies by zone ($150-$300)
    // - Per-load fee: Based on distance/zone
    // - Multiple trucks: Each additional truck adds to the fee
    //
    // For accurate production pricing, you could:
    // 1. Create a custom WordPress endpoint that calls the shipping plugin
    // 2. Maintain a zone-to-fee lookup table
    // 3. Use WooCommerce shipping calculation API
    // ============================================

    // Estimate delivery fee
    // This is a simplified calculation - adjust based on actual pricing structure
    const baseDeliveryFee = 200;  // Base fee for first truck
    const additionalTruckFee = 150;  // Fee for each additional truck
    
    let deliveryFee = baseDeliveryFee;
    if (trucksRequired > 1) {
      deliveryFee += (trucksRequired - 1) * additionalTruckFee;
    }

    // Create response
    const response = {
      delivery_fee: parseFloat(deliveryFee.toFixed(2)),
      delivery_fee_taxable: true,
      delivery_fee_note: "Estimated. Final fee calculated at checkout based on exact address.",
      trucks_required: trucksRequired,
      truck_capacity_tons: truckCapacity,
      total_weight_tons: weight,
      delivery_timeframe: "2-3 business days after order",
      delivery_notes: "Our delivery trucks require 10 feet of overhead clearance and about 45 feet of turning space. The driver will call you 24 hours before delivery to confirm timing and access.",
      delivery_requirements: [
        "10 feet overhead clearance for truck",
        "45 feet turning radius",
        "Accessible from paved road",
        "Driver will call 24 hours before delivery"
      ]
    };

    // Build message for voice agent
    let message = `Delivery to ${zip_code} is approximately $${deliveryFee.toFixed(2)}`;
    
    if (trucksRequired > 1) {
      message += ` for ${trucksRequired} truck loads`;
    }
    
    message += `. The driver will call you 24 hours before delivery to confirm timing. Just make sure you have about 10 feet of overhead clearance where you want the material dumped.`;

    response.message = message;

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in calculate-delivery:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I'm having trouble calculating delivery costs right now. The exact fee will be shown at checkout, or I can give you our phone number to get a quote."
    });
  }
}
