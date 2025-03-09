/**
 * List Endpoint Models Service
 * Retrieves all models used by a specific endpoint from the Swagger definition
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

// Interface for model information
export interface Model {
  name: string;
  schema?: any;
}

// Interface for the function parameters
export interface ListEndpointModelsParams {
  path: string;
  method: string;
}

/**
 * Lists all models used by a specific endpoint from the Swagger definition
 * @param params Object containing path and method of the endpoint
 * @returns Array of models used by the endpoint
 */
async function listEndpointModels(params: ListEndpointModelsParams): Promise<Model[]> {
  try {
    const { path: endpointPath, method } = params;
    
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
    
    const models: Model[] = [];
    const processedRefs = new Set<string>(); // To avoid processing the same ref multiple times
    
    // Handle OpenAPI 3.0.x format
    if (swaggerDefinition.openapi && swaggerDefinition.openapi.startsWith('3.')) {
      const paths = swaggerDefinition.paths || {};
      const pathItem = paths[endpointPath];
      
      if (!pathItem) {
        throw new Error(`Path ${endpointPath} not found in Swagger definition`);
      }
      
      const operation = pathItem[method.toLowerCase()];
      
      if (!operation) {
        throw new Error(`Method ${method} not found for path ${endpointPath}`);
      }
      
      // Process request body
      if (operation.requestBody && operation.requestBody.content) {
        for (const contentType in operation.requestBody.content) {
          const mediaType = operation.requestBody.content[contentType];
          if (mediaType.schema) {
            extractReferencedModels(mediaType.schema, models, processedRefs, swaggerDefinition);
          }
        }
      }
      
      // Process parameters
      if (operation.parameters) {
        for (const param of operation.parameters) {
          if (param.schema) {
            extractReferencedModels(param.schema, models, processedRefs, swaggerDefinition);
          }
        }
      }
      
      // Process responses
      if (operation.responses) {
        for (const statusCode in operation.responses) {
          const response = operation.responses[statusCode];
          if (response.content) {
            for (const contentType in response.content) {
              const mediaType = response.content[contentType];
              if (mediaType.schema) {
                extractReferencedModels(mediaType.schema, models, processedRefs, swaggerDefinition);
              }
            }
          }
        }
      }
    } 
    // Handle Swagger 2.0 format
    else if (swaggerDefinition.swagger && swaggerDefinition.swagger.startsWith('2.')) {
      const paths = swaggerDefinition.paths || {};
      const pathItem = paths[endpointPath];
      
      if (!pathItem) {
        throw new Error(`Path ${endpointPath} not found in Swagger definition`);
      }
      
      const operation = pathItem[method.toLowerCase()];
      
      if (!operation) {
        throw new Error(`Method ${method} not found for path ${endpointPath}`);
      }
      
      // Process parameters
      if (operation.parameters) {
        for (const param of operation.parameters) {
          if (param.schema) {
            extractReferencedModels(param.schema, models, processedRefs, swaggerDefinition);
          } else if (param.type === 'array' && param.items) {
            extractReferencedModels(param.items, models, processedRefs, swaggerDefinition);
          }
        }
      }
      
      // Process responses
      if (operation.responses) {
        for (const statusCode in operation.responses) {
          const response = operation.responses[statusCode];
          if (response.schema) {
            extractReferencedModels(response.schema, models, processedRefs, swaggerDefinition);
          }
        }
      }
    } else {
      throw new Error('Unsupported Swagger/OpenAPI version');
    }
    
    return models;
  } catch (error: any) {
    logger.error(`Error listing endpoint models: ${error.message}`);
    throw error;
  }
}

/**
 * Recursively extracts referenced models from a schema
 */
function extractReferencedModels(
  schema: any, 
  models: Model[], 
  processedRefs: Set<string>,
  swaggerDefinition: any
): void {
  if (!schema) return;
  
  // Handle $ref
  if (schema.$ref) {
    const ref = schema.$ref;
    if (processedRefs.has(ref)) return;
    
    processedRefs.add(ref);
    
    // Extract model name from reference
    const refParts = ref.split('/');
    const modelName = refParts[refParts.length - 1];
    
    // Add model to the list
    models.push({
      name: modelName,
      schema: resolveReference(ref, swaggerDefinition)
    });
    
    // Process the referenced schema to find nested references
    const referencedSchema = resolveReference(ref, swaggerDefinition);
    if (referencedSchema) {
      extractReferencedModels(referencedSchema, models, processedRefs, swaggerDefinition);
    }
  }
  
  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    extractReferencedModels(schema.items, models, processedRefs, swaggerDefinition);
  }
  
  // Handle objects with properties
  if (schema.properties) {
    for (const propName in schema.properties) {
      extractReferencedModels(schema.properties[propName], models, processedRefs, swaggerDefinition);
    }
  }
  
  // Handle allOf, anyOf, oneOf
  ['allOf', 'anyOf', 'oneOf'].forEach(key => {
    if (Array.isArray(schema[key])) {
      schema[key].forEach((subSchema: any) => {
        extractReferencedModels(subSchema, models, processedRefs, swaggerDefinition);
      });
    }
  });
}

/**
 * Resolves a JSON reference in the Swagger definition
 */
function resolveReference(ref: string, swaggerDefinition: any): any {
  const refParts = ref.split('/');
  
  // Remove the first part (#)
  refParts.shift();
  
  // Navigate through the swagger definition
  let current = swaggerDefinition;
  for (const part of refParts) {
    if (!current[part]) {
      return null;
    }
    current = current[part];
  }
  
  return current;
}

export default listEndpointModels; 