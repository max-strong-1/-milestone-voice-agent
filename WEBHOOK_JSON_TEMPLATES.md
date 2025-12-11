# ElevenLabs Webhook JSON Templates

Copy and paste these JSON configurations when adding webhook tools in ElevenLabs.

**Base URL:** `https://milestone-voice-agent.vercel.app`

---

## Tool 1: check_service_area

```json
{
  "type": "webhook",
  "name": "check_service_area",
  "description": "Validates if Milestone Trucks delivers to a customer's ZIP code and returns available products for that area. ALWAYS call this FIRST before discussing any products or pricing. This confirms we can serve the customer.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/check-service-area",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "ZIP code validation request",
      "required": true,
      "properties": [
        {
          "id": "zip_code",
          "type": "string",
          "description": "The customer's 5-digit delivery ZIP code",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool 2: get_material_recommendations

```json
{
  "type": "webhook",
  "name": "get_material_recommendations",
  "description": "Provides educational material recommendations based on the customer's project type. Use this after confirming service area. Returns what materials they need, why they need them, and common mistakes to avoid.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/get-material-recommendations",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Project details for material recommendations",
      "required": true,
      "properties": [
        {
          "id": "project_type",
          "type": "string",
          "description": "Type of project: driveway, walkway, patio, drainage, or landscaping",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "zip_code",
          "type": "string",
          "description": "Customer's ZIP code (from check_service_area)",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "current_surface",
          "type": "string",
          "description": "What's currently there: dirt, grass, old asphalt, or gravel",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        },
        {
          "id": "final_surface",
          "type": "string",
          "description": "Final surface plan: stay gravel, pave later, or pavers",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        },
        {
          "id": "vehicle_type",
          "type": "string",
          "description": "For driveways: cars, light trucks, heavy trucks, or RVs",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool 3: calculate_materials

```json
{
  "type": "webhook",
  "name": "calculate_materials",
  "description": "Calculates exact quantities needed based on project dimensions. Call this after the customer provides their measurements (length, width, depth). Returns tons, cubic yards, truck loads, and pricing.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/calculate-materials",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Project dimensions for material calculation",
      "required": true,
      "properties": [
        {
          "id": "length_ft",
          "type": "number",
          "description": "Length of the area in feet",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "width_ft",
          "type": "number",
          "description": "Width of the area in feet",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "depth_inches",
          "type": "number",
          "description": "Depth in inches (typically 2-6)",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "materials",
          "type": "array",
          "description": "Array of material objects with 'sku' field from recommendations",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool 4: calculate_delivery

```json
{
  "type": "webhook",
  "name": "calculate_delivery",
  "description": "Calculates delivery fee based on location and order weight. Call this after calculating materials to give the customer a complete quote including delivery.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/calculate-delivery",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Delivery calculation parameters",
      "required": true,
      "properties": [
        {
          "id": "zip_code",
          "type": "string",
          "description": "Delivery ZIP code",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "delivery_address",
          "type": "string",
          "description": "Full street address for delivery",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "total_weight_tons",
          "type": "number",
          "description": "Total weight in tons from calculate_materials",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool 5: add_to_cart

```json
{
  "type": "webhook",
  "name": "add_to_cart",
  "description": "Adds calculated materials to the customer's cart. Use this when the customer confirms they want to proceed with the order.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/add-to-cart",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Cart items and session information",
      "required": true,
      "properties": [
        {
          "id": "session_id",
          "type": "string",
          "description": "Unique session ID (generate one like 'session_' + timestamp)",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "items",
          "type": "array",
          "description": "Array of items with sku, product_name, quantity, price_per_ton",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "delivery",
          "type": "object",
          "description": "Delivery info: {fee, trucks, zip_code}",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool 6: prefill_checkout

```json
{
  "type": "webhook",
  "name": "prefill_checkout",
  "description": "Prepares checkout with customer information collected during conversation. Call this right before directing the customer to checkout.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/prefill-checkout",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Customer checkout information",
      "required": true,
      "properties": [
        {
          "id": "cart_id",
          "type": "string",
          "description": "Cart ID from add_to_cart",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "customer_name",
          "type": "string",
          "description": "Customer's full name",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "delivery_address",
          "type": "string",
          "description": "Street address",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "city",
          "type": "string",
          "description": "City",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "state",
          "type": "string",
          "description": "State (2-letter code)",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "zip_code",
          "type": "string",
          "description": "ZIP code",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "phone",
          "type": "string",
          "description": "Phone number",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": true,
          "enum": null
        },
        {
          "id": "email",
          "type": "string",
          "description": "Email address",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        },
        {
          "id": "delivery_notes",
          "type": "string",
          "description": "Special delivery instructions",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        },
        {
          "id": "delivery_date",
          "type": "string",
          "description": "Requested delivery date",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Tool 7: check_order_status

```json
{
  "type": "webhook",
  "name": "check_order_status",
  "description": "Looks up order status for returning customers. Use when someone asks about their existing order, delivery status, or tracking.",
  "api_schema": {
    "url": "https://milestone-voice-agent.vercel.app/api/check-order-status",
    "method": "POST",
    "path_params_schema": [],
    "query_params_schema": [],
    "request_body_schema": {
      "id": "body",
      "type": "object",
      "description": "Order lookup parameters (at least one required)",
      "required": true,
      "properties": [
        {
          "id": "order_id",
          "type": "string",
          "description": "Order number (if customer has it)",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        },
        {
          "id": "phone",
          "type": "string",
          "description": "Phone number used for order",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        },
        {
          "id": "email",
          "type": "string",
          "description": "Email used for order",
          "dynamic_variable": "",
          "constant_value": "",
          "value_type": "llm_prompt",
          "required": false,
          "enum": null
        }
      ],
      "dynamic_variable": "",
      "constant_value": "",
      "value_type": "llm_prompt"
    },
    "request_headers": [
      {
        "type": "value",
        "name": "Content-Type",
        "value": "application/json"
      }
    ],
    "auth_connection": null
  },
  "response_timeout_secs": 20,
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}
```

---

## Quick Setup Instructions

For each webhook:

1. Click **"Add Tool"** → **"Add webhook tool"**
2. Click **"Edit as JSON"** button at the bottom
3. **Select all the existing JSON** in the editor (Cmd+A)
4. **Paste the JSON** from above
5. Click **"Add tool"**
6. Repeat for all 7 webhooks

## Important Notes

- All URLs point to: `https://milestone-voice-agent.vercel.app`
- All methods are POST
- All include `Content-Type: application/json` header
- Response timeout is 20 seconds for all
- Required fields are marked with `"required": true`
- Optional fields are marked with `"required": false`

