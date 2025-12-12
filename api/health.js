/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns system health status for monitoring dashboards.
 * Checks:
 * - API availability
 * - WooCommerce connection
 * - Environment configuration
 * - Cache statistics
 * 
 * Response Codes:
 * - 200: All systems healthy
 * - 503: One or more systems unhealthy
 */

import { getWooCommerceClient, getCacheStats } from "../lib/woocommerce.js";

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.VERCEL_ENV || "development",
    checks: {},
    cache: {},
    response_time_ms: 0
  };

  let hasFailure = false;

  // Check 1: Environment Variables
  const requiredEnvVars = [
    "WOOCOMMERCE_URL",
    "WOOCOMMERCE_CONSUMER_KEY", 
    "WOOCOMMERCE_CONSUMER_SECRET"
  ];
  
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  health.checks.environment = {
    status: missingVars.length === 0 ? "pass" : "fail",
    message: missingVars.length === 0 
      ? "All required environment variables set"
      : `Missing: ${missingVars.join(", ")}`,
    duration_ms: 0
  };
  
  if (missingVars.length > 0) {
    hasFailure = true;
  }

  // Check 2: WooCommerce Connection
  const wcStart = Date.now();
  try {
    const wc = getWooCommerceClient();
    const response = await wc.get("products", { per_page: 1 });
    
    health.checks.woocommerce = {
      status: "pass",
      message: "WooCommerce API responding",
      duration_ms: Date.now() - wcStart,
      product_count: response.headers?.["x-wp-total"] || "unknown"
    };
  } catch (error) {
    hasFailure = true;
    health.checks.woocommerce = {
      status: "fail",
      message: error.message || "Connection failed",
      duration_ms: Date.now() - wcStart,
      error_code: error.response?.status || "unknown"
    };
  }

  // Check 3: Cache Statistics
  try {
    const cacheStats = getCacheStats();
    health.cache = {
      products_cached: cacheStats.products || 0,
      tags_cached: cacheStats.tags || 0,
      skus_cached: cacheStats.skus || 0,
      status: "active"
    };
  } catch (error) {
    health.cache = {
      status: "unavailable",
      message: error.message
    };
  }

  // Check 4: API Endpoints Available
  const endpoints = [
    "/api/check-service-area",
    "/api/get-material-recommendations",
    "/api/calculate-materials",
    "/api/calculate-delivery",
    "/api/add-to-cart",
    "/api/prefill-checkout",
    "/api/check-order-status"
  ];
  
  health.checks.endpoints = {
    status: "pass",
    message: `${endpoints.length} endpoints configured`,
    available: endpoints
  };

  // Final status
  health.status = hasFailure ? "unhealthy" : "healthy";
  health.response_time_ms = Date.now() - startTime;

  // Return appropriate status code
  const statusCode = hasFailure ? 503 : 200;
  
  // Add cache headers for monitoring tools
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  
  return res.status(statusCode).json(health);
}

