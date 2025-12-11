# ElevenLabs Webhook Setup Checklist

**Agent Name:** Robert - Milestone Trucks  
**Deployment URL:** https://milestone-voice-agent.vercel.app  
**Setup Date:** December 11, 2025

---

## Pre-Setup Checklist

- [ ] Signed into ElevenLabs (https://elevenlabs.io/app/agents)
- [ ] Agent created/selected: "Robert - Milestone Trucks"
- [ ] System prompt added (from `/docs/SYSTEM_PROMPT.md`)
- [ ] Voice selected (friendly, professional male voice)
- [ ] Model configured (Claude 3.5 Sonnet, Temperature: 0.7)

---

## Webhook Configuration Progress

### ✅ Tool 1: check_service_area
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `check_service_area`
- [ ] Set Description: "Validates if Milestone Trucks delivers to a customer's ZIP code and returns available products for that area. ALWAYS call this FIRST before discussing any products or pricing. This confirms we can serve the customer."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/check-service-area`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameter: `zip_code` (string, required) - "The customer's 5-digit delivery ZIP code"
- [ ] Saved tool
- [ ] **Tested:** Said "I'm in ZIP code 45640" and verified it called the tool

---

### ✅ Tool 2: get_material_recommendations
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `get_material_recommendations`
- [ ] Set Description: "Provides educational material recommendations based on the customer's project type. Use this after confirming service area. Returns what materials they need, why they need them, and common mistakes to avoid."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/get-material-recommendations`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameters:
  - [ ] `project_type` (string, required) - "Type of project: driveway, walkway, patio, drainage, or landscaping"
  - [ ] `zip_code` (string, required) - "Customer's ZIP code (from check_service_area)"
  - [ ] `current_surface` (string, optional) - "What's currently there: dirt, grass, old asphalt, or gravel"
  - [ ] `final_surface` (string, optional) - "Final surface plan: stay gravel, pave later, or pavers"
  - [ ] `vehicle_type` (string, optional) - "For driveways: cars, light trucks, heavy trucks, or RVs"
- [ ] Saved tool
- [ ] **Tested:** Said "I'm building a driveway" and verified it called the tool

---

### ✅ Tool 3: calculate_materials
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `calculate_materials`
- [ ] Set Description: "Calculates exact quantities needed based on project dimensions. Call this after the customer provides their measurements (length, width, depth). Returns tons, cubic yards, truck loads, and pricing."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/calculate-materials`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameters:
  - [ ] `length_ft` (number, required) - "Length of the area in feet"
  - [ ] `width_ft` (number, required) - "Width of the area in feet"
  - [ ] `depth_inches` (number, required) - "Depth in inches (typically 2-6)"
  - [ ] `materials` (array, required) - "Array of material objects with 'sku' field from recommendations"
- [ ] Saved tool
- [ ] **Tested:** Said "It's 50 feet long and 12 feet wide, 4 inches deep" and verified calculation

---

### ✅ Tool 4: calculate_delivery
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `calculate_delivery`
- [ ] Set Description: "Calculates delivery fee based on location and order weight. Call this after calculating materials to give the customer a complete quote including delivery."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/calculate-delivery`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameters:
  - [ ] `zip_code` (string, required) - "Delivery ZIP code"
  - [ ] `delivery_address` (string, required) - "Full street address for delivery"
  - [ ] `total_weight_tons` (number, required) - "Total weight in tons from calculate_materials"
- [ ] Saved tool
- [ ] **Tested:** Provided address and verified delivery calculation

---

### ✅ Tool 5: add_to_cart
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `add_to_cart`
- [ ] Set Description: "Adds calculated materials to the customer's cart. Use this when the customer confirms they want to proceed with the order."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/add-to-cart`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameters:
  - [ ] `session_id` (string, required) - "Unique session ID (generate one like 'session_' + timestamp)"
  - [ ] `items` (array, required) - "Array of items with sku, product_name, quantity, price_per_ton"
  - [ ] `delivery` (object, optional) - "Delivery info: {fee, trucks, zip_code}"
- [ ] Saved tool
- [ ] **Tested:** Said "Yes, I want to order" and verified cart creation

---

### ✅ Tool 6: prefill_checkout
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `prefill_checkout`
- [ ] Set Description: "Prepares checkout with customer information collected during conversation. Call this right before directing the customer to checkout."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/prefill-checkout`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameters:
  - [ ] `cart_id` (string, required) - "Cart ID from add_to_cart"
  - [ ] `customer_name` (string, required) - "Customer's full name"
  - [ ] `delivery_address` (string, required) - "Street address"
  - [ ] `city` (string, required) - "City"
  - [ ] `state` (string, required) - "State (2-letter code)"
  - [ ] `zip_code` (string, required) - "ZIP code"
  - [ ] `phone` (string, required) - "Phone number"
  - [ ] `email` (string, optional) - "Email address"
  - [ ] `delivery_notes` (string, optional) - "Special delivery instructions"
  - [ ] `delivery_date` (string, optional) - "Requested delivery date"
- [ ] Saved tool
- [ ] **Tested:** Provided customer info and verified checkout prefill

---

### ✅ Tool 7: check_order_status
- [ ] Clicked "Add Tool" → "Webhook"
- [ ] Set Name: `check_order_status`
- [ ] Set Description: "Looks up order status for returning customers. Use when someone asks about their existing order, delivery status, or tracking."
- [ ] Set Method: POST
- [ ] Set URL: `https://milestone-voice-agent.vercel.app/api/check-order-status`
- [ ] Added Header: `Content-Type: application/json`
- [ ] Added Parameters:
  - [ ] `order_id` (string, optional) - "Order number (if customer has it)"
  - [ ] `phone` (string, optional) - "Phone number used for order"
  - [ ] `email` (string, optional) - "Email used for order"
  - [ ] **Note:** At least one parameter must be provided
- [ ] Saved tool
- [ ] **Tested:** Asked about order status and verified lookup

---

## Full Conversation Flow Test

- [ ] **Test 1: Complete New Order Flow**
  - [ ] Started conversation: "Hi Robert"
  - [ ] Provided ZIP: "45640"
  - [ ] Described project: "I'm building a driveway"
  - [ ] Provided dimensions: "50 feet long, 12 feet wide, 4 inches deep"
  - [ ] Got material recommendations
  - [ ] Got pricing and delivery quote
  - [ ] Confirmed order
  - [ ] Provided customer details
  - [ ] Received checkout link

- [ ] **Test 2: Service Area Rejection**
  - [ ] Provided invalid ZIP code
  - [ ] Verified friendly rejection message

- [ ] **Test 3: Order Status Check**
  - [ ] Asked about existing order
  - [ ] Provided phone number or order ID
  - [ ] Received status update

---

## Post-Setup Checklist

- [ ] All 7 webhooks configured and saved
- [ ] Completed full conversation flow test
- [ ] Verified all tools are calling correctly in ElevenLabs logs
- [ ] Checked Vercel logs for any errors
- [ ] Tested edge cases (invalid ZIP, missing info, etc.)
- [ ] Documented any issues or adjustments needed

---

## Common Issues & Solutions

### Tool Not Calling
- ✓ Verify webhook URL is exactly: `https://milestone-voice-agent.vercel.app/api/[endpoint]`
- ✓ Check that all required parameters are marked as "required"
- ✓ Review ElevenLabs tool execution logs
- ✓ Ensure Content-Type header is set to `application/json`

### Getting Errors
- ✓ Check Vercel function logs at: https://vercel.com/dashboard
- ✓ Verify environment variables are set in Vercel (WooCommerce credentials)
- ✓ Test endpoints directly with curl (see examples in ELEVENLABS_WEBHOOK_SETUP.md)

### Wrong Responses
- ✓ Review the system prompt matches `/docs/SYSTEM_PROMPT.md`
- ✓ Check tool descriptions are accurate
- ✓ Verify parameter types (string vs number)
- ✓ Ensure arrays and objects are properly formatted

### Agent Not Understanding
- ✓ Adjust temperature (try 0.6-0.8)
- ✓ Review system prompt for clarity
- ✓ Check if tool descriptions need more detail

---

## Quick Reference

**Vercel Dashboard:** https://vercel.com/dashboard  
**ElevenLabs Agents:** https://elevenlabs.io/app/agents  
**Test ZIP Code:** 45640 (valid for testing)  
**Support:** Check Vercel logs and ElevenLabs dashboard logs

---

## Notes & Observations

_Use this section to document any issues, workarounds, or observations during setup:_

- 
- 
- 

---

**Setup completed:** ___/___/___  
**Completed by:** _______________  
**Agent Status:** ⬜ Draft | ⬜ Testing | ⬜ Live

