/**
 * listEndpoints tool
 * Lists all endpoints from the Swagger definition
 */

import logger from "../utils/logger.js";
import swaggerService from "../services/index.js";

// Tool definition
export const listEndpoints = {
  name: "listEndpoints",
  description: "Lists all endpoints from the Swagger definition including their HTTP methods and descriptions.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

// Tool handler
export async function handleListEndpoints() {
  logger.info('Calling swaggerService.listEndpoints()');
  
  try {
    const endpoints = await swaggerService.listEndpoints();
    logger.info(`Endpoints response: ${JSON.stringify(endpoints).substring(0, 200)}...`);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(endpoints, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error(`Error in listEndpoints handler: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: `Error retrieving endpoints: ${error.message}`
      }]
    };
  }
} 