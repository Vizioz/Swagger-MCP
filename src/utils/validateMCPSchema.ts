/**
 * MCP Schema Validation Utility
 * Validates generated tool code against the MCP schema
 */

import logger from './logger.js';

/**
 * Validates a generated tool definition against the MCP schema
 * @param toolCode The generated TypeScript code for the tool
 * @returns An object with validation result and any error messages
 */
export function validateMCPSchema(toolCode: string): { isValid: boolean; errors: string[] } {
  try {
    logger.info('Validating tool definition against MCP schema...');
    const errors: string[] = [];
    
    // Check if the tool has a name property
    const nameMatch = toolCode.match(/name:\s*["']([^"']+)["']/);
    if (!nameMatch) {
      errors.push('Missing "name" property in tool definition');
    }
    
    // Check if the tool has a description property
    const descMatch = toolCode.match(/description:\s*["']([^"']+)["']/);
    if (!descMatch) {
      logger.warn('Missing "description" property in tool definition (optional)');
      // Description is optional, so we don't add to errors
    }
    
    // Check if the tool has an inputSchema property
    const schemaMatch = toolCode.match(/inputSchema:\s*{/);
    if (!schemaMatch) {
      errors.push('Missing "inputSchema" property in tool definition');
    }
    
    // Check if the inputSchema has a type property
    const typeMatch = toolCode.match(/type:\s*["']object["']/);
    if (!typeMatch) {
      errors.push('Missing or incorrect "type" property in inputSchema (must be "object")');
    }
    
    // Check if the inputSchema has a properties property
    const propertiesMatch = toolCode.match(/properties:\s*{/);
    if (!propertiesMatch) {
      logger.warn('Missing "properties" property in inputSchema (optional)');
      // Properties is technically optional, so we don't add to errors
    }
    
    // Check if the inputSchema has a required property
    const requiredMatch = toolCode.match(/required:\s*\[/);
    if (!requiredMatch) {
      logger.warn('Missing "required" property in inputSchema (optional)');
      // Required is optional, so we don't add to errors
    }
    
    // Additional validation: Check for handler function
    const handlerMatch = toolCode.match(/export async function handle(\w+)/);
    if (!handlerMatch) {
      errors.push('Missing handler function in tool definition');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error: any) {
    logger.error(`Error validating tool against MCP schema: ${error.message}`);
    return {
      isValid: false,
      errors: [`Error validating tool against MCP schema: ${error.message}`]
    };
  }
}

/**
 * Formats validation errors into a structured error message
 * @param errors Array of validation error messages
 * @returns A formatted error message string
 */
export function formatValidationErrors(errors: string[]): string {
  return `
MCP Schema Validation Failed
============================

The generated tool definition does not comply with the MCP schema.
Please fix the following issues:

${errors.map(error => `- ${error}`).join('\n')}

For more information about the MCP schema, see:
https://github.com/ModelContextProtocol/spec
`;
} 