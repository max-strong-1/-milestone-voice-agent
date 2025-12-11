/**
 * Material Calculations Library
 * Formulas for converting dimensions to material quantities
 */

/**
 * Calculate cubic yards from dimensions
 * Formula: (Length × Width × Depth) / 27
 * 
 * @param {number} lengthFt - Length in feet
 * @param {number} widthFt - Width in feet
 * @param {number} depthInches - Depth in inches
 * @returns {number} Volume in cubic yards
 * 
 * @example
 * // 50ft × 12ft × 4in deep
 * calculateCubicYards(50, 12, 4) // Returns 7.41
 */
export function calculateCubicYards(lengthFt, widthFt, depthInches) {
  const depthFt = depthInches / 12;
  const cubicFeet = lengthFt * widthFt * depthFt;
  return cubicFeet / 27;
}

/**
 * Convert cubic yards to tons using material density
 * 
 * @param {number} cubicYards - Volume in cubic yards
 * @param {number} density - Material density (tons per cubic yard)
 * @returns {number} Weight in tons
 * 
 * Common densities:
 * - Crusher Run: 1.4 tons/yd³
 * - #57 Stone: 1.35 tons/yd³
 * - #304 Gravel: 1.35 tons/yd³
 * - Riprap: 1.4 tons/yd³
 * - Topsoil: 1.0 tons/yd³
 * - Sand: 1.35 tons/yd³
 */
export function cubicYardsToTons(cubicYards, density = 1.4) {
  return cubicYards * density;
}

/**
 * Convert tons to cubic yards
 * @param {number} tons - Weight in tons
 * @param {number} density - Material density
 * @returns {number} Volume in cubic yards
 */
export function tonsToCubicYards(tons, density = 1.4) {
  return tons / density;
}

/**
 * Calculate number of truck loads needed
 * @param {number} totalTons - Total weight in tons
 * @param {number} truckCapacity - Truck capacity in tons (default 18)
 * @returns {number} Number of trucks (rounded up)
 */
export function calculateTrucksNeeded(totalTons, truckCapacity = 18) {
  return Math.ceil(totalTons / truckCapacity);
}

/**
 * Calculate square footage
 * @param {number} lengthFt - Length in feet
 * @param {number} widthFt - Width in feet
 * @returns {number} Area in square feet
 */
export function calculateSquareFeet(lengthFt, widthFt) {
  return lengthFt * widthFt;
}

/**
 * Calculate coverage at a specific depth
 * How many square feet one ton covers at given depth
 * @param {number} depthInches - Depth in inches
 * @param {number} density - Material density
 * @returns {number} Square feet per ton
 */
export function coveragePerTon(depthInches, density = 1.4) {
  // 1 ton = 1/density cubic yards
  const cubicYardsPerTon = 1 / density;
  // Convert to cubic feet (× 27)
  const cubicFeetPerTon = cubicYardsPerTon * 27;
  // Divide by depth in feet to get square feet
  const depthFt = depthInches / 12;
  return cubicFeetPerTon / depthFt;
}

/**
 * Format number for display
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string} Formatted number string
 */
export function formatNumber(num, decimals = 1) {
  return num.toFixed(decimals);
}

/**
 * Format currency for display
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Create human-readable explanation of quantity
 * Converts tons to visual truck load reference
 * @param {number} tons - Weight in tons
 * @returns {string} Human-readable explanation
 */
export function explainQuantity(tons) {
  const pickupLoads = Math.round(tons);
  
  if (pickupLoads <= 1) {
    return "about 1 pickup truck load";
  } else if (pickupLoads <= 3) {
    return `about ${pickupLoads} pickup truck loads`;
  } else {
    return `about ${pickupLoads} pickup truck loads - that's quite a bit of material`;
  }
}

/**
 * Explain depth in visual terms
 * @param {number} inches - Depth in inches
 * @returns {string} Human-readable depth explanation
 */
export function explainDepth(inches) {
  if (inches <= 2) {
    return `${inches} inches deep - about the thickness of two fingers`;
  } else if (inches <= 4) {
    return `${inches} inches deep - about the width of your fist`;
  } else if (inches <= 6) {
    return `${inches} inches deep - about the height of a soda can`;
  } else {
    return `${inches} inches deep`;
  }
}

/**
 * Calculate all material quantities from dimensions
 * Returns comprehensive breakdown for voice agent
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.lengthFt - Length in feet
 * @param {number} params.widthFt - Width in feet
 * @param {number} params.depthInches - Depth in inches
 * @param {number} params.pricePerTon - Price per ton
 * @param {number} [params.density=1.4] - Material density
 * @param {number} [params.truckCapacity=18] - Truck capacity in tons
 * @returns {Object} Complete calculation results
 */
export function calculateMaterialQuantities({
  lengthFt,
  widthFt,
  depthInches,
  pricePerTon,
  density = 1.4,
  truckCapacity = 18
}) {
  const squareFeet = calculateSquareFeet(lengthFt, widthFt);
  const cubicYards = calculateCubicYards(lengthFt, widthFt, depthInches);
  const tons = cubicYardsToTons(cubicYards, density);
  const truckLoads = calculateTrucksNeeded(tons, truckCapacity);
  const totalPrice = tons * pricePerTon;
  const pricePerSqFt = totalPrice / squareFeet;

  return {
    dimensions: {
      length_ft: lengthFt,
      width_ft: widthFt,
      depth_inches: depthInches,
      square_feet: squareFeet
    },
    quantities: {
      cubic_yards: parseFloat(formatNumber(cubicYards, 2)),
      tons: parseFloat(formatNumber(tons, 1)),
      truck_loads: truckLoads
    },
    pricing: {
      price_per_ton: pricePerTon,
      total_price: parseFloat(totalPrice.toFixed(2)),
      price_per_sq_ft: parseFloat(pricePerSqFt.toFixed(2))
    },
    explanations: {
      quantity: explainQuantity(tons),
      depth: explainDepth(depthInches),
      summary: `For your ${lengthFt} by ${widthFt} foot area at ${depthInches} inches deep, you'll need ${formatNumber(tons, 1)} tons - ${explainQuantity(tons)}.`
    }
  };
}

/**
 * Recommended depths by project type
 */
export const RECOMMENDED_DEPTHS = {
  driveway_base: {
    light_traffic: 4,
    normal_traffic: 4,
    heavy_traffic: 6,
    description: "Base layer for driveways"
  },
  driveway_surface: {
    default: 2,
    description: "Surface layer for driveways"
  },
  walkway_base: {
    default: 2,
    description: "Base layer for walkways"
  },
  walkway_surface: {
    default: 2,
    description: "Surface layer for walkways"
  },
  patio_base: {
    default: 4,
    description: "Base layer for patios"
  },
  french_drain: {
    default: 4,
    description: "French drain fill"
  },
  landscaping: {
    default: 2,
    description: "Decorative landscaping"
  }
};

/**
 * Get recommended depth for a project type
 * @param {string} projectType - Type of project
 * @param {string} layer - 'base' or 'surface'
 * @param {string} [trafficLevel] - Traffic intensity
 * @returns {number} Recommended depth in inches
 */
export function getRecommendedDepth(projectType, layer = 'base', trafficLevel = 'normal_traffic') {
  const key = `${projectType}_${layer}`;
  
  if (RECOMMENDED_DEPTHS[key]) {
    const depths = RECOMMENDED_DEPTHS[key];
    return depths[trafficLevel] || depths.default || 4;
  }
  
  // Default fallback
  return layer === 'base' ? 4 : 2;
}
