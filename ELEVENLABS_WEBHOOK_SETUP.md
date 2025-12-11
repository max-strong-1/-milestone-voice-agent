# ElevenLabs Webhook Setup Instructions for Robert (Milestone Trucks Voice Agent)

## Your Vercel Deployment URL
```
https://milestone-voice-agent.vercel.app
```

## Setup Steps

### 1. Go to ElevenLabs
1. Visit: https://elevenlabs.io/app/agents
2. Create a new agent or edit existing agent named "Robert - Milestone Trucks"

### 2. Configure Basic Settings
- **Name**: Robert - Milestone Trucks
- **Language**: English
- **Voice**: Choose a friendly, professional male voice (e.g., "Daniel" or "Adam")
- **Model**: Claude 3.5 Sonnet (recommended) or GPT-4
- **Temperature**: 0.7

### 3. Add System Prompt
Copy and paste the system prompt from `/docs/SYSTEM_PROMPT.md` in this repository.

### 4. Add These 7 Webhook Tools

For each tool below:
1. Click **"Add Tool"** → **"Webhook"**
2. Copy the exact configuration provided

---

## Tool 1: check_service_area

**Name:** `check_service_area`

**Description:**
```
Validates if Milestone Trucks delivers to a customer's ZIP code and returns available products for that area. ALWAYS call this FIRST before discussing any products or pricing. This confirms we can serve the customer.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/check-service-area
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `zip_code` (string, required) - The customer's 5-digit delivery ZIP code

**Example Request Body:**
```json
{
  "zip_code": "45640"
}
```

---

## Tool 2: get_material_recommendations

**Name:** `get_material_recommendations`

**Description:**
```
Provides educational material recommendations based on the customer's project type. Use this after confirming service area. Returns what materials they need, why they need them, and common mistakes to avoid.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/get-material-recommendations
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `project_type` (string, required) - Type of project: driveway, walkway, patio, drainage, or landscaping
- `zip_code` (string, required) - Customer's ZIP code (from check_service_area)
- `current_surface` (string, optional) - What's currently there: dirt, grass, old asphalt, or gravel
- `final_surface` (string, optional) - Final surface plan: stay gravel, pave later, or pavers
- `vehicle_type` (string, optional) - For driveways: cars, light trucks, heavy trucks, or RVs

**Example Request Body:**
```json
{
  "project_type": "driveway",
  "zip_code": "45640",
  "current_surface": "dirt",
  "final_surface": "pave later",
  "vehicle_type": "cars"
}
```

---

## Tool 3: calculate_materials

**Name:** `calculate_materials`

**Description:**
```
Calculates exact quantities needed based on project dimensions. Call this after the customer provides their measurements (length, width, depth). Returns tons, cubic yards, truck loads, and pricing.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/calculate-materials
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `length_ft` (number, required) - Length of the area in feet
- `width_ft` (number, required) - Width of the area in feet
- `depth_inches` (number, required) - Depth in inches (typically 2-6)
- `materials` (array, required) - Array of material objects with 'sku' field from recommendations

**Example Request Body:**
```json
{
  "length_ft": 50,
  "width_ft": 12,
  "depth_inches": 4,
  "materials": [
    {"sku": "OHMS-6"},
    {"sku": "OHMS-9"}
  ]
}
```

---

## Tool 4: calculate_delivery

**Name:** `calculate_delivery`

**Description:**
```
Calculates delivery fee based on location and order weight. Call this after calculating materials to give the customer a complete quote including delivery.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/calculate-delivery
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `zip_code` (string, required) - Delivery ZIP code
- `delivery_address` (string, required) - Full street address for delivery
- `total_weight_tons` (number, required) - Total weight in tons from calculate_materials

**Example Request Body:**
```json
{
  "zip_code": "45640",
  "delivery_address": "123 Main Street",
  "total_weight_tons": 15.5
}
```

---

## Tool 5: add_to_cart

**Name:** `add_to_cart`

**Description:**
```
Adds calculated materials to the customer's cart. Use this when the customer confirms they want to proceed with the order.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/add-to-cart
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `session_id` (string, required) - Unique session ID (generate one like "session_" + timestamp)
- `items` (array, required) - Array of items with sku, product_name, quantity, price_per_ton
- `delivery` (object, optional) - Delivery info: {fee, trucks, zip_code}

**Example Request Body:**
```json
{
  "session_id": "session_1734567890",
  "items": [
    {
      "sku": "OHMS-6",
      "product_name": "3/4\" Base Gravel",
      "quantity": 10.5,
      "price_per_ton": 45.00
    }
  ],
  "delivery": {
    "fee": 150.00,
    "trucks": 1,
    "zip_code": "45640"
  }
}
```

---

## Tool 6: prefill_checkout

**Name:** `prefill_checkout`

**Description:**
```
Prepares checkout with customer information collected during conversation. Call this right before directing the customer to checkout.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/prefill-checkout
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `cart_id` (string, required) - Cart ID from add_to_cart
- `customer_name` (string, required) - Customer's full name
- `delivery_address` (string, required) - Street address
- `city` (string, required) - City
- `state` (string, required) - State (2-letter code)
- `zip_code` (string, required) - ZIP code
- `phone` (string, required) - Phone number
- `email` (string, optional) - Email address
- `delivery_notes` (string, optional) - Special delivery instructions
- `delivery_date` (string, optional) - Requested delivery date

**Example Request Body:**
```json
{
  "cart_id": "cart_abc123",
  "customer_name": "John Smith",
  "delivery_address": "123 Main Street",
  "city": "Columbus",
  "state": "OH",
  "zip_code": "45640",
  "phone": "614-555-1234",
  "email": "john@example.com",
  "delivery_notes": "Please call before delivery",
  "delivery_date": "2024-12-15"
}
```

---

## Tool 7: check_order_status

**Name:** `check_order_status`

**Description:**
```
Looks up order status for returning customers. Use when someone asks about their existing order, delivery status, or tracking.
```

**Method:** POST

**URL:**
```
https://milestone-voice-agent.vercel.app/api/check-order-status
```

**Headers:**
```
Content-Type: application/json
```

**Body Parameters:**
- `order_id` (string, optional) - Order number (if customer has it)
- `phone` (string, optional) - Phone number used for order
- `email` (string, optional) - Email used for order

*At least one parameter must be provided*

**Example Request Body:**
```json
{
  "phone": "614-555-1234"
}
```

---

## Testing Your Setup

After configuring all tools in ElevenLabs, test the conversation flow:

1. **Test Service Area Check**
   - Say: "Hi Robert, I'm in ZIP code 45640"
   - Verify it calls `check_service_area`

2. **Test Material Recommendations**
   - Say: "I'm building a driveway"
   - Verify it calls `get_material_recommendations`

3. **Test Material Calculation**
   - Say: "It's 50 feet long and 12 feet wide, 4 inches deep"
   - Verify it calls `calculate_materials`

4. **Test Delivery Quote**
   - Provide an address
   - Verify it calls `calculate_delivery`

5. **Test Cart/Checkout**
   - Say: "Yes, I want to order"
   - Verify it calls `add_to_cart` and `prefill_checkout`

---

## Troubleshooting

### Tool Not Calling
- Verify webhook URL is exactly as shown above
- Check that all required parameters are marked correctly
- Review ElevenLabs tool execution logs

### Getting Errors
- Check Vercel function logs at: https://vercel.com/kels-projects-9ec3fa5c/milestone-voice-agent
- Verify environment variables are set in Vercel
- Test endpoints directly with curl (examples in README.md)

### Wrong Responses
- Review the system prompt in `/docs/SYSTEM_PROMPT.md`
- Check tool descriptions match the functions
- Verify parameter types (string vs number)

---

## Important Notes

1. **Always call `check_service_area` FIRST** - This is critical to the conversation flow
2. **Use exact URLs** - Don't modify the webhook URLs
3. **Parameter types matter** - Numbers should be sent as numbers, not strings
4. **Required vs Optional** - Mark parameters correctly in ElevenLabs or the API will fail
5. **Test thoroughly** - Walk through the entire conversation flow before going live

---

## Additional Resources

- Full ElevenLabs setup guide: `/docs/ELEVENLABS_SETUP.md`
- System prompt: `/docs/SYSTEM_PROMPT.md`
- API documentation: `/README.md`
- WooCommerce requirements: See README.md "WooCommerce Requirements" section

---

## Support

- **Backend Issues**: Check Vercel logs
- **Voice Agent Issues**: Check ElevenLabs dashboard logs
- **WooCommerce Issues**: Verify API credentials in Vercel environment variables

Your deployment is live at: **https://milestone-voice-agent.vercel.app**
