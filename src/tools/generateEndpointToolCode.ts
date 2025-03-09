/**
 * generateEndpointToolCode tool
 * Generates TypeScript code for an MCP tool definition based on a Swagger endpoint
 */

import logger from "../utils/logger.js";
import swaggerService from "../services/index.js";

// Tool definition
export const generateEndpointToolCode = {
  name: "generateEndpointToolCode",
  description: "Generates TypeScript code for an MCP tool definition based on a Swagger endpoint.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path of the endpoint (e.g. /pets)"
      },
      method: {
        type: "string",
        description: "The HTTP method of the endpoint (e.g. GET, POST, PUT, DELETE)"
      },
      includeApiInName: {
        type: "boolean",
        description: "Whether to include 'api' segments in the generated tool name (default: false)"
      },
      includeVersionInName: {
        type: "boolean",
        description: "Whether to include version segments (e.g., 'v3') in the generated tool name (default: false)"
      },
      singularizeResourceNames: {
        type: "boolean",
        description: "Whether to singularize resource names in the generated tool name (default: true)"
      }
    },
    required: ["path", "method"]
  }
};

// Tool handler
export async function handleGenerateEndpointToolCode(input: any) {
  logger.info('Calling swaggerService.generateEndpointToolCode()');
  logger.info(`Query parameters: ${JSON.stringify(input)}`);
  
  try {
    const tsCode = await swaggerService.generateEndpointToolCode(input);
    logger.info(`Generated TypeScript code for endpoint ${input.method} ${input.path}`);
    
    return {
      content: [{
        type: "text",
        text: tsCode
      }]
    };
  } catch (error: any) {
    logger.error(`Error in generateEndpointToolCode handler: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: `Error generating endpoint tool code: ${error.message}`
      }]
    };
  }
} 