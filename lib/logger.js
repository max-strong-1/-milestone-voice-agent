/**
 * Request Logger
 * Structured logging for API requests and tool calls
 * 
 * Logs are JSON formatted for easy parsing by monitoring tools
 */

/**
 * Log an API request with timing and result
 * @param {string} endpoint - API endpoint name
 * @param {Object} options - Log options
 * @param {Object} options.request - Request body (will be sanitized)
 * @param {Object} options.response - Response data
 * @param {number} options.status - HTTP status code
 * @param {number} options.duration_ms - Request duration in milliseconds
 * @param {Error} options.error - Error object if request failed
 */
export function logApiRequest(endpoint, { request, response, status, duration_ms, error }) {
  const log = {
    type: 'api_request',
    timestamp: new Date().toISOString(),
    endpoint,
    status: status || (error ? 500 : 200),
    duration_ms: duration_ms || 0,
  };

  // Add request info (sanitize sensitive data)
  if (request) {
    log.request = sanitizeRequest(request);
  }

  // Add response summary (not full response to keep logs manageable)
  if (response) {
    log.response_summary = summarizeResponse(response);
  }

  // Add error details
  if (error) {
    log.error = {
      message: error.message,
      code: error.code || error.response?.status,
    };
  }

  // Output as JSON for log aggregation tools
  console.log(JSON.stringify(log));
}

/**
 * Log a tool call from the voice agent
 * @param {string} tool - Tool name
 * @param {Object} options - Log options
 */
export function logToolCall(tool, { input, output, duration_ms, success }) {
  const log = {
    type: 'tool_call',
    timestamp: new Date().toISOString(),
    tool,
    success: success !== false,
    duration_ms: duration_ms || 0,
  };

  if (input) {
    log.input = sanitizeRequest(input);
  }

  if (output) {
    log.output_summary = summarizeResponse(output);
  }

  console.log(JSON.stringify(log));
}

/**
 * Log cache events
 * @param {string} action - 'hit' or 'miss' or 'set'
 * @param {string} cache_type - Type of cache (products, tags, skus)
 * @param {string} key - Cache key
 */
export function logCache(action, cache_type, key) {
  const log = {
    type: 'cache',
    timestamp: new Date().toISOString(),
    action,
    cache_type,
    key,
  };

  console.log(JSON.stringify(log));
}

/**
 * Log errors with context
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 * @param {Object} extra - Additional context
 */
export function logError(context, error, extra = {}) {
  const log = {
    type: 'error',
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      code: error.code,
    },
    ...extra,
  };

  console.error(JSON.stringify(log));
}

/**
 * Sanitize request data - remove sensitive fields
 */
function sanitizeRequest(request) {
  if (!request) return null;
  
  const sanitized = { ...request };
  
  // Remove potentially sensitive fields
  const sensitiveFields = ['password', 'token', 'api_key', 'secret', 'card', 'cvv'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Truncate very long fields
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.substring(0, 500) + '...[truncated]';
    }
  }
  
  return sanitized;
}

/**
 * Summarize response for logging (avoid huge log entries)
 */
function summarizeResponse(response) {
  if (!response) return null;
  
  const summary = {};
  
  // Include key fields that are useful for debugging
  const importantFields = [
    'success', 'error', 'message', 'status',
    'total', 'subtotal', 'delivery_fee',
    'cart_id', 'order_id', 'session_id',
    'zip_code', 'in_service_area'
  ];
  
  for (const field of importantFields) {
    if (response[field] !== undefined) {
      summary[field] = response[field];
    }
  }
  
  // Add counts for arrays
  if (response.materials && Array.isArray(response.materials)) {
    summary.materials_count = response.materials.length;
  }
  if (response.products && Array.isArray(response.products)) {
    summary.products_count = response.products.length;
  }
  if (response.items && Array.isArray(response.items)) {
    summary.items_count = response.items.length;
  }
  
  return summary;
}

/**
 * Create a request timer for measuring duration
 * @returns {Function} Call to get elapsed time in ms
 */
export function startTimer() {
  const start = Date.now();
  return () => Date.now() - start;
}

