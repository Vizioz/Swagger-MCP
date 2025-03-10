// Test Schema Validation
// This script tests the schema validation capabilities of the generator

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generator
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

// Define a simple MCP schema validation function
function validateAgainstMCPSchema(tsCode: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for required tool properties
  if (!tsCode.includes('name:')) {
    errors.push('Missing required property: name');
  }
  
  if (!tsCode.includes('description:')) {
    errors.push('Missing required property: description');
  }
  
  if (!tsCode.includes('inputSchema:')) {
    errors.push('Missing required property: inputSchema');
  }
  
  // Check for inputSchema structure
  if (!tsCode.includes('properties:')) {
    errors.push('Missing required property in parameters: properties');
  }
  
  if (!tsCode.includes('type:')) {
    errors.push('Missing required property in parameters: type');
  }
  
  // Check for JSON Schema compliance
  const hasRequiredField = tsCode.includes('required:');
  const hasPropertiesField = tsCode.includes('properties:');
  
  if (hasRequiredField && !hasPropertiesField) {
    errors.push('Schema has required field but no properties field');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

async function testSchemaValidation(): Promise<void> {
  console.log('Testing schema validation in generated tool code...');
  
  // Use a Swagger file with complex schemas
  const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
  
  if (!fs.existsSync(swaggerFilePath)) {
    console.error(`Swagger file not found at ${swaggerFilePath}`);
    return;
  }
  
  console.log(`Using Swagger file: ${swaggerFilePath}`);
  
  // Test endpoints with different schema complexities
  const testEndpoints = [
    // Endpoint with arrays
    { 
      path: '/projects/api/v3/projects.json', 
      method: 'GET',
      name: 'array-response'
    },
    // Endpoint with complex request body
    { 
      path: '/projects/api/v3/tasklists/{tasklistId}/tasks.json', 
      method: 'POST',
      name: 'complex-request'
    },
    // Endpoint with a PUT request
    {
      path: '/projects/api/v3/projects/budgets/:id/tasklists/budgets.json',
      method: 'PUT',
      name: 'put-request'
    },
    {
      path: '/projects/api/v3/projects/starred.json',
      method: 'GET',
      name: 'starred-projects'
    }    
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\nTesting schema validation for ${endpoint.method} ${endpoint.path}`);
      
      // Generate tool code
      const tsCode = await generateEndpointToolCode({
        path: endpoint.path,
        method: endpoint.method,
        swaggerFilePath,
        includeApiInName: false,
        includeVersionInName: false,
        singularizeResourceNames: true
      });
      
      // Save the generated code for inspection
      const filename = `schema-validation-${endpoint.name}.ts`;
      saveGeneratedCode(tsCode, filename);
      
      // Validate the generated code against MCP schema
      const validationResult = validateAgainstMCPSchema(tsCode);
      
      if (validationResult.valid) {
        console.log(`✅ Schema validation passed for ${endpoint.method} ${endpoint.path}`);
      } else {
        console.log(`❌ Schema validation failed for ${endpoint.method} ${endpoint.path}`);
        console.log(`   Errors: ${validationResult.errors.join(', ')}`);
      }
      
      // Additional schema checks
      const schemaChecks = {
        hasProperties: tsCode.includes('properties:'),
        hasRequired: tsCode.includes('required:'),
        hasType: tsCode.includes('type:'),
        hasDescription: tsCode.includes('description:')
      };
      
      console.log('Schema component checks:');
      Object.entries(schemaChecks).forEach(([check, result]) => {
        console.log(`   ${result ? '✅' : '❌'} ${check}`);
      });
      
      // Check for advanced schema features
      const advancedFeatures = {
        hasEnums: tsCode.includes('enum:'),
        hasPatterns: tsCode.includes('pattern:'),
        hasMinMax: tsCode.includes('minimum:') || tsCode.includes('maximum:'),
        hasFormat: tsCode.includes('format:')
      };
      
      console.log('Advanced schema feature checks:');
      Object.entries(advancedFeatures).forEach(([feature, result]) => {
        if (result) {
          console.log(`   ✅ ${feature}`);
        }
      });
      
    } catch (error: any) {
      console.error(`❌ Error testing schema validation for ${endpoint.method} ${endpoint.path}:`, error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }
}

function saveGeneratedCode(code: string, filename: string): void {
  try {
    // Save the generated code to a file for easier viewing
    const outputDir = path.join(__dirname, 'generated');
    
    // Ensure the directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, code);
    console.log(`Generated code saved to: ${outputPath}`);
  } catch (error: any) {
    console.error(`Error saving generated code: ${error.message}`);
  }
}

// Run the test
testSchemaValidation(); 