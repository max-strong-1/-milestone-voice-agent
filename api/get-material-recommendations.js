/**
 * Get Material Recommendations API
 * Provides educational material suggestions based on project type
 * Matches recommendations to products available in customer's area
 */

import { 
  getProductsByZip, 
  getProductDensity, 
  getTruckCapacity, 
  getMinimumOrder,
  getCleanProductName 
} from '../lib/woocommerce.js';

import { 
  getProjectRecommendations, 
  getMaterialInfo,
  MATERIALS 
} from '../lib/materials-knowledge.js';

/**
 * POST /api/get-material-recommendations
 * 
 * Body: {
 *   project_type: string (required) - driveway, walkway, patio, drainage, landscaping
 *   zip_code: string (required) - customer's ZIP code
 *   current_surface: string (optional) - dirt, grass, old asphalt, gravel
 *   final_surface: string (optional) - stay gravel, pave later, pavers
 *   vehicle_type: string (optional) - cars, light trucks, heavy trucks, RVs
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
      project_type,
      zip_code,
      current_surface,
      final_surface,
      vehicle_type
    } = req.body;

    // Validate required fields
    if (!project_type) {
      return res.status(400).json({ 
        error: 'Missing project_type',
        message: "What kind of project are you working on? Is it a driveway, walkway, patio, drainage project, or landscaping?"
      });
    }

    if (!zip_code) {
      return res.status(400).json({ 
        error: 'Missing zip_code',
        message: "I need to know your ZIP code first to see what materials are available in your area. What's your delivery ZIP code?"
      });
    }

    // Get available products for this ZIP
    const products = await getProductsByZip(zip_code);

    if (!products || products.length === 0) {
      return res.status(200).json({
        recommendations: [],
        explanation: `I don't have product availability for ZIP code ${zip_code}. Let me check if we service your area first.`,
        next_question: "Can you confirm your delivery ZIP code?"
      });
    }

    // Get recommendation template based on project type
    const projectRecs = getProjectRecommendations(project_type, {
      current_surface,
      final_surface,
      vehicle_type
    });

    // Build recommendations by matching template to available products
    const recommendations = [];

    for (const layer of projectRecs.layers || []) {
      // Get material info
      const materialInfo = MATERIALS[layer.material];
      if (!materialInfo) continue;

      // Find matching product in available products
      // Match by checking if product name contains material keywords
      const matchingProduct = products.find(product => {
        const productNameLower = product.name.toLowerCase();
        
        // Check against common names
        for (const commonName of materialInfo.common_names || []) {
          if (productNameLower.includes(commonName.toLowerCase())) {
            return true;
          }
        }
        
        // Check material key
        const materialKeywords = layer.material.replace(/_/g, ' ').replace('#', '').split(' ');
        return materialKeywords.every(keyword => 
          productNameLower.includes(keyword.toLowerCase())
        );
      });

      if (matchingProduct) {
        const productName = getCleanProductName(matchingProduct.name);
        
        recommendations.push({
          sku: matchingProduct.sku,
          product_id: matchingProduct.id,
          product_name: productName,
          layer: layer.name,
          purpose: layer.purpose,
          recommended_depth_inches: layer.depth || layer.depth_normal || 4,
          price_per_ton: parseFloat(matchingProduct.price),
          density: getProductDensity(matchingProduct),
          min_order_tons: getMinimumOrder(matchingProduct),
          max_load_tons: getTruckCapacity(matchingProduct),
          why: layer.why,
          essential: layer.essential !== false,
          pro_tip: materialInfo.pro_tips ? materialInfo.pro_tips[0] : null,
          common_mistake: materialInfo.common_mistakes ? materialInfo.common_mistakes[0] : null,
          how_it_works: materialInfo.how_it_works
        });
      }
    }

    // Generate context-specific next question
    let nextQuestion = "What are the dimensions of the area? I'll need the length and width in feet.";
    
    if (project_type.toLowerCase() === 'driveway' && !vehicle_type) {
      nextQuestion = "What kind of vehicles will use this driveway - mainly cars, pickup trucks, or heavier equipment like RVs?";
    } else if (project_type.toLowerCase() === 'drainage') {
      nextQuestion = "Where is the water pooling, and where do you want it to drain to?";
    }

    return res.status(200).json({
      recommendations,
      explanation: projectRecs.description,
      project_type: project_type,
      questions_to_ask: projectRecs.questions_to_ask || [],
      common_mistakes: projectRecs.common_mistakes || [],
      next_question: nextQuestion
    });

  } catch (error) {
    console.error('Error in get-material-recommendations:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: "I'm having trouble getting recommendations right now. Let me try again - what kind of project are you working on?"
    });
  }
}
