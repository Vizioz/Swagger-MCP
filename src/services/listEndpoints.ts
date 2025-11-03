/**
 * List Endpoints Service
 * Retrieves all endpoints from the Swagger definition
 */

import logger from '../utils/logger.js';
import { loadSwaggerDefinition } from '../utils/swaggerLoader.js';

// Interface for endpoint information
export interface Endpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
}

/**
 * Lists all endpoints from the Swagger definition
 * Priority: CLI --swagger-url > swaggerFilePath parameter
 * @param params Optional object containing the path to the Swagger file
 * @returns Array of endpoints with their HTTP methods and descriptions
 */
async function listEndpoints(params?: { swaggerFilePath?: string }): Promise<Endpoint[]> {
  try {
    // Load Swagger definition (checks CLI arg, then swaggerFilePath, then env var)
    const swaggerJson = await loadSwaggerDefinition(params?.swaggerFilePath);

    // Check if it's OpenAPI or Swagger
    const isOpenApi = !!swaggerJson.openapi;
    const paths = swaggerJson.paths || {};

    // Extract endpoints
    const endpoints: Endpoint[] = [];

    for (const path in paths) {
      const pathItem = paths[path];

      for (const method in pathItem) {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          const operation = pathItem[method];

          endpoints.push({
            path,
            method: method.toUpperCase(),
            summary: operation.summary,
            description: operation.description,
            operationId: operation.operationId,
            tags: operation.tags
          });
        }
      }
    }

    return endpoints;
  } catch (error: any) {
    logger.error(`Error listing endpoints: ${error.message}`);
    throw error;
  }
}

export default listEndpoints; 