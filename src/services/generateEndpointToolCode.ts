/**
 * Generate Endpoint Tool Code Service
 * Generates TypeScript code for an MCP tool definition based on a Swagger endpoint
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import listEndpointModels from './listEndpointModels.js';
import { Model } from './listEndpointModels.js';

// Interface for the function parameters
export interface GenerateEndpointToolCodeParams {
  path: string;
  method: string;
  includeApiInName?: boolean;
  includeVersionInName?: boolean;
  singularizeResourceNames?: boolean;
}

/**
 * Generates TypeScript code for an MCP tool definition based on a Swagger endpoint
 * @param params Object containing the endpoint path and method
 * @returns TypeScript code for the MCP tool definition
 */
async function generateEndpointToolCode(params: GenerateEndpointToolCodeParams): Promise<string> {
  try {
    const { 
      path: endpointPath, 
      method,
      includeApiInName = false,
      includeVersionInName = false,
      singularizeResourceNames = true
    } = params;
    
    logger.info(`Generating tool code with options: includeApiInName=${includeApiInName}, includeVersionInName=${includeVersionInName}, singularizeResourceNames=${singularizeResourceNames}`);
    
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
    
    // Find the endpoint in the Swagger definition
    let operation: any = null;
    
    // Handle OpenAPI 3.0.x format
    if (swaggerDefinition.openapi && swaggerDefinition.openapi.startsWith('3.')) {
      const paths = swaggerDefinition.paths || {};
      const pathItem = paths[endpointPath];
      
      if (!pathItem) {
        throw new Error(`Path ${endpointPath} not found in Swagger definition`);
      }
      
      operation = pathItem[method.toLowerCase()];
    } 
    // Handle Swagger 2.0 format
    else if (swaggerDefinition.swagger && swaggerDefinition.swagger.startsWith('2.')) {
      const paths = swaggerDefinition.paths || {};
      const pathItem = paths[endpointPath];
      
      if (!pathItem) {
        throw new Error(`Path ${endpointPath} not found in Swagger definition`);
      }
      
      operation = pathItem[method.toLowerCase()];
    } else {
      throw new Error('Unsupported Swagger/OpenAPI version');
    }
    
    if (!operation) {
      throw new Error(`Method ${method} not found for path ${endpointPath}`);
    }
    
    // Get models used by this endpoint
    const models = await listEndpointModels({ path: endpointPath, method });
    
    // Generate TypeScript code for the MCP tool definition
    const toolName = generateToolName(
      operation, 
      endpointPath, 
      method, 
      includeApiInName, 
      includeVersionInName,
      singularizeResourceNames
    );
    
    logger.info(`Generated tool name: ${toolName}`);
    
    const tsCode = generateMCPToolDefinition(toolName, operation, endpointPath, method, models, swaggerDefinition);
    
    return tsCode;
  } catch (error: any) {
    logger.error(`Error generating endpoint tool code: ${error.message}`);
    throw error;
  }
}

/**
 * Generates a tool name from the operation details
 */
function generateToolName(
  operation: any, 
  endpointPath: string, 
  method: string,
  includeApiInName: boolean,
  includeVersionInName: boolean,
  singularizeResourceNames: boolean
): string {
  // Detect response format from the endpoint path
  const formatSuffix = getFormatSuffix(endpointPath, operation);
  
  // Use operationId if available and transform it
  if (operation.operationId) {
    // Remove HTTP method prefix if present (e.g., GET_, POST_)
    let name = operation.operationId.replace(/^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)_/i, '');
    
    // Remove file extensions
    name = name.replace(/\.\w+$/, '');
    
    // Split the name into segments
    const segments = name.split('_');
    
    // Filter out API and version segments if not wanted
    const filteredSegments = segments.filter((segment: string) => {
      if (!includeApiInName && segment.toLowerCase() === 'api') {
        return false;
      }
      
      if (!includeVersionInName && /^v\d+(\.\d+)*$/.test(segment)) {
        return false;
      }
      
      return true;
    });
    
    // Process the remaining segments
    const processedSegments = filteredSegments.map((segment: string, index: number, array: string[]) => {
      // If singularization is enabled and it's a resource name (not the last segment)
      if (singularizeResourceNames && (index === 0 || index < array.length - 1) && segment.endsWith('s')) {
        // Simple singularization - remove trailing 's'
        // This is a simplified approach - a proper singularization would use a library
        return segment.endsWith('ies') 
          ? segment.slice(0, -3) + 'y'  // e.g., "companies" -> "company"
          : segment.endsWith('s') 
            ? segment.slice(0, -1)      // e.g., "projects" -> "project"
            : segment;
      }
      
      return segment;
    });
    
    // Combine the method with the processed segments and format suffix
    return formatMethodName(method) + processedSegments.map(pascalCase).join('') + formatSuffix;
  }
  
  // Otherwise, generate from path and method
  const pathSegments = endpointPath.split('/')
    .filter(part => part && !part.startsWith('{')) // Remove empty parts and path parameters
    .map(part => part.replace(/\.\w+$/, '')); // Remove file extensions
  
  // Filter out API and version segments if not wanted
  const filteredSegments = pathSegments.filter(segment => {
    if (!includeApiInName && segment.toLowerCase() === 'api') {
      return false;
    }
    
    if (!includeVersionInName && /^v\d+(\.\d+)*$/.test(segment)) {
      return false;
    }
    
    return true;
  });
  
  // Process the remaining segments
  const processedSegments = filteredSegments.map((segment, index, array) => {
    // If singularization is enabled and it's a resource name (not the last segment)
    if (singularizeResourceNames && (index === 0 || index < array.length - 1) && segment.endsWith('s')) {
      // Simple singularization - remove trailing 's'
      // This is a simplified approach - a proper singularization would use a library
      return segment.endsWith('ies') 
        ? segment.slice(0, -3) + 'y'  // e.g., "companies" -> "company"
        : segment.endsWith('s') 
          ? segment.slice(0, -1)      // e.g., "projects" -> "project"
          : segment;
    }
    
    return segment;
  });
  
  // Combine the method with the path segments and format suffix
  const nameBase = processedSegments.map(pascalCase).join('');
  return formatMethodName(method) + nameBase + formatSuffix;
}

/**
 * Gets a suffix for the tool name based on the response format
 */
function getFormatSuffix(endpointPath: string, operation: any): string {
  // Check for format in the path extension
  if (endpointPath.endsWith('.pdf')) {
    return 'AsPdf';
  } else if (endpointPath.endsWith('.csv')) {
    return 'AsCsv';
  } else if (endpointPath.endsWith('.xlsx') || endpointPath.endsWith('.xls')) {
    return 'AsExcel';
  } else if (endpointPath.endsWith('.html')) {
    return 'AsHtml';
  } else if (endpointPath.endsWith('.xml')) {
    return 'AsXml';
  } else if (endpointPath.endsWith('.txt')) {
    return 'AsText';
  }
  
  // Check for format in the produces field (Swagger 2.0)
  if (operation.produces && Array.isArray(operation.produces)) {
    const contentType = operation.produces[0];
    if (contentType === 'application/pdf') {
      return 'AsPdf';
    } else if (contentType === 'text/csv') {
      return 'AsCsv';
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
               contentType === 'application/vnd.ms-excel') {
      return 'AsExcel';
    } else if (contentType === 'text/html') {
      return 'AsHtml';
    } else if (contentType === 'application/xml' || contentType === 'text/xml') {
      return 'AsXml';
    } else if (contentType === 'text/plain') {
      return 'AsText';
    }
  }
  
  // Check for format in the responses (OpenAPI 3.0.x)
  if (operation.responses) {
    for (const statusCode in operation.responses) {
      const response = operation.responses[statusCode];
      if (response.content) {
        if (response.content['application/pdf']) {
          return 'AsPdf';
        } else if (response.content['text/csv']) {
          return 'AsCsv';
        } else if (response.content['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] || 
                   response.content['application/vnd.ms-excel']) {
          return 'AsExcel';
        } else if (response.content['text/html']) {
          return 'AsHtml';
        } else if (response.content['application/xml'] || response.content['text/xml']) {
          return 'AsXml';
        } else if (response.content['text/plain']) {
          return 'AsText';
        }
      }
    }
  }
  
  // Default: no suffix for JSON or unspecified formats
  return '';
}

/**
 * Formats the HTTP method for use in a function name
 */
function formatMethodName(method: string): string {
  // Capitalize the first letter, lowercase the rest
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}

/**
 * Generates TypeScript code for an MCP tool definition
 */
function generateMCPToolDefinition(
  toolName: string,
  operation: any,
  endpointPath: string,
  method: string,
  models: Model[],
  swaggerDefinition: any
): string {
  let result = '';
  
  // Add imports for models
  if (models.length > 0) {
    result += '// Import models used by this endpoint\n';
    models.forEach(model => {
      const interfaceName = formatInterfaceName(model.name);
      result += `import { ${interfaceName} } from './models/${interfaceName}.js';\n`;
    });
    result += '\n';
  }
  
  // Add tool definition
  result += `/**\n`;
  if (operation.summary) {
    result += ` * ${operation.summary}\n`;
  }
  if (operation.description) {
    result += ` * ${operation.description}\n`;
  }
  result += ` */\n`;
  
  // Use camelCase for variable name, but keep PascalCase for the handler function
  const toolVariableName = camelCase(toolName);
  result += `export const ${toolVariableName} = {\n`;
  result += `  name: "${toolVariableName}",\n`;
  
  // Add description
  let description = operation.summary || `${method} ${endpointPath}`;
  if (operation.description) {
    description += `. ${operation.description}`;
  }
  result += `  description: "${escapeString(description)}",\n`;
  
  // Add input schema
  result += `  inputSchema: {\n`;
  result += `    type: "object",\n`;
  result += `    properties: {\n`;
  
  // Add parameters to input schema
  const parameters = operation.parameters || [];
  const requiredParams: string[] = [];
  
  parameters.forEach((param: any) => {
    const paramName = param.name;
    const isRequired = param.required === true;
    if (isRequired) {
      requiredParams.push(paramName);
    }
    
    result += `      ${paramName}: {\n`;
    result += `        type: "${param.type || (param.schema ? mapSwaggerTypeToJSONSchema(param.schema.type) : 'string')}",\n`;
    if (param.description) {
      result += `        description: "${escapeString(param.description)}"\n`;
    }
    result += `      },\n`;
  });
  
  // Add request body to input schema for POST, PUT, PATCH methods
  if (['post', 'put', 'patch'].includes(method.toLowerCase()) && operation.requestBody) {
    let requestBodySchema: any = null;
    
    // OpenAPI 3.0.x
    if (operation.requestBody.content) {
      const jsonContent = operation.requestBody.content['application/json'];
      if (jsonContent && jsonContent.schema) {
        requestBodySchema = jsonContent.schema;
      }
    }
    
    if (requestBodySchema) {
      result += `      body: {\n`;
      if (requestBodySchema.$ref) {
        const refModelName = getRefModelName(requestBodySchema.$ref);
        result += `        type: "object",\n`;
        result += `        description: "Request body"\n`;
      } else {
        result += `        type: "${mapSwaggerTypeToJSONSchema(requestBodySchema.type || 'object')}",\n`;
        result += `        description: "Request body"\n`;
      }
      result += `      },\n`;
      
      if (operation.requestBody.required) {
        requiredParams.push('body');
      }
    }
  }
  
  result += `    },\n`;
  
  // Add required parameters
  if (requiredParams.length > 0) {
    result += `    required: [${requiredParams.map(p => `"${p}"`).join(', ')}]\n`;
  } else {
    result += `    required: []\n`;
  }
  
  result += `  }\n`;
  result += `};\n\n`;
  
  // Add tool handler - use the original toolName (PascalCase) for the handler function
  result += `// Tool handler\n`;
  result += `export async function handle${toolName}(input: any) {\n`;
  result += `  try {\n`;
  result += `    // TODO: Implement API call to ${method.toUpperCase()} ${endpointPath}\n`;
  result += `    // const response = await apiClient.${method.toLowerCase()}('${endpointPath}', input);\n`;
  result += `    \n`;
  result += `    return {\n`;
  result += `      content: [{\n`;
  result += `        type: "text",\n`;
  result += `        text: JSON.stringify({ success: true, message: "Not implemented yet" }, null, 2)\n`;
  result += `      }]\n`;
  result += `    };\n`;
  result += `  } catch (error: any) {\n`;
  result += `    return {\n`;
  result += `      content: [{\n`;
  result += `        type: "text",\n`;
  result += `        text: \`Error: \${error.message}\`\n`;
  result += `      }]\n`;
  result += `    };\n`;
  result += `  }\n`;
  result += `}\n`;
  
  return result;
}

/**
 * Maps Swagger/OpenAPI types to JSON Schema types
 */
function mapSwaggerTypeToJSONSchema(swaggerType: string): string {
  switch (swaggerType) {
    case 'integer':
      return 'number';
    case 'array':
      return 'array';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    case 'number':
      return 'number';
    default:
      return 'string';
  }
}

/**
 * Extracts the model name from a JSON reference
 */
function getRefModelName(ref: string): string {
  const refParts = ref.split('/');
  return refParts[refParts.length - 1];
}

/**
 * Formats a model name as a valid TypeScript interface name
 */
function formatInterfaceName(name: string): string {
  // Remove special characters and ensure it starts with a letter
  let formattedName = name.replace(/[^\w]/g, '');
  
  // Ensure the name starts with a capital letter
  formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
  
  return formattedName;
}

/**
 * Converts a string to camelCase
 */
function camelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]+/g, '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

/**
 * Converts a string to PascalCase
 */
function pascalCase(str: string): string {
  const camelCased = camelCase(str);
  return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Escapes special characters in a string for use in a JavaScript string literal
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

export default generateEndpointToolCode; 