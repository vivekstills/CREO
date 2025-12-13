/**
 * Utility functions for safe JSON parsing and validation
 */

/**
 * Safely parse JSON with detailed error reporting
 */
export function safeJsonParse<T = any>(
  text: string,
  fallback?: T
): { data?: T; error?: string; success: boolean } {
  try {
    // Check for empty input
    if (!text || text.trim() === '') {
      return {
        success: false,
        error: 'Empty input provided',
        data: fallback
      };
    }

    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    
    // Try to parse
    const parsed = JSON.parse(cleanText);
    
    return {
      success: true,
      data: parsed as T
    };
  } catch (error) {
    // Extract useful error information
    let errorMessage = 'Invalid JSON format';
    
    if (error instanceof SyntaxError) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const position = parseInt(match[1]);
        const excerpt = text.substring(Math.max(0, position - 50), position + 50);
        errorMessage = `JSON parse error at position ${position}: "${excerpt}"`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      data: fallback
    };
  }
}

/**
 * Attempt to fix common JSON issues
 */
export function attemptJsonRepair(text: string): string {
  let repaired = text;
  
  // Remove trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix single quotes to double quotes (carefully)
  repaired = repaired.replace(/'/g, '"');
  
  // Remove comments (// and /* */)
  repaired = repaired.replace(/\/\/.*$/gm, '');
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Ensure proper quotes around keys
  repaired = repaired.replace(/(\w+):/g, '"$1":');
  
  // Fix multiple quotes
  repaired = repaired.replace(/"{2,}/g, '"');
  
  // Remove any control characters
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, '');
  
  return repaired;
}

/**
 * Validate JSON against a schema (simple version)
 */
export function validateJsonStructure(
  data: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      missing: requiredFields
    };
  }
  
  const missing = requiredFields.filter(field => !(field in data));
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Extract JSON from mixed content (e.g., markdown with JSON blocks)
 */
export function extractJsonFromText(text: string): string | null {
  // Try to find JSON blocks in various formats
  const patterns = [
    /```json\s*([\s\S]*?)```/,  // Markdown code block
    /```\s*([\s\S]*?)```/,       // Generic code block
    /\{[\s\S]*\}/,               // Raw JSON object
    /\[[\s\S]*\]/                // Raw JSON array
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const content = match[1] || match[0];
      const { success } = safeJsonParse(content);
      if (success) {
        return content;
      }
    }
  }
  
  return null;
}

/**
 * Format JSON for display with syntax highlighting support
 */
export function formatJson(
  data: any,
  indent: number = 2
): string {
  try {
    return JSON.stringify(data, null, indent);
  } catch (error) {
    return String(data);
  }
}

/**
 * Deep merge two objects (useful for default configs)
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        output[key] = deepMerge(
          target[key] || {},
          source[key] as any
        );
      } else {
        output[key] = source[key] as any;
      }
    }
  });
  
  return output;
}

/**
 * Safely access nested properties in objects
 */
export function safeGet(
  obj: any,
  path: string,
  defaultValue?: any
): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Check if a string is valid JSON without throwing
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert various response formats to a consistent structure
 */
export function normalizeApiResponse(response: any): {
  data: any;
  error: string | null;
  metadata: Record<string, any>;
} {
  // Handle different API response formats
  if (response.error) {
    return {
      data: null,
      error: response.error.message || response.error,
      metadata: response
    };
  }
  
  if (response.success === false) {
    return {
      data: null,
      error: response.message || 'Request failed',
      metadata: response
    };
  }
  
  // Extract data from various formats
  const data = response.data || 
               response.result || 
               response.choices ||
               response.response ||
               response;
  
  return {
    data,
    error: null,
    metadata: {
      status: response.status,
      timestamp: response.timestamp || new Date().toISOString(),
      ...response
    }
  };
}
