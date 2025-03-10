// Test Error Handling
// This script tests the error handling capabilities of the generator

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generator
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

async function testErrorHandling(): Promise<void> {
  console.log('Testing error handling in the generator...');
  
  // Use a valid Swagger file for reference
  const validSwaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
  
  if (!fs.existsSync(validSwaggerFilePath)) {
    console.error(`Valid Swagger file not found at ${validSwaggerFilePath}`);
    return;
  }
  
  // Test cases for error handling
  const testCases = [
    {
      name: 'Invalid Swagger file path',
      params: {
        path: '/projects/api/v3/me.json',
        method: 'GET',
        swaggerFilePath: 'non-existent-file.json'
      },
      expectedError: true,
      errorPattern: /file|not found|no such file|doesn't exist/i
    },
    {
      name: 'Invalid endpoint path',
      params: {
        path: '/non-existent-endpoint',
        method: 'GET',
        swaggerFilePath: validSwaggerFilePath
      },
      expectedError: true,
      errorPattern: /path|endpoint|not found|doesn't exist|invalid/i
    },
    {
      name: 'Invalid HTTP method',
      params: {
        path: '/projects/api/v3/projects.json',
        method: 'INVALID_METHOD',
        swaggerFilePath: validSwaggerFilePath
      },
      expectedError: true,
      errorPattern: /method|invalid|not supported/i
    },
    {
      name: 'Missing required parameters',
      params: {
        // @ts-ignore - intentionally missing required parameters
        path: undefined,
        method: 'GET',
        swaggerFilePath: validSwaggerFilePath
      },
      expectedError: true,
      errorPattern: /required|missing|parameter|undefined/i
    }
  ];
  
  // Run each test case
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    
    try {
      // Attempt to generate tool code with the test case parameters
      const tsCode = await generateEndpointToolCode(testCase.params as any);
      
      // If we expected an error but didn't get one
      if (testCase.expectedError) {
        console.log(`❌ Test failed: Expected an error for "${testCase.name}" but no error was thrown`);
      } else {
        console.log(`✅ Test passed: Successfully generated code as expected`);
        
        // Save the generated code for inspection
        const filename = `error-handling-${testCase.name.replace(/\s+/g, '-').toLowerCase()}.ts`;
        saveGeneratedCode(tsCode, filename);
      }
    } catch (error: any) {
      // If we caught an error
      if (testCase.expectedError) {
        // Check if the error message matches the expected pattern
        if (testCase.errorPattern.test(error.message)) {
          console.log(`✅ Test passed: Got expected error for "${testCase.name}"`);
          console.log(`   Error message: ${error.message}`);
        } else {
          console.log(`⚠️ Test partially passed: Got an error for "${testCase.name}" but message doesn't match expected pattern`);
          console.log(`   Error message: ${error.message}`);
          console.log(`   Expected pattern: ${testCase.errorPattern}`);
        }
      } else {
        console.log(`❌ Test failed: Unexpected error for "${testCase.name}"`);
        console.log(`   Error message: ${error.message}`);
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
testErrorHandling(); 