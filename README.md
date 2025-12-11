# Milestone Trucks Voice Agent

🎯 **AI-powered voice assistant for construction materials ordering**

This is the backend system for Robert, an ElevenLabs conversational AI agent that helps homeowners understand their construction material needs, calculate quantities, and complete purchases through Milestone Trucks' WooCommerce store.

## Overview

Robert is an educational voice assistant that:
- Validates delivery ZIP codes against service areas
- Recommends materials based on project type (driveways, walkways, patios, etc.)
- Calculates exact quantities needed based on dimensions
- Provides delivery quotes
- Guides customers through checkout

## Architecture

```
Customer on milestone-trucks.com
    ↓
ElevenLabs Voice Widget (embedded)
    ↓
ElevenLabs AI (Robert's brain)
    ↓
Webhook calls to Vercel Functions
    ↓
WooCommerce REST API
    ↓
Response back to Robert
    ↓
Robert speaks to customer
```

## Tech Stack

- **Voice AI**: ElevenLabs Conversational AI
- **Backend**: Vercel Serverless Functions (Node.js)
- **E-commerce**: WooCommerce REST API
- **Deployment**: GitHub → Vercel (auto-deploy)

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/check-service-area` | Validates ZIP code and returns available products |
| `/api/get-material-recommendations` | Educational recommendations by project type |
| `/api/calculate-materials` | Calculates quantities from dimensions |
| `/api/calculate-delivery` | Estimates delivery fees |
| `/api/add-to-cart` | Prepares cart with materials |
| `/api/prefill-checkout` | Prepares checkout with customer info |
| `/api/check-order-status` | Looks up existing orders |

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/milestone-voice-agent.git
cd milestone-voice-agent
npm install
```

### 2. Set Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `WOOCOMMERCE_URL` - Your WooCommerce store URL
- `WOOCOMMERCE_CONSUMER_KEY` - WooCommerce REST API consumer key
- `WOOCOMMERCE_CONSUMER_SECRET` - WooCommerce REST API consumer secret

### 3. Get WooCommerce API Keys

1. Go to: **WooCommerce → Settings → Advanced → REST API**
2. Click **"Add Key"**
3. Set:
   - Description: "Voice Agent API"
   - User: Your admin user
   - Permissions: Read/Write
4. Click **"Generate API Key"**
5. Copy the Consumer Key and Consumer Secret

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then add environment variables in Vercel dashboard
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 5. Configure ElevenLabs

See [docs/ELEVENLABS_SETUP.md](docs/ELEVENLABS_SETUP.md) for detailed instructions.

## File Structure

```
milestone-voice-agent/
├── api/                          # Vercel serverless functions
│   ├── check-service-area.js     # ZIP code validation
│   ├── get-material-recommendations.js
│   ├── calculate-materials.js
│   ├── calculate-delivery.js
│   ├── add-to-cart.js
│   ├── prefill-checkout.js
│   └── check-order-status.js
├── lib/                          # Shared libraries
│   ├── woocommerce.js            # WooCommerce API client
│   ├── calculations.js           # Material quantity formulas
│   └── materials-knowledge.js    # Educational content database
├── docs/                         # Documentation
│   ├── ELEVENLABS_SETUP.md       # ElevenLabs configuration guide
│   ├── TOOLS_REFERENCE.md        # API endpoint documentation
│   └── SYSTEM_PROMPT.md          # Robert's personality prompt
├── package.json
├── vercel.json
└── README.md
```

## WooCommerce Requirements

Your WooCommerce store needs:

1. **Products tagged with ZIP codes** - Products should have tags for the ZIP codes they're available in
2. **Custom product meta fields**:
   - `density` - Tons per cubic yard (for quantity calculations)
   - `truck_max_quantity` - Max tons per truck
   - `minimum_quantity` - Minimum order in tons
   - `map_title` - Yard/location name
3. **Shipping Zones by Drawing Premium** plugin - For delivery fee calculation

## Testing

Test each endpoint with curl:

```bash
# Check service area
curl -X POST https://your-app.vercel.app/api/check-service-area \
  -H "Content-Type: application/json" \
  -d '{"zip_code": "45640"}'

# Get recommendations
curl -X POST https://your-app.vercel.app/api/get-material-recommendations \
  -H "Content-Type: application/json" \
  -d '{"project_type": "driveway", "zip_code": "45640"}'

# Calculate materials
curl -X POST https://your-app.vercel.app/api/calculate-materials \
  -H "Content-Type: application/json" \
  -d '{"length_ft": 50, "width_ft": 12, "depth_inches": 4, "materials": [{"sku": "OHMS-6"}]}'
```

## Conversation Flow

1. **Service Area Check** (always first)
   - Ask for ZIP code
   - Call `check-service-area`
   - If serviceable, proceed; otherwise, offer alternatives

2. **Project Discovery**
   - Ask about project type
   - Call `get-material-recommendations`
   - Educate about materials

3. **Quantity Calculation**
   - Ask for dimensions
   - Call `calculate-materials`
   - Explain in visual terms (truck loads)

4. **Pricing & Delivery**
   - Call `calculate-delivery`
   - Present total cost

5. **Checkout**
   - Call `add-to-cart`
   - Collect customer info
   - Call `prefill-checkout`
   - Direct to checkout

## Support

For issues with:
- **Voice agent configuration**: Check ElevenLabs dashboard
- **Backend errors**: Check Vercel function logs
- **WooCommerce integration**: Verify API credentials and permissions

## License

MIT License - See LICENSE file
