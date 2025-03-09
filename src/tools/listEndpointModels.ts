/**
 * listEndpointModels tool
 * Lists all models used by a specific endpoint from the Swagger definition
 */

import logger from "../utils/logger.js";
import swaggerService from "../services/index.js";

// Tool definition
export const listEndpointModels = {
  name: "listEndpointModels",
  description: "Lists all models used by a specific endpoint from the Swagger definition.",
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
      swaggerFilePath: {
        type: "string",
        description: "Path to the Swagger file. This should be the full file path that was saved in the .swagger-mcp file after calling getSwaggerDefinition. You can find this path in the .swagger-mcp file in the solution root with the format SWAGGER_FILEPATH=path/to/file.json."
      }
    },
    required: ["path", "method", "swaggerFilePath"]
  }
};

// Tool handler
export async function handleListEndpointModels(input: any) {
  logger.info('Calling swaggerService.listEndpointModels()');
  logger.info(`Query parameters: ${JSON.stringify(input)}`);
  
  try {
    const models = await swaggerService.listEndpointModels(input);
    logger.info(`Models response: ${JSON.stringify(models).substring(0, 200)}...`);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(models, null, 2)
      }]
    };
  } catch (error: any) {
    logger.error(`Error in listEndpointModels handler: ${error.message}`);
    return {
      content: [{
        type: "text",
        text: `Error retrieving endpoint models: ${error.message}`
      }]
    };
  }
} 