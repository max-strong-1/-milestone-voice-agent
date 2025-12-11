/**
 * Materials Knowledge Base
 * Educational information for Robert to use when helping customers
 * This data powers the get_material_recommendations tool
 */

/**
 * Detailed material information database
 */
export const MATERIALS = {
  crusher_run: {
    common_names: ["crusher run", "crush and run", "crusher fines", "cr", "cr-6", "abc stone"],
    category: "base",
    description: "Mix of crushed stone from 3/4 inch down to stone dust",
    size_description: "Various sizes from 3/4 inch down to powder",
    how_it_works: "Stone dust fills gaps between larger stones, then compacts tightly when rolled or driven on, creating a solid foundation",
    best_for: ["driveway base", "walkway base", "shed pad", "patio base", "building foundation", "road base"],
    not_recommended_for: ["surface layer", "decorative use", "drainage"],
    typical_depth: {
      driveway: "4-6 inches",
      walkway: "2-3 inches",
      patio: "4 inches"
    },
    density: 1.4,
    common_mistakes: [
      "Using as top layer - gets muddy and dusty, tracks into house",
      "Not compacting properly - leads to settling",
      "Skipping this for driveways - causes ruts and settling within a year"
    ],
    pro_tips: [
      "Always compact with a plate compactor or by driving over it multiple times",
      "Top with clean stone like #57 for a finished look",
      "Water lightly before compacting for best results",
      "Allow to settle for a few days before adding surface layer"
    ],
    customer_faq: {
      "Can I just use this alone?": "You could for a basic driveway, but it gets dusty in dry weather and muddy when wet. We recommend topping with #57 stone.",
      "How do I compact it?": "Rent a plate compactor from any equipment rental place, or drive over it many times with your vehicle."
    }
  },

  "#57_stone": {
    common_names: ["57 stone", "#57 stone", "number 57", "3/4 inch stone", "clean stone", "washed stone"],
    category: "surface",
    description: "Uniform 3/4 inch washed crushed stone",
    size_description: "About the size of a nickel",
    how_it_works: "Stays loose for excellent drainage, creates clean appearance, doesn't track mud",
    best_for: ["driveway surface", "drainage", "french drains", "decorative landscaping", "around foundations"],
    not_recommended_for: ["base layer alone", "walkways where people walk barefoot"],
    typical_depth: {
      driveway: "2-3 inches",
      drainage: "3-4 inches"
    },
    density: 1.35,
    common_mistakes: [
      "Using as only layer for driveway - no stability, stones will shift",
      "Going too thin - stones disappear into the base"
    ],
    pro_tips: [
      "Always use over a compacted base like crusher run",
      "Budget for about 20% more than calculated - some settles into base",
      "Great for French drains wrapped in landscape fabric"
    ],
    customer_faq: {
      "Why is this more expensive than crusher run?": "It's washed and uniform size, which means cleaner look and better drainage. Worth it for the surface layer.",
      "Can I use it without a base?": "We don't recommend it. Without a proper base, the stones will shift around and sink into the ground."
    }
  },

  "#304_gravel": {
    common_names: ["304 gravel", "#304", "pea gravel size", "3/8 stone"],
    category: "surface",
    description: "3/8 inch crushed stone, smaller than #57",
    size_description: "About the size of a dime",
    how_it_works: "Small size is comfortable to walk on and stays in place better than larger stones",
    best_for: ["pathways", "decorative landscaping", "around plants", "play areas"],
    not_recommended_for: ["driveways - too small, rolls under tires", "base layers"],
    typical_depth: {
      pathway: "2-3 inches",
      landscaping: "2 inches"
    },
    density: 1.35,
    common_mistakes: [
      "Using for driveways - too small, scatters when driven on"
    ],
    pro_tips: [
      "Great for walkways where you want a more solid feel underfoot",
      "Use landscape fabric underneath to prevent weeds",
      "Perfect around flower beds and trees"
    ],
    customer_faq: {
      "Can I drive on this?": "Not recommended - the stones are too small and will scatter. Use #57 for driveways."
    }
  },

  riprap: {
    common_names: ["riprap", "rip rap", "large stone", "erosion stone", "armor stone"],
    category: "specialty",
    description: "Large rocks ranging from 6 to 30 inches",
    size_description: "Large rocks, some as big as basketballs",
    how_it_works: "Heavy stones resist water flow and prevent erosion on slopes and shorelines",
    best_for: ["erosion control", "shorelines", "steep slopes", "creek banks", "decorative boulders"],
    not_recommended_for: ["driveways", "walkways", "patios"],
    typical_depth: "Single layer covering ground",
    density: 1.4,
    common_mistakes: [
      "Trying to use for walkways or driveways - not practical"
    ],
    pro_tips: [
      "Looks great as decorative accents in landscaping",
      "Essential for any slope that gets water runoff",
      "Color may vary between locations - ask about your local yard's color"
    ],
    customer_faq: {
      "Can I walk on this?": "Not comfortably - the rocks are large and uneven. Great for erosion control and decoration though."
    }
  },

  driveway_gravel: {
    common_names: ["driveway gravel", "driveway stone", "road gravel"],
    category: "surface",
    description: "Mixed stone blend specifically formulated for driveway surfaces",
    size_description: "Mix of sizes for optimal performance",
    how_it_works: "Blended for good drainage, appearance, and driving surface",
    best_for: ["driveway top layer", "parking areas", "rural roads"],
    typical_depth: "2-3 inches",
    density: 1.35,
    pro_tips: [
      "Use over a compacted base for best results",
      "Great all-in-one option for driveway surfaces"
    ]
  }
};

/**
 * Project-based recommendation templates
 */
export const PROJECT_RECOMMENDATIONS = {
  driveway: {
    description: "For a long-lasting driveway, you need two layers: a compacted base and a surface layer. The base prevents ruts and settling, while the surface provides drainage and a clean look.",
    layers: [
      {
        name: "base",
        material: "crusher_run",
        depth_light: 4,
        depth_normal: 4,
        depth_heavy: 6,
        purpose: "Creates stable foundation",
        why: "Without a proper base, your driveway will develop ruts and potholes within a year or two",
        essential: true
      },
      {
        name: "surface",
        material: "#57_stone",
        depth: 2,
        purpose: "Driving surface and drainage",
        why: "Provides clean appearance, drainage, and won't track mud into your house",
        essential: false,
        alternative: "You can skip this if budget is tight, but crusher run alone gets dusty and muddy"
      }
    ],
    questions_to_ask: [
      "What's currently there - dirt, grass, old asphalt, or existing gravel?",
      "What kind of vehicles will use it - just cars, pickup trucks, or heavier equipment?",
      "Do you plan to pave it later, or will it stay gravel?"
    ],
    common_mistakes: [
      "Only getting surface stone without a base - leads to shifting and sinking",
      "Going too thin on the base - save money now, pay more later to fix it",
      "Not accounting for drainage - water pooling destroys driveways"
    ]
  },

  walkway: {
    description: "A walkway needs a stable base topped with comfortable walking material. This prevents settling and keeps the path looking good for years.",
    layers: [
      {
        name: "base",
        material: "crusher_run",
        depth: 2,
        purpose: "Stable foundation",
        why: "Prevents the walkway from sinking and becoming uneven",
        essential: true
      },
      {
        name: "surface",
        material: "#304_gravel",
        depth: 2,
        purpose: "Walking surface",
        why: "Smaller stone is more comfortable to walk on",
        essential: false
      }
    ],
    questions_to_ask: [
      "How long and wide is the walkway?",
      "Will it get heavy foot traffic?",
      "Do you want a decorative look or just functional?"
    ]
  },

  patio: {
    description: "For a patio base, you need a level, compacted foundation. This prevents pavers or flagstone from settling unevenly over time.",
    layers: [
      {
        name: "base",
        material: "crusher_run",
        depth: 4,
        purpose: "Level foundation for pavers",
        why: "Compacts evenly and provides solid support. Without it, pavers will shift and become uneven.",
        essential: true
      }
    ],
    questions_to_ask: [
      "What size is the patio area?",
      "What's going on top - pavers, flagstone, or something else?",
      "Is the area level or does it slope?"
    ]
  },

  drainage: {
    description: "For drainage solutions like French drains, you need stone that allows water to flow freely while providing structure.",
    layers: [
      {
        name: "drainage",
        material: "#57_stone",
        depth: 4,
        purpose: "Water flow channel",
        why: "#57 stone allows water to flow between the stones while providing structure for the drain",
        essential: true
      }
    ],
    questions_to_ask: [
      "Where is the water pooling?",
      "Where do you want the water to drain to?",
      "How long does the drain need to be?"
    ],
    pro_tips: [
      "Wrap the stone in landscape fabric to prevent soil from clogging",
      "Include a perforated pipe in the center for best results",
      "Make sure there's enough slope for water to flow - about 1 inch per 8 feet"
    ]
  },

  landscaping: {
    description: "For landscaping, you want decorative stone that looks good and suppresses weeds without breaking the bank.",
    layers: [
      {
        name: "decorative",
        material: "#304_gravel",
        depth: 2,
        purpose: "Ground cover",
        why: "Attractive, low maintenance, and prevents weeds",
        essential: false
      }
    ],
    questions_to_ask: [
      "What areas are you covering?",
      "What color or look are you going for?",
      "Will you use landscape fabric underneath?"
    ]
  }
};

/**
 * Get project recommendations based on type
 * @param {string} projectType - Type of project
 * @param {Object} details - Additional details (vehicle_type, current_surface, etc.)
 * @returns {Object} Recommendations with layers and explanations
 */
export function getProjectRecommendations(projectType, details = {}) {
  const normalizedType = projectType.toLowerCase().replace(/[^a-z]/g, '');
  const template = PROJECT_RECOMMENDATIONS[normalizedType];
  
  if (!template) {
    return {
      description: "Let me help you figure out what materials you need.",
      layers: [],
      questions_to_ask: ["Can you tell me more about what you're trying to do?"]
    };
  }

  // Customize depths based on vehicle type for driveways
  if (normalizedType === 'driveway' && details.vehicle_type) {
    const layers = template.layers.map(layer => {
      if (layer.name === 'base') {
        let depth;
        switch (details.vehicle_type.toLowerCase()) {
          case 'heavy trucks':
          case 'heavy':
          case 'rvs':
          case 'rv':
            depth = layer.depth_heavy;
            break;
          case 'light trucks':
          case 'light':
            depth = layer.depth_normal;
            break;
          default:
            depth = layer.depth_light;
        }
        return { ...layer, depth };
      }
      return layer;
    });
    return { ...template, layers };
  }

  return template;
}

/**
 * Get material information by name
 * @param {string} name - Material name or common name
 * @returns {Object|null} Material information
 */
export function getMaterialInfo(name) {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Direct match
  for (const [key, material] of Object.entries(MATERIALS)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedKey === normalizedName) {
      return { key, ...material };
    }
    
    // Check common names
    for (const commonName of material.common_names || []) {
      if (commonName.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName) {
        return { key, ...material };
      }
    }
  }
  
  return null;
}

/**
 * Generate educational explanation for a material choice
 * @param {string} materialKey - Material key from MATERIALS
 * @param {string} purpose - Why this material is being recommended
 * @returns {Object} Educational content for voice agent
 */
export function generateMaterialExplanation(materialKey, purpose) {
  const material = MATERIALS[materialKey];
  if (!material) return null;

  return {
    what_it_is: material.description,
    size: material.size_description,
    how_it_works: material.how_it_works,
    best_for: material.best_for,
    common_mistakes: material.common_mistakes,
    pro_tips: material.pro_tips,
    faq: material.customer_faq
  };
}
