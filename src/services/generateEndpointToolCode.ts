/**
 * Generate Endpoint Tool Code Service
 * Generates TypeScript code for an MCP tool definition based on a Swagger endpoint
 * with full model schemas included in the inputSchema
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import logger from '../utils/logger.js';
import listEndpointModels from './listEndpointModels.js';
import { Model } from './listEndpointModels.js';

// Interface for the function parameters
export interface GenerateEndpointToolCodeParams {
  path: string;
  method: string;
  swaggerFilePath: string; // Required path to the Swagger file
  includeApiInName?: boolean;
  includeVersionInName?: boolean;
  singularizeResourceNames?: boolean;
}

/**
 * Generates TypeScript code for an MCP tool definition based on a Swagger endpoint
 * @param params Object containing the endpoint path, method, and swagger file path
 * @returns TypeScript code for the MCP tool definition
 */
async function generateEndpointToolCode(params: GenerateEndpointToolCodeParams): Promise<string> {
  try {
    const { 
      path: endpointPath, 
      method,
      swaggerFilePath,
      includeApiInName = false,
      includeVersionInName = false,
      singularizeResourceNames = true
    } = params;
    
    if (!swaggerFilePath) {
      throw new Error('Swagger file path is required');
    }
    
    if (!fs.existsSync(swaggerFilePath)) {
      throw new Error(`Swagger file not found at ${swaggerFilePath}`);
    }
    
    // Read the Swagger definition file
    logger.info(`Reading Swagger definition from ${swaggerFilePath}`);
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
    
    // Parse the Swagger definition based on file extension
    let swaggerDefinition;
    if (swaggerFilePath.endsWith('.yml') || swaggerFilePath.endsWith('.yaml')) {
      swaggerDefinition = yaml.load(swaggerContent);
    } else {
      swaggerDefinition = JSON.parse(swaggerContent);
    }
    
    // Find the endpoint in the Swagger definition
    const endpoint = findEndpoint(swaggerDefinition, endpointPath, method);
    if (!endpoint) {
      throw new Error(`Method '${method}' not found for endpoint path '${endpointPath}'`);
    }
    
    // Generate a tool name
    const toolName = generateToolName(method, endpointPath, endpoint.operationId, includeApiInName, includeVersionInName, singularizeResourceNames);
    
    // Generate the inputSchema
    const inputSchema = generateInputSchema(swaggerDefinition, endpoint);
    
    // Generate the tool definition
    const toolDefinition = generateToolDefinition(toolName, endpoint, inputSchema);
    
    // Generate the handler function
    const handlerFunction = generateHandlerFunction(toolName, method, endpointPath);
    
    // Combine the tool definition and handler function
    return `${toolDefinition}\n\n${handlerFunction}`;
  } catch (error: any) {
    logger.error(`Error generating endpoint tool code: ${error.message}`);
    throw error;
  }
}

/**
 * Find an endpoint in the Swagger definition
 * @param swaggerDefinition The Swagger definition object
 * @param endpointPath The path of the endpoint
 * @param method The HTTP method of the endpoint
 * @returns The endpoint object or undefined if not found
 */
function findEndpoint(swaggerDefinition: any, endpointPath: string, method: string): any {
  const paths = swaggerDefinition.paths || {};
  const pathObj = paths[endpointPath];
  
  if (!pathObj) {
    throw new Error(`Endpoint path '${endpointPath}' not found in Swagger definition`);
  }
  
  const endpoint = pathObj[method.toLowerCase()];
  
  if (!endpoint) {
    throw new Error(`Method '${method}' not found for endpoint path '${endpointPath}'`);
  }
  
  return endpoint;
}

/**
 * Generate a tool name based on the method, path, and operationId
 * @param method The HTTP method of the endpoint
 * @param path The path of the endpoint
 * @param operationId The operationId from the Swagger definition
 * @param includeApiInName Whether to include 'api' segments in the name
 * @param includeVersionInName Whether to include version segments in the name
 * @param singularizeResourceNames Whether to singularize resource names
 * @returns The generated tool name
 */
function generateToolName(
  method: string, 
  path: string, 
  operationId?: string,
  includeApiInName = false,
  includeVersionInName = false,
  singularizeResourceNames = true
): string {
  // Use a more semantic method prefix
  const methodPrefix = {
    'GET': 'get',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  }[method.toUpperCase()] || method.toLowerCase();
  
  // If operationId is available and looks good, use it
  if (operationId && !operationId.includes('_') && !operationId.includes('.')) {
    return operationId;
  }
  
  // Process the path to create a resource name
  // Remove file extension and query parameters
  let cleanPath = path.replace(/\.[^/.]+$/, '').split('?')[0];
  
  // Split the path into segments
  const segments = cleanPath.split('/').filter(Boolean);
  
  // Process each segment
  const processedSegments = segments.map((segment, index) => {
    // Skip 'api' segments if not including them
    if (segment.toLowerCase() === 'api' && !includeApiInName) {
      return '';
    }
    
    // Skip version segments if not including them
    if (segment.match(/^v\d+$/) && !includeVersionInName) {
      return '';
    }
    
    // Handle path parameters (e.g., {id})
    if (segment.startsWith('{') && segment.endsWith('}')) {
      // Convert {id} to Id
      return segment.substring(1, segment.length - 1).charAt(0).toUpperCase() + 
             segment.substring(1, segment.length - 1).slice(1);
    }
    
    // Singularize resource names if requested
    let processedSegment = segment;
    if (singularizeResourceNames && index === segments.length - 1 && segment.endsWith('s')) {
      // Simple singularization - remove trailing 's'
      // This is a simplistic approach; a proper implementation would use a library like pluralize
      processedSegment = segment.endsWith('ies') 
        ? segment.slice(0, -3) + 'y'  // e.g., "companies" -> "company"
        : segment.endsWith('s') 
          ? segment.slice(0, -1)      // e.g., "tasks" -> "task"
          : segment;
    }
    
    // Capitalize the first letter
    return processedSegment.charAt(0).toUpperCase() + processedSegment.slice(1);
  }).filter(Boolean); // Remove empty segments
  
  // Combine the method prefix and processed segments
  return methodPrefix + processedSegments.join('');
}

/**
 * Generate the inputSchema for the tool
 * @param swaggerDefinition The Swagger definition object
 * @param endpoint The endpoint object
 * @returns The inputSchema object
 */
function generateInputSchema(swaggerDefinition: any, endpoint: any): any {
  const inputSchema: any = {
    type: 'object',
    properties: {},
    required: []
  };
  
  // Process parameters
  if (endpoint.parameters) {
    for (const param of endpoint.parameters) {
      // Skip parameters in header or formData
      if (param.in === 'header' || param.in === 'formData') {
        continue;
      }
      
      // Process path parameters
      if (param.in === 'path') {
        inputSchema.properties[param.name] = {
          type: mapSwaggerTypeToJsonSchema(param.type),
          description: param.description || `Path parameter: ${param.name}`
        };
        
        if (param.required) {
          inputSchema.required.push(param.name);
        }
      }
      
      // Process query parameters
      if (param.in === 'query') {
        inputSchema.properties[param.name] = {
          type: mapSwaggerTypeToJsonSchema(param.type),
          description: param.description || `Query parameter: ${param.name}`
        };
        
        if (param.enum) {
          inputSchema.properties[param.name].enum = param.enum;
        }
        
        if (param.required) {
          inputSchema.required.push(param.name);
        }
      }
      
      // Process body parameters
      if (param.in === 'body') {
        // Use a better parameter name (without dots)
        const paramName = param.name.replace(/\./g, '');
        
        if (param.schema && param.schema.$ref) {
          // Extract the model name from the reference
          const modelName = param.schema.$ref.split('/').pop();
          
          // Extract the full schema for the model
          const modelSchema = extractModelSchema(swaggerDefinition, modelName);
          
          // Add the model schema to the inputSchema
          inputSchema.properties[paramName] = {
            ...modelSchema,
            description: param.description || `Request body: ${paramName}`
          };
        } else if (param.schema) {
          // Inline schema
          inputSchema.properties[paramName] = {
            ...processSchema(swaggerDefinition, param.schema),
            description: param.description || `Request body: ${paramName}`
          };
        }
        
        if (param.required) {
          inputSchema.required.push(paramName);
        }
      }
    }
  }
  
  // Handle OpenAPI 3.0 requestBody
  if (endpoint.requestBody) {
    const contentTypes = endpoint.requestBody.content || {};
    const jsonContent = contentTypes['application/json'];
    
    if (jsonContent && jsonContent.schema) {
      const schema = jsonContent.schema;
      const paramName = 'requestBody';
      
      if (schema.$ref) {
        // Extract the model name from the reference
        const modelName = schema.$ref.split('/').pop();
        
        // Extract the full schema for the model
        const modelSchema = extractModelSchema(swaggerDefinition, modelName);
        
        // Add the model schema to the inputSchema
        inputSchema.properties[paramName] = {
          ...modelSchema,
          description: endpoint.requestBody.description || `Request body`
        };
      } else {
        // Inline schema
        inputSchema.properties[paramName] = {
          ...processSchema(swaggerDefinition, schema),
          description: endpoint.requestBody.description || `Request body`
        };
      }
      
      if (endpoint.requestBody.required) {
        inputSchema.required.push(paramName);
      }
    }
  }
  
  return inputSchema;
}

/**
 * Extract the complete schema for a model
 * @param swaggerDefinition The Swagger definition object
 * @param modelName The name of the model
 * @returns The model schema
 */
function extractModelSchema(swaggerDefinition: any, modelName: string): any {
  const model = swaggerDefinition.definitions?.[modelName] || swaggerDefinition.components?.schemas?.[modelName];
  if (!model) {
    return { type: 'object', description: `Model '${modelName}' not found` };
  }
  
  return processSchema(swaggerDefinition, model);
}

/**
 * Process a schema recursively
 * @param swaggerDefinition The Swagger definition object
 * @param schema The schema to process
 * @returns The processed schema
 */
function processSchema(swaggerDefinition: any, schema: any): any {
  if (!schema) {
    return { type: 'object' };
  }
  
  // Handle $ref
  if (schema.$ref) {
    const modelName = schema.$ref.split('/').pop();
    return extractModelSchema(swaggerDefinition, modelName);
  }
  
  // Handle array
  if (schema.type === 'array' && schema.items) {
    return {
      type: 'array',
      items: processSchema(swaggerDefinition, schema.items),
      description: schema.description
    };
  }
  
  // Handle object
  if (schema.type === 'object' || schema.properties) {
    const result: any = {
      type: 'object',
      properties: {},
      required: schema.required || []
    };
    
    if (schema.description) {
      result.description = schema.description;
    }
    
    // Process properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries<any>(schema.properties)) {
        result.properties[propName] = processSchema(swaggerDefinition, propSchema);
      }
    }
    
    return result;
  }
  
  // Handle primitive types
  const result: any = {
    type: mapSwaggerTypeToJsonSchema(schema.type)
  };
  
  if (schema.description) {
    result.description = schema.description;
  }
  
  if (schema.enum) {
    result.enum = schema.enum;
  }
  
  if (schema.format) {
    result.format = schema.format;
  }
  
  return result;
}

/**
 * Map Swagger types to JSON Schema types
 * @param swaggerType The Swagger type
 * @returns The JSON Schema type
 */
function mapSwaggerTypeToJsonSchema(swaggerType: string): string {
  const typeMap: Record<string, string> = {
    'integer': 'integer',
    'number': 'number',
    'string': 'string',
    'boolean': 'boolean',
    'array': 'array',
    'object': 'object',
    'file': 'string',  // Map file to string (base64)
  };
  
  return typeMap[swaggerType] || 'string';
}

/**
 * Generate the tool definition
 * @param toolName The name of the tool
 * @param endpoint The endpoint object
 * @param inputSchema The inputSchema object
 * @returns The tool definition as a string
 */
function generateToolDefinition(toolName: string, endpoint: any, inputSchema: any): string {
  // Combine summary and description
  let description = '';
  
  // Add user-facing description
  if (endpoint.summary || endpoint.description) {
    description = [endpoint.summary, endpoint.description].filter(Boolean).join('. ');
  }
  
  // Generate basic AI instructions
  let aiDescription = '';
  const method = endpoint.operationId ? endpoint.operationId : (endpoint.method || 'unknown');
  
  aiDescription = `AI INSTRUCTIONS: This endpoint allows you to ${method.toLowerCase()} resources. `;
  
  // Add information about parameters
  if (endpoint.parameters && endpoint.parameters.length > 0) {
    const requiredParams = endpoint.parameters
      .filter((p: any) => p.required)
      .map((p: any) => p.name);
    
    if (requiredParams.length > 0) {
      aiDescription += `It requires the following parameters: ${requiredParams.join(', ')}. `;
    }
  }
  
  // Add information about response
  if (endpoint.responses && endpoint.responses['200']) {
    aiDescription += `On success, it returns a ${endpoint.responses['200'].description || '200 response'}.`;
  }
  
  // If there's already a description, add a separator
  if (description) {
    description += ' ';
  }
  description += aiDescription;
  
  // Format the inputSchema as a string with proper indentation
  const inputSchemaStr = JSON.stringify(inputSchema, null, 2)
    .replace(/"([^"]+)":/g, '$1:')  // Remove quotes around property names
    .replace(/"/g, "'");            // Replace double quotes with single quotes
  
  // According to the MCP schema, we can only use name, description, and inputSchema
  return `/**
 * ${endpoint.summary || ''}
 * ${endpoint.description || ''}
 */
export const ${toolName} = {
  name: "${toolName}",
  description: "${escapeString(description)}",
  inputSchema: ${inputSchemaStr}
};`;
}

/**
 * Generate the handler function
 * @param toolName The name of the tool
 * @param method The HTTP method of the endpoint
 * @param endpointPath The path of the endpoint
 * @returns The handler function as a string
 */
function generateHandlerFunction(toolName: string, method: string, endpointPath: string): string {
  return `
// Tool handler
export async function handle${toolName}(input: any) {
  try {
    // TODO: Implement API call to ${method.toUpperCase()} ${endpointPath}
    // const response = await apiClient.${method.toLowerCase()}('${endpointPath}', input);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, message: "Not implemented yet" }, null, 2)
      }]
    };
  } catch (error: any) {
    return {
      content: [{
        type: "text",
        text: \`Error: \${error.message}\`
      }]
    };
  }
}`;
}

/**
 * Escape special characters in a string for use in a JavaScript string literal
 * @param str The string to escape
 * @returns The escaped string
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

export default generateEndpointToolCode; 