/**
 * Test MCP Schema Validation
 * This test verifies that our MCP schema validation works correctly
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the validation functions
import { validateMCPSchema, formatValidationErrors } from '../src/utils/validateMCPSchema.js';

// Import the generateEndpointToolCode function
import generateEndpointToolCode from '../build/services/generateEndpointToolCode.js';

// Define the interface here to avoid import issues
interface GenerateEndpointToolCodeParams {
  path: string;
  method: string;
  swaggerFilePath: string;
  includeApiInName?: boolean;
  includeVersionInName?: boolean;
  singularizeResourceNames?: boolean;
}

async function testMCPValidation() {
  console.log('Testing MCP Schema Validation...');
  
  // Test with a valid tool definition
  const validToolCode = `
export const getPet = {
  name: "getPet",
  description: "Get a pet by ID",
  inputSchema: {
    type: "object",
    properties: {
      petId: {
        type: "string",
        description: "The ID of the pet to retrieve"
      }
    },
    required: ["petId"]
  }
};

export async function handleGetPet(input: any) {
  // Implementation
}`;

  const validResult = validateMCPSchema(validToolCode);
  console.log('\nValidating valid tool definition:');
  console.log(`Is valid: ${validResult.isValid}`);
  if (!validResult.isValid) {
    console.log('Errors:', validResult.errors);
  }
  
  // Test with an invalid tool definition (missing name)
  const invalidToolCode = `
export const getPet = {
  description: "Get a pet by ID",
  inputSchema: {
    type: "object",
    properties: {
      petId: {
        type: "string",
        description: "The ID of the pet to retrieve"
      }
    },
    required: ["petId"]
  }
};

export async function handleGetPet(input: any) {
  // Implementation
}`;

  const invalidResult = validateMCPSchema(invalidToolCode);
  console.log('\nValidating invalid tool definition (missing name):');
  console.log(`Is valid: ${invalidResult.isValid}`);
  if (!invalidResult.isValid) {
    console.log('Errors:', invalidResult.errors);
    console.log('\nFormatted error message:');
    console.log(formatValidationErrors(invalidResult.errors));
  }
  
  // Test with the Swagger file
  try {
    console.log('\nTesting with actual Swagger file...');
    
    // Use the petstore.json file in the root directory
    const swaggerFilePath = path.join(__dirname, '..', 'petstore.json');
    
    if (!fs.existsSync(swaggerFilePath)) {
      console.error(`Swagger file not found at ${swaggerFilePath}`);
      return;
    }
    
    console.log(`Using Swagger file: ${swaggerFilePath}`);
    
    // Test GET endpoint
    const getEndpoint = {
      path: '/pets/{id}',
      method: 'get',
      swaggerFilePath
    };
    
    console.log(`Generating tool code for ${getEndpoint.method} ${getEndpoint.path}...`);
    const tsCode = await generateEndpointToolCode(getEndpoint);
    
    // Check if the response is a validation error message
    if (tsCode.includes('MCP Schema Validation Failed')) {
      console.error('MCP schema validation failed:');
      console.error(tsCode);
    } else {
      console.log('Generated tool code passed MCP schema validation!');
      
      // Save the generated code for inspection
      const outputDir = path.join(__dirname, 'generated');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, 'validated-get-pet.ts');
      fs.writeFileSync(outputPath, tsCode);
      console.log(`Generated code saved to: ${outputPath}`);
    }
  } catch (error: any) {
    console.error('Error testing with Swagger file:', error.message);
  }
}

// Run the test
testMCPValidation()
  .then(() => console.log('\nTest completed'))
  .catch(error => console.error('Test failed:', error)); 