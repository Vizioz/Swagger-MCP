/**
 * Generate Endpoint Tool Code Service
 * Generates TypeScript code for an MCP tool definition based on a Swagger endpoint
 * with full model schemas included in the inputSchema
 */

import fs from 'fs';
import yaml from 'js-yaml';
import logger from '../utils/logger.js';
import { validateMCPSchema, formatValidationErrors } from '../utils/validateMCPSchema.js';

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
      throw new Error(`Invalid or unsupported HTTP method '${method}' for endpoint path '${endpointPath}'`);
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
    const generatedCode = `${toolDefinition}\n\n${handlerFunction}`;
    
    // Validate the generated code against the MCP schema
    logger.info('Validating generated code against MCP schema');
    const validationResult = validateMCPSchema(generatedCode);
    
    if (!validationResult.isValid) {
      logger.error('Generated code failed MCP schema validation');
      return formatValidationErrors(validationResult.errors);
    }
    
    logger.info('Generated code passed MCP schema validation');
    return generatedCode;
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
    throw new Error(`Invalid or unsupported HTTP method '${method}' for endpoint path '${endpointPath}'`);
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
  const methodPrefix = {
    'GET': 'get',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  }[method.toUpperCase()] || method.toLowerCase();

  const methodPrefixShort = {
    'GET': 'get',
    'POST': 'crt',
    'PUT': 'upd',
    'PATCH': 'upd',
    'DELETE': 'del'
  }[method.toUpperCase()] || method.toLowerCase();


  if (operationId && !operationId.includes('_') && !operationId.includes('.')) {
    return operationId.substring(0, 64);
  }

  const abbreviationMap: Record<string, string> = {
    'organization': 'org',
    'organizations': 'orgs',
    'generate': 'gen',
    'information': 'info',
    'application': 'app',
    'applications': 'apps',
    'identification': 'id',
    'parameter': 'param',
    'parameters': 'params',
    'report': 'rpt',
    'configuration': 'config',
    'administrator': 'admin',
    'authentication': 'auth',
    'authorization': 'authz',
    'notification': 'notice',
    'notifications': 'notices',
    'document': 'doc',
    'documents': 'docs',
    'category': 'cat',
    'categories': 'cats',
    'subscription': 'sub',
    'subscriptions': 'subs',
    'preference': 'pref',
    'preferences': 'prefs',
    'message': 'msg',
    'messages': 'msgs',
    'profile': 'prof',
    'profiles': 'profs',
    'setting': 'set',
    'settings': 'sets'
  };

  let cleanPath = path.replace(/\.[^/.]+$/, '').split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  const processedSegments = segments.map((segment, index) => {
    if (segment.toLowerCase() === 'api' && !includeApiInName) {
      return '';
    }

    if (segment.match(/^v\d+$/) && !includeVersionInName) {
      return '';
    }

    if (segment.startsWith('{') && segment.endsWith('}')) {
      const param = segment.substring(1, segment.length - 1);
      return param.charAt(0).toUpperCase() + param.slice(1);
    }

    let processedSegment = segment;
    if (singularizeResourceNames && index === segments.length - 1 && segment.endsWith('s')) {
      processedSegment = segment.endsWith('ies')
        ? segment.slice(0, -3) + 'y'
        : segment.slice(0, -1);
    }

    const shortSegment = abbreviationMap[processedSegment.toLowerCase()] || processedSegment;

    return shortSegment.charAt(0).toUpperCase() + shortSegment.slice(1);
  }).filter(Boolean);

  // Combine the method prefix and segments
  let toolName = methodPrefix;
  for (const segment of processedSegments) {
    toolName += segment;
  }

  // If the name exceeds 64 characters, try to make it meaningful
  if (toolName.length > 64) {
    // Try to shorten by removing less important segments
    let reducedName = methodPrefixShort;
    for (const segment of processedSegments) {
      if ((reducedName + segment).length <= 64) {
        reducedName += segment;
      } else {
        break;
      }
    }
    return reducedName;
  }

  return toolName;
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
    
    // Check if this is a potential json.Unmarshaler interface
    if (isLikelyUnmarshaler(swaggerDefinition, modelName)) {
      return processUnmarshalerType(swaggerDefinition, modelName);
    }
    
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
 * Check if a model is likely to be a json.Unmarshaler interface
 * @param swaggerDefinition The Swagger definition object
 * @param modelName The name of the model
 * @returns True if the model is likely to be a json.Unmarshaler interface
 */
function isLikelyUnmarshaler(swaggerDefinition: any, modelName: string): boolean {
  const model = swaggerDefinition.definitions?.[modelName] || swaggerDefinition.components?.schemas?.[modelName];
  
  // If the model is not found, check if the name suggests a special type
  if (!model) {
    // Check if the model name suggests a date/time or special type
    const specialTypeNames = [
      'Date', 'DateTime', 'Time', 'Duration', 'Timestamp',
      'Nullable', 'Optional', 'Slice', 'Array', 'List',
      'Int64', 'Float64', 'Bool', 'String'
    ];
    
    return specialTypeNames.some(name => modelName.includes(name));
  }
  
  // Check if the model name suggests a date/time type
  const dateTimeNames = ['Date', 'DateTime', 'Time', 'Duration', 'Timestamp'];
  if (dateTimeNames.some(name => modelName.includes(name))) {
    return true;
  }
  
  // Check if the description mentions unmarshaler
  if (model.description && 
      (model.description.toLowerCase().includes('unmarshaler') || 
       model.description.toLowerCase().includes('unmarshal'))) {
    return true;
  }
  
  // Check if it's an object with a single 'value' property
  if (model.type === 'object' && 
      model.properties && 
      Object.keys(model.properties).length === 1 && 
      model.properties.value) {
    return true;
  }
  
  return false;
}

/**
 * Process a json.Unmarshaler type
 * @param swaggerDefinition The Swagger definition object
 * @param modelName The name of the model
 * @returns The processed schema
 */
function processUnmarshalerType(swaggerDefinition: any, modelName: string): any {
  const model = swaggerDefinition.definitions?.[modelName] || swaggerDefinition.components?.schemas?.[modelName];
  
  // Handle specific known types by name
  if (modelName.includes('NullableDate')) {
    return {
      type: 'string',
      format: 'date',
      description: model?.description || 'A nullable date value (format: YYYY-MM-DD)'
    };
  }
  
  if (modelName.includes('NullableInt64Slice') || modelName.includes('NullableIntSlice')) {
    return {
      type: 'array',
      items: { type: 'integer' },
      description: model?.description || 'A nullable array of integers'
    };
  }
  
  if (modelName.includes('NullableTaskPriority')) {
    return {
      type: 'string',
      enum: ['low', 'normal', 'high'],
      description: model?.description || 'A nullable task priority value'
    };
  }
  
  // If the model is not found, infer the type from the name
  if (!model) {
    // Infer the type based on the model name
    let inferredType = 'string';
    let inferredFormat = '';
    let description = `Model '${modelName}' not found`;
    
    // Check for date/time types
    if (modelName.includes('Date') || modelName.includes('Time')) {
      inferredType = 'string';
      inferredFormat = modelName.includes('Time') ? 'date-time' : 'date';
      description = `${description} - Inferred as a date${modelName.includes('Time') ? '-time' : ''} value`;
    }
    // Check for numeric types
    else if (modelName.includes('Int') || modelName.includes('Float') || modelName.includes('Number')) {
      inferredType = modelName.includes('Float') ? 'number' : 'integer';
      description = `${description} - Inferred as a numeric value`;
    }
    // Check for boolean types
    else if (modelName.includes('Bool')) {
      inferredType = 'boolean';
      description = `${description} - Inferred as a boolean value`;
    }
    // Check for array/slice types
    else if (modelName.includes('Slice') || modelName.includes('Array') || modelName.includes('List')) {
      inferredType = 'array';
      description = `${description} - Inferred as an array`;
      
      // Try to infer the item type
      let itemType = 'string';
      if (modelName.includes('Int64Slice') || modelName.includes('IntArray')) {
        itemType = 'integer';
      } else if (modelName.includes('Float64Slice') || modelName.includes('FloatArray')) {
        itemType = 'number';
      } else if (modelName.includes('BoolSlice') || modelName.includes('BoolArray')) {
        itemType = 'boolean';
      }
      
      return {
        type: inferredType,
        items: { type: itemType },
        description: description
      };
    }
    
    return {
      type: inferredType,
      format: inferredFormat || undefined,
      description: description
    };
  }
  
  // If it's an object with a single 'value' property, extract that property
  if (model.type === 'object' && model.properties && model.properties.value) {
    const valueProperty = model.properties.value;
    
    // Create a primitive type with the appropriate format
    const result: any = {
      type: mapSwaggerTypeToJsonSchema(valueProperty.type || 'string')
    };
    
    // Add description from the model
    if (model.description) {
      result.description = model.description;
    }
    
    // Add format if available
    if (valueProperty.format) {
      result.format = valueProperty.format;
    }
    
    // Add description from the value property if available
    if (valueProperty.description) {
      result.description = result.description 
        ? `${result.description} (${valueProperty.description})`
        : valueProperty.description;
    }
    
    return result;
  }
  
  // For other cases, return a simplified representation
  return {
    type: model.type || 'object',
    description: model.description || `Model '${modelName}'`
  };
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