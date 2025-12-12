/**
 * Clear Cache API
 * Clears the WooCommerce product cache
 * 
 * GET /api/clear-cache
 * 
 * Use this after updating product prices in WooCommerce
 * to immediately see the changes in the voice agent.
 */

import { clearCache, getCacheStats } from '../lib/woocommerce.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get stats before clearing
    const beforeStats = getCacheStats();
    
    // Clear the cache
    clearCache();
    
    // Get stats after clearing
    const afterStats = getCacheStats();

    return res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      before: beforeStats,
      after: afterStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

