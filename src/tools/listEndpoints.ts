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
    properties: {
      swaggerFilePath: {
        type: "string",
        description: "Path to the Swagger file. This should be the full file path that was saved in the .swagger-mcp file after calling getSwaggerDefinition. You can find this path in the .swagger-mcp file in the solution root with the format SWAGGER_FILEPATH=path/to/file.json."
      }
    },
    required: ["swaggerFilePath"]
  }
};

// Tool handler
export async function handleListEndpoints(input: any) {
  logger.info('Calling swaggerService.listEndpoints()');
  logger.info(`Input parameters: ${JSON.stringify(input)}`);
  
  try {
    const endpoints = await swaggerService.listEndpoints(input);
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