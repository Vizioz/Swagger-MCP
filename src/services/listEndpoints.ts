/**
 * List Endpoints Service
 * Retrieves all endpoints from the Swagger definition
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

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
 * @returns Array of endpoints with their HTTP methods and descriptions
 */
async function listEndpoints(): Promise<Endpoint[]> {
  try {
    // Read the .swagger-mcp file to get the Swagger filename
    const swaggerConfigPath = path.resolve(process.cwd(), '.swagger-mcp');
    const swaggerConfig = fs.readFileSync(swaggerConfigPath, 'utf8');
    const swaggerFilenameMatch = swaggerConfig.match(/SWAGGER_FILENAME=(.+)/);
    
    if (!swaggerFilenameMatch) {
      throw new Error('Swagger filename not found in .swagger-mcp file');
    }
    
    const swaggerFilename = swaggerFilenameMatch[1].trim();
    const swaggerFilePath = path.resolve(process.cwd(), swaggerFilename);
    
    // Read the Swagger definition file
    logger.info(`Reading Swagger definition from ${swaggerFilePath}`);
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
    const swaggerDefinition = JSON.parse(swaggerContent);
    
    const endpoints: Endpoint[] = [];
    
    // Handle OpenAPI 3.0.x format
    if (swaggerDefinition.openapi && swaggerDefinition.openapi.startsWith('3.')) {
      const paths = swaggerDefinition.paths || {};
      
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
    } 
    // Handle Swagger 2.0 format
    else if (swaggerDefinition.swagger && swaggerDefinition.swagger.startsWith('2.')) {
      const paths = swaggerDefinition.paths || {};
      
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
    } else {
      throw new Error('Unsupported Swagger/OpenAPI version');
    }
    
    return endpoints;
  } catch (error: any) {
    logger.error(`Error listing endpoints: ${error.message}`);
    throw error;
  }
}

export default listEndpoints; 