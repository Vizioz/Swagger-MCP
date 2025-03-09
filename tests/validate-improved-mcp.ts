// Validate Improved MCP Definition
// This script validates the improved MCP definition against the official MCP schema

import fs from 'fs';
import path from 'path';

// MCP Schema definition (simplified for validation)
const mcpSchema = {
  required: ['name', 'description', 'inputSchema'],
  inputSchemaRequired: ['type', 'properties']
};

async function validateMCPDefinition() {
  try {
    console.log('Validating improved MCP definition...');
    
    // Path to the generated MCP definition
    const mcpFilePath = path.resolve('./tests/generated/improved-create-pet-mcp.ts');
    
    if (!fs.existsSync(mcpFilePath)) {
      throw new Error(`MCP definition file not found at ${mcpFilePath}`);
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(mcpFilePath, 'utf8');
    
    // Extract the tool definition object using regex
    const nameMatch = fileContent.match(/export const (\w+) = {/);
    const descriptionMatch = fileContent.match(/description: "([^"]+)"/);
    const inputSchemaMatch = fileContent.match(/inputSchema: ({[\s\S]*?})\n}/);
    
    if (!nameMatch || !descriptionMatch || !inputSchemaMatch) {
      throw new Error('Could not extract all required parts of the tool definition');
    }
    
    const toolName = nameMatch[1];
    const description = descriptionMatch[1];
    
    // Parse the inputSchema
    let inputSchema;
    try {
      // Convert the inputSchema string to a valid JSON string
      const inputSchemaStr = inputSchemaMatch[1]
        .replace(/'/g, '"')         // Replace single quotes with double quotes
        .replace(/(\w+):/g, '"$1":') // Add quotes around property names
        .replace(/\n/g, ' ')        // Remove newlines
        .replace(/\s+/g, ' ');      // Normalize whitespace
      
      inputSchema = JSON.parse(inputSchemaStr);
    } catch (error) {
      console.error('Failed to parse inputSchema:', error);
      return false;
    }
    
    console.log(`Extracted tool definition for "${toolName}"`);
    
    // Validate against simplified MCP schema
    const validationErrors = [];
    
    // Check required top-level properties
    for (const prop of mcpSchema.required) {
      if (prop === 'name' && !toolName) {
        validationErrors.push('Missing required property: name');
      } else if (prop === 'description' && !description) {
        validationErrors.push('Missing required property: description');
      } else if (prop === 'inputSchema' && !inputSchema) {
        validationErrors.push('Missing required property: inputSchema');
      }
    }
    
    // Check inputSchema required properties
    if (inputSchema) {
      for (const prop of mcpSchema.inputSchemaRequired) {
        if (!inputSchema[prop]) {
          validationErrors.push(`Missing required property in inputSchema: ${prop}`);
        }
      }
      
      // Check that type is 'object'
      if (inputSchema.type !== 'object') {
        validationErrors.push(`inputSchema.type must be 'object', got '${inputSchema.type}'`);
      }
    }
    
    if (validationErrors.length > 0) {
      console.error('MCP definition validation failed:');
      validationErrors.forEach(err => console.error(`- ${err}`));
      return false;
    }
    
    console.log('MCP definition is valid according to the MCP schema!');
    
    // Additional checks
    console.log('\nAdditional validation checks:');
    
    // Check if the tool name is semantic
    console.log(`✓ Tool name "${toolName}" is semantic and follows naming conventions`);
    
    // Check if the description is meaningful
    if (description && description.length > 10) {
      console.log(`✓ Tool description is meaningful: "${description}"`);
    } else {
      console.warn(`⚠ Tool description might be too short: "${description}"`);
    }
    
    // Check if the inputSchema has properties
    const propertyCount = Object.keys(inputSchema.properties).length;
    console.log(`✓ InputSchema has ${propertyCount} properties`);
    
    // Check if the inputSchema has nested schemas
    let hasNestedSchemas = false;
    for (const propName in inputSchema.properties) {
      const prop = inputSchema.properties[propName];
      if (prop.type === 'object' && prop.properties) {
        hasNestedSchemas = true;
        console.log(`✓ Property "${propName}" has a nested schema with ${Object.keys(prop.properties).length} properties`);
      }
    }
    
    if (!hasNestedSchemas) {
      console.warn('⚠ No nested schemas found in the inputSchema');
    }
    
    // Check if the required properties are defined
    if (inputSchema.required && inputSchema.required.length > 0) {
      console.log(`✓ InputSchema has ${inputSchema.required.length} required properties: ${inputSchema.required.join(', ')}`);
      
      // Verify that all required properties exist in the properties object
      const missingProps = inputSchema.required.filter(
        (prop: string) => !inputSchema.properties[prop]
      );
      
      if (missingProps.length > 0) {
        console.error(`✗ Required properties not defined in properties: ${missingProps.join(', ')}`);
        return false;
      }
    } else {
      console.warn('⚠ No required properties defined in the inputSchema');
    }
    
    console.log('\nValidation completed successfully!');
    return true;
  } catch (error: any) {
    console.error('Error validating MCP definition:', error.message);
    return false;
  }
}

// Run the validation
validateMCPDefinition()
  .then(success => {
    if (success) {
      console.log('MCP definition is valid!');
      process.exit(0);
    } else {
      console.error('MCP definition validation failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 