# ElevenLabs Setup Guide

Complete guide for configuring Robert in ElevenLabs Conversational AI.

## Prerequisites

- ElevenLabs account with Conversational AI access
- Backend deployed to Vercel (see main README)
- Your Vercel app URL (e.g., `https://milestone-voice-agent.vercel.app`)

## Step 1: Create the Agent

1. Go to [elevenlabs.io/app/agents](https://elevenlabs.io/app/agents)
2. Click **"Create Agent"**
3. Configure basic settings:
   - **Name**: Robert - Milestone Trucks
   - **Language**: English
   - **Voice**: Choose a friendly, professional male voice (e.g., "Daniel" or "Adam")

## Step 2: Set the System Prompt

Copy and paste this system prompt into the agent configuration:

```
You are Robert, a patient and knowledgeable construction materials consultant for Milestone Trucks. Your job is to educate homeowners about their material needs and help them complete purchases confidently.

PERSONALITY & APPROACH:
- Friendly neighbor, not corporate salesperson
- Patient teacher who never talks down to customers
- Celebrate good questions: "Great question - lots of people wonder about that"
- Normalize not knowing: "Most homeowners haven't worked with this stuff before"
- Use simple language and visual comparisons

CONVERSATION FLOW:

1. SERVICE AREA VALIDATION (ALWAYS FIRST):
   - Greet the customer warmly
   - Ask for their delivery ZIP code
   - Call check_service_area tool
   - If not serviceable: politely explain and offer alternatives
   - If serviceable: mention the yard location and proceed

2. PROJECT DISCOVERY:
   - Ask what project they're working on (driveway, walkway, patio, drainage, landscaping)
   - Ask clarifying questions based on project type
   - Call get_material_recommendations tool
   - EDUCATE: Explain what each material is, why it works, what happens if they skip steps

3. MEASUREMENTS & CALCULATION:
   - Ask for project dimensions (length, width)
   - Recommend appropriate depth based on project
   - Call calculate_materials tool
   - Explain quantities in visual terms: "That's about 7 pickup truck loads"

4. PRICING & DELIVERY:
   - Present material costs clearly
   - Call calculate_delivery tool for delivery fee
   - Provide total cost
   - Frame value: "That's about $7 per square foot for a solution that'll last 20 years"

5. CART & CHECKOUT:
   - Confirm customer wants to proceed
   - Call add_to_cart tool
   - Collect delivery details (name, address, phone, preferred date)
   - Call prefill_checkout tool
   - Explain next steps clearly

6. ORDER STATUS (for returning customers):
   - If customer asks about existing order, call check_order_status tool
   - Provide clear status and next steps

HELPFUL CONVERSIONS (use these to explain quantities):
- 1 cubic yard ≈ 1 full-size pickup truck bed
- 4 inches deep ≈ width of your fist
- 3/4" stone ≈ size of a nickel
- 3/8" stone ≈ size of a dime

THINGS TO PROACTIVELY MENTION:
- "Do you have a plate compactor or plan to rent one?"
- "Our delivery truck needs 10 feet of overhead clearance"
- "For a driveway, you'll want at least 4 inches of base or you'll get ruts"

ESCALATION:
If you encounter technical issues, the customer requests a human, or you're uncertain:
"Let me connect you with our team. You can reach them at [PHONE NUMBER] or I can note this for a callback."

Remember: Education first, sales second. Every customer should leave knowing more than when they started.
```

## Step 3: Configure Tools (Webhooks)

Add these 7 server tools. For each tool:
1. Click **"Add Tool"** → **"Webhook"**
2. Configure as shown below

Replace `YOUR_VERCEL_URL` with your actual Vercel deployment URL.

---

### Tool 1: check_service_area

**Name:** `check_service_area`

**Description:**
```
Validates if Milestone Trucks delivers to a customer's ZIP code and returns available products for that area. ALWAYS call this FIRST before discussing any products or pricing. This confirms we can serve the customer.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/check-service-area`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| zip_code | string | Yes | The customer's 5-digit delivery ZIP code |

---

### Tool 2: get_material_recommendations

**Name:** `get_material_recommendations`

**Description:**
```
Provides educational material recommendations based on the customer's project type. Use this after confirming service area. Returns what materials they need, why they need them, and common mistakes to avoid.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/get-material-recommendations`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| project_type | string | Yes | Type of project: driveway, walkway, patio, drainage, or landscaping |
| zip_code | string | Yes | Customer's ZIP code (from check_service_area) |
| current_surface | string | No | What's currently there: dirt, grass, old asphalt, or gravel |
| final_surface | string | No | Final surface plan: stay gravel, pave later, or pavers |
| vehicle_type | string | No | For driveways: cars, light trucks, heavy trucks, or RVs |

---

### Tool 3: calculate_materials

**Name:** `calculate_materials`

**Description:**
```
Calculates exact quantities needed based on project dimensions. Call this after the customer provides their measurements (length, width, depth). Returns tons, cubic yards, truck loads, and pricing.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/calculate-materials`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| length_ft | number | Yes | Length of the area in feet |
| width_ft | number | Yes | Width of the area in feet |
| depth_inches | number | Yes | Depth in inches (typically 2-6) |
| materials | array | Yes | Array of material objects with 'sku' field from recommendations |

**Example materials array:**
```json
[{"sku": "OHMS-6"}, {"sku": "OHMS-9"}]
```

---

### Tool 4: calculate_delivery

**Name:** `calculate_delivery`

**Description:**
```
Calculates delivery fee based on location and order weight. Call this after calculating materials to give the customer a complete quote including delivery.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/calculate-delivery`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| zip_code | string | Yes | Delivery ZIP code |
| delivery_address | string | Yes | Full street address for delivery |
| total_weight_tons | number | Yes | Total weight in tons from calculate_materials |

---

### Tool 5: add_to_cart

**Name:** `add_to_cart`

**Description:**
```
Adds calculated materials to the customer's cart. Use this when the customer confirms they want to proceed with the order.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/add-to-cart`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| session_id | string | Yes | Unique session ID (generate one like "session_" + timestamp) |
| items | array | Yes | Array of items with sku, product_name, quantity, price_per_ton |
| delivery | object | No | Delivery info: {fee, trucks, zip_code} |

---

### Tool 6: prefill_checkout

**Name:** `prefill_checkout`

**Description:**
```
Prepares checkout with customer information collected during conversation. Call this right before directing the customer to checkout.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/prefill-checkout`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| cart_id | string | Yes | Cart ID from add_to_cart |
| customer_name | string | Yes | Customer's full name |
| delivery_address | string | Yes | Street address |
| city | string | Yes | City |
| state | string | Yes | State (2-letter code) |
| zip_code | string | Yes | ZIP code |
| phone | string | Yes | Phone number |
| email | string | No | Email address |
| delivery_notes | string | No | Special delivery instructions |
| delivery_date | string | No | Requested delivery date |

---

### Tool 7: check_order_status

**Name:** `check_order_status`

**Description:**
```
Looks up order status for returning customers. Use when someone asks about their existing order, delivery status, or tracking.
```

**Method:** POST

**URL:** `https://YOUR_VERCEL_URL/api/check-order-status`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| order_id | string | No | Order number (if customer has it) |
| phone | string | No | Phone number used for order |
| email | string | No | Email used for order |

*At least one parameter must be provided*

---

## Step 4: Configure Agent Settings

In the ElevenLabs agent settings:

1. **Model Settings:**
   - Model: Claude 3.5 Sonnet (recommended) or GPT-4
   - Temperature: 0.7 (balanced between consistent and natural)

2. **Voice Settings:**
   - Choose a warm, friendly voice
   - Stability: 0.5-0.7
   - Similarity: 0.7-0.8

3. **Conversation Settings:**
   - Enable interruption handling
   - Set appropriate silence timeout (3-5 seconds)

## Step 5: Get Widget Code

1. Click **"Deploy"** in your agent dashboard
2. Select **"Web Widget"**
3. Copy the embed code
4. Add to your WordPress site (see below)

## Adding Widget to WordPress

### Option 1: Theme Customizer
1. Go to **Appearance → Customize → Additional CSS/Scripts**
2. Paste the widget code

### Option 2: Plugin Method
1. Install "Insert Headers and Footers" plugin
2. Go to **Settings → Insert Headers and Footers**
3. Paste widget code in the Footer section

### Option 3: Theme Files
1. Edit your theme's `footer.php`
2. Add the widget code before `</body>`

## Testing Checklist

- [ ] Greet and ask for ZIP code
- [ ] Test valid ZIP (e.g., 45640) - should show products
- [ ] Test invalid ZIP - should give friendly message
- [ ] Ask about driveway project - should get recommendations
- [ ] Provide dimensions - should calculate quantities
- [ ] Get delivery quote
- [ ] Complete mock checkout flow
- [ ] Ask about order status

## Troubleshooting

**Tool not calling:**
- Check webhook URL is correct
- Verify Vercel deployment is live
- Check ElevenLabs logs for errors

**Wrong responses:**
- Review system prompt
- Check tool descriptions
- Test endpoints directly with curl

**Slow responses:**
- Check Vercel function logs for timeouts
- Verify WooCommerce API is responsive
- Consider adding caching
