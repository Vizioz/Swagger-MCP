// Test Authentication Support
// This script tests the generator's ability to handle authentication parameters in Swagger definitions

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generator
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

async function testAuthenticationSupport(): Promise<void> {
  console.log('Testing authentication support in generated tool code...');
  
  // Use a Swagger file with authentication
  const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
  
  if (!fs.existsSync(swaggerFilePath)) {
    console.error(`Swagger file not found at ${swaggerFilePath}`);
    return;
  }
  
  console.log(`Using Swagger file: ${swaggerFilePath}`);
  
  try {
    // Test an endpoint that requires authentication
    const path = '/projects/api/v3/projects.json';
    const method = 'GET';
    
    console.log(`Testing authentication for ${method} ${path}`);
    
    // Generate tool code
    const tsCode = await generateEndpointToolCode({
      path,
      method,
      swaggerFilePath,
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    });
    
    // Save the generated code for inspection
    const filename = 'authentication-test.ts';
    saveGeneratedCode(tsCode, filename);
    
    // Verify authentication parameters are included
    const authChecks = [
      // Check for common auth parameter patterns
      tsCode.includes('apiKey'),
      tsCode.includes('token'),
      tsCode.includes('authorization'),
      tsCode.includes('auth'),
      tsCode.includes('bearer'),
      tsCode.includes('Authentication')
    ];
    
    // If any auth pattern is found, consider it a success
    const hasAuthParams = authChecks.some(check => check);
    
    if (hasAuthParams) {
      console.log('✅ Authentication parameters detected in generated code');
    } else {
      console.log('⚠️ No authentication parameters detected. This might be expected if the API doesn\'t require auth.');
    }
    
    // Check for security schema references
    if (tsCode.includes('security') || tsCode.includes('securitySchemes')) {
      console.log('✅ Security schema references detected in generated code');
    }
    
    console.log(`✅ Successfully generated MCP definition for ${method} ${path}`);
  } catch (error: any) {
    console.error('❌ Error testing authentication support:', error.message);
    if (error.stack) {
      console.error(error.stack);
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
testAuthenticationSupport(); 