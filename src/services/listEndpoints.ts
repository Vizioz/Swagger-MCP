/**
 * List Endpoints Service
 * Retrieves all endpoints from the Swagger definition
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import { SwaggerFileParams } from './core/interfaces.js';

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
 * @param params Object containing the path to the Swagger file
 * @returns Array of endpoints with their HTTP methods and descriptions
 */
async function listEndpoints(params: SwaggerFileParams): Promise<Endpoint[]> {
  try {
    const { swaggerFilePath } = params;
    
    if (!swaggerFilePath) {
      throw new Error('Swagger file path is required');
    }
    
    if (!fs.existsSync(swaggerFilePath)) {
      throw new Error(`Swagger file not found at ${swaggerFilePath}`);
    }
    
    // Read the Swagger file
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
    const swaggerJson = JSON.parse(swaggerContent);
    
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