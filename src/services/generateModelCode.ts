/**
 * Generate Model Code Service
 * Generates TypeScript code for a model from the Swagger definition
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

// Interface for the function parameters
export interface GenerateModelCodeParams {
  modelName: string;
  swaggerFilePath: string; // Required path to the Swagger file
}

/**
 * Generates TypeScript code for a model from the Swagger definition
 * @param params Object containing the model name and swagger file path
 * @returns TypeScript code for the model
 */
async function generateModelCode(params: GenerateModelCodeParams): Promise<string> {
  try {
    const { modelName, swaggerFilePath } = params;
    
    if (!swaggerFilePath) {
      throw new Error('Swagger file path is required');
    }
    
    if (!fs.existsSync(swaggerFilePath)) {
      throw new Error(`Swagger file not found at ${swaggerFilePath}`);
    }
    
    // Read the Swagger definition file
    logger.info(`Reading Swagger definition from ${swaggerFilePath}`);
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
    const swaggerDefinition = JSON.parse(swaggerContent);
    
    // Find the model schema
    let modelSchema = null;
    
    // Check if it's OpenAPI 3.0.x
    if (swaggerDefinition.openapi && swaggerDefinition.openapi.startsWith('3.')) {
      const schemas = swaggerDefinition.components?.schemas || {};
      modelSchema = schemas[modelName];
    } 
    // Check if it's Swagger 2.0
    else if (swaggerDefinition.swagger && swaggerDefinition.swagger.startsWith('2.')) {
      const definitions = swaggerDefinition.definitions || {};
      modelSchema = definitions[modelName];
    }
    
    if (!modelSchema) {
      throw new Error(`Model '${modelName}' not found in Swagger definition`);
    }
    
    // Generate TypeScript code
    const typeScriptCode = generateTypeScriptInterface(modelName, modelSchema, swaggerDefinition);
    
    return typeScriptCode;
  } catch (error: any) {
    logger.error(`Error generating model code: ${error.message}`);
    throw error;
  }
}

/**
 * Generates a TypeScript interface from a Swagger schema
 */
function generateTypeScriptInterface(
  modelName: string, 
  schema: any, 
  swaggerDefinition: any, 
  indentLevel: number = 0
): string {
  const indent = '  '.repeat(indentLevel);
  let result = '';
  
  // Add description as JSDoc comment if available
  if (schema.description) {
    result += `${indent}/**\n`;
    result += `${indent} * ${schema.description}\n`;
    result += `${indent} */\n`;
  }
  
  // Start interface definition
  result += `${indent}export interface ${formatInterfaceName(modelName)} {\n`;
  
  // Process properties
  if (schema.properties) {
    for (const propName in schema.properties) {
      const property = schema.properties[propName];
      
      // Add property description as JSDoc comment if available
      if (property.description) {
        result += `${indent}  /**\n`;
        result += `${indent}  * ${property.description}\n`;
        result += `${indent}  */\n`;
      }
      
      // Determine if property is required
      const isRequired = schema.required && schema.required.includes(propName);
      const optionalMarker = isRequired ? '' : '?';
      
      // Add property with type
      result += `${indent}  ${propName}${optionalMarker}: ${getTypeScriptType(property, swaggerDefinition)};\n`;
    }
  }
  
  // Handle allOf, anyOf, oneOf
  ['allOf', 'anyOf', 'oneOf'].forEach(key => {
    if (Array.isArray(schema[key])) {
      // For allOf, we extend interfaces
      if (key === 'allOf') {
        schema[key].forEach((subSchema: any) => {
          if (subSchema.$ref) {
            const refModelName = getRefModelName(subSchema.$ref);
            result = result.replace(
              `export interface ${formatInterfaceName(modelName)} {`,
              `export interface ${formatInterfaceName(modelName)} extends ${formatInterfaceName(refModelName)} {`
            );
          } else if (subSchema.properties) {
            // Inline properties from allOf
            for (const propName in subSchema.properties) {
              const property = subSchema.properties[propName];
              
              // Add property description as JSDoc comment if available
              if (property.description) {
                result += `${indent}  /**\n`;
                result += `${indent}  * ${property.description}\n`;
                result += `${indent}  */\n`;
              }
              
              // Determine if property is required
              const isRequired = subSchema.required && subSchema.required.includes(propName);
              const optionalMarker = isRequired ? '' : '?';
              
              // Add property with type
              result += `${indent}  ${propName}${optionalMarker}: ${getTypeScriptType(property, swaggerDefinition)};\n`;
            }
          }
        });
      }
      // For anyOf and oneOf, we use union types
      else {
        // This is a simplified approach - for complex schemas, a more sophisticated solution would be needed
        const unionTypes = schema[key].map((subSchema: any) => {
          if (subSchema.$ref) {
            const refModelName = getRefModelName(subSchema.$ref);
            return formatInterfaceName(refModelName);
          } else {
            return 'any'; // Simplified for complex inline schemas
          }
        }).join(' | ');
        
        result += `${indent}  // ${key} union type\n`;
        result += `${indent}  value: ${unionTypes};\n`;
      }
    }
  });
  
  // Close interface definition
  result += `${indent}}\n`;
  
  // Process nested types
  const nestedTypes: string[] = [];
  if (schema.properties) {
    for (const propName in schema.properties) {
      const property = schema.properties[propName];
      const nestedType = generateNestedTypes(property, swaggerDefinition, indentLevel);
      if (nestedType) {
        nestedTypes.push(nestedType);
      }
    }
  }
  
  // Add nested types after the main interface
  if (nestedTypes.length > 0) {
    result += '\n' + nestedTypes.join('\n');
  }
  
  return result;
}

/**
 * Generates nested types for complex properties
 */
function generateNestedTypes(
  schema: any, 
  swaggerDefinition: any, 
  indentLevel: number = 0
): string | null {
  // Handle inline object definitions
  if (schema.type === 'object' && schema.properties && !schema.$ref) {
    const typeName = 'InlineType'; // This would need a more sophisticated naming strategy in a real implementation
    return generateTypeScriptInterface(typeName, schema, swaggerDefinition, indentLevel);
  }
  
  // Handle inline array item definitions
  if (schema.type === 'array' && schema.items && schema.items.type === 'object' && schema.items.properties && !schema.items.$ref) {
    const typeName = 'InlineArrayItem'; // This would need a more sophisticated naming strategy in a real implementation
    return generateTypeScriptInterface(typeName, schema.items, swaggerDefinition, indentLevel);
  }
  
  return null;
}

/**
 * Converts a Swagger type to a TypeScript type
 */
function getTypeScriptType(schema: any, swaggerDefinition: any): string {
  if (schema.$ref) {
    const refModelName = getRefModelName(schema.$ref);
    return formatInterfaceName(refModelName);
  }
  
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        // For enums, create a union of string literals
        return schema.enum.map((value: string) => `'${value}'`).join(' | ');
      }
      return 'string';
    
    case 'integer':
    case 'number':
      return 'number';
    
    case 'boolean':
      return 'boolean';
    
    case 'array':
      if (schema.items) {
        return `${getTypeScriptType(schema.items, swaggerDefinition)}[]`;
      }
      return 'any[]';
    
    case 'object':
      if (schema.additionalProperties) {
        // For dictionaries/maps
        return `Record<string, ${getTypeScriptType(schema.additionalProperties, swaggerDefinition)}>`;
      }
      return 'Record<string, any>';
    
    default:
      return 'any';
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

export default generateModelCode; 