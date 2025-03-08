/**
 * getSwaggerDefinition tool
 * Retrieves the Swagger definition
 */

import logger from "../utils/logger.js";
import swaggerService from "../services/index.js";

// Tool definition
export const getSwaggerDefinition = {
  name: "getSwaggerDefinition",
  description: "If there is not a Swagger definition file in the root of the solution, you need to get the Swagger / OpenAPI definition by calling this tool with the URL of the Swagger definition. When this completes, you must save the filename to a configuration file called `.swagger-mcp` in the root of the solution. This file will be used by the other tools to generate the MCP wrapper. Save the filename in the format `SWAGGER_FILENAME=TheFileName.extension`.",
  inputSchema: {
    type: "object",
    properties: {
      // String parameters
      url: {
        type: "string",
        description: "The URL of the Swagger definition"
      }
    },
    required: ["url"]
  }
};

// Tool handler
export async function handleGetSwaggerDefinition(input: any) {
  logger.info('Calling swaggerService.getSwaggerDefinition()');
  logger.info(`Query parameters: ${JSON.stringify(input)}`);
  
  try {
    const swaggerDefinition = await swaggerService.getSwaggerDefinition(input);
    logger.info(`Swagger definition response type: ${typeof swaggerDefinition}`);
    
    // Debug the response
    if (swaggerDefinition === null || swaggerDefinition === undefined) {
      logger.warn('Swagger definition response is null or undefined');
    } else if (Array.isArray(swaggerDefinition)) {
      logger.info(`Swagger definition array length: ${swaggerDefinition.length}`);
    } else {
      logger.info(`Swagger definition response is not an array: ${JSON.stringify(swaggerDefinition).substring(0, 200)}...`);
    }
    
    try {
      const jsonString = JSON.stringify(swaggerDefinition, null, 2);
      logger.info(`Successfully stringified swagger definition response`);
      return {
        content: [{
          type: "text",
          text: jsonString
        }]
      };
    } catch (jsonError: any) {
      logger.error(`JSON stringify error: ${jsonError.message}`);
      return {
        content: [{
          type: "text",
          text: `Error converting response to JSON: ${jsonError.message}`
        }]
      };
    }
  } catch (error: any) {
    logger.error(`Error in getSwaggerDefinition handler: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: `Error retrieving swagger definition: ${error.message}`
      }]
    };
  }
} 