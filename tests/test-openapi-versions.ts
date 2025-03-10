// Test OpenAPI Version Compatibility
// This script tests the generator with different OpenAPI versions (2.0, 3.0, 3.1)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generator
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

// Define test swagger files for different OpenAPI versions
const swaggerFiles = {
  openapi2: path.join(__dirname, '..', 'ReferenceFiles', 'petstore-openapi2.json'),
  openapi3: path.join(__dirname, '..', 'ReferenceFiles', 'petstore-openapi3.json'),
  openapi31: path.join(__dirname, '..', 'ReferenceFiles', 'petstore-openapi31.json')
};

// Define test endpoints for each version
const testEndpoints = {
  openapi2: { path: '/pets', method: 'POST' },
  openapi3: { path: '/pets', method: 'POST' },
  openapi31: { path: '/pets', method: 'POST' }
};

async function testOpenAPIVersions(): Promise<void> {
  console.log('Testing OpenAPI version compatibility...');
  
  // Test each OpenAPI version
  for (const [version, swaggerFilePath] of Object.entries(swaggerFiles)) {
    try {
      // Skip if file doesn't exist (for testing purposes)
      if (!fs.existsSync(swaggerFilePath)) {
        console.log(`Skipping ${version} test - file not found: ${swaggerFilePath}`);
        continue;
      }
      
      console.log(`Testing ${version} compatibility with file: ${swaggerFilePath}`);
      
      const endpoint = testEndpoints[version as keyof typeof testEndpoints];
      
      // Generate tool code
      const tsCode = await generateEndpointToolCode({
        path: endpoint.path,
        method: endpoint.method,
        swaggerFilePath,
        includeApiInName: false,
        includeVersionInName: false,
        singularizeResourceNames: true
      });
      
      // Basic validation that the generated code is a valid Model Context Protocol definition
      assert(tsCode.includes('name:'), 'Generated code should include a tool name');
      assert(tsCode.includes('description:'), 'Generated code should include a description');
      assert(tsCode.includes('inputSchema:'), 'Generated code should include inputSchema');
      
      // Save the generated code for inspection
      const filename = `${version}-compatibility-test.ts`;
      saveGeneratedCode(tsCode, filename);
      
      console.log(`✅ Successfully generated MCP definition for ${version}`);
    } catch (error: any) {
      console.error(`❌ Error testing ${version}:`, error.message);
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
testOpenAPIVersions(); 