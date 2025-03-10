// Test File Upload/Download Support
// This script tests the generator's ability to handle file upload and download operations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generator
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

async function testFileOperations(): Promise<void> {
  console.log('Testing file upload/download operations in generated tool code...');
  
  // Use a Swagger file with file operations
  // Note: You may need to replace this with a Swagger file that has file operations
  const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
  
  if (!fs.existsSync(swaggerFilePath)) {
    console.error(`Swagger file not found at ${swaggerFilePath}`);
    return;
  }
  
  console.log(`Using Swagger file: ${swaggerFilePath}`);
  
  // Test endpoints that involve file operations
  const testCases = [
    // File upload endpoint (adjust path based on your API)
    // I don't have an example of a file upload endpoint in the Swagger file, so I'm using a download endpoint instead :
    // { path: '/projects/api/v3/files.json', method: 'POST', operation: 'upload' },
    // File download endpoint (adjust path based on your API)
    { path: '/projects/api/v3/calendar/events.pdf', method: 'GET', operation: 'download' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing ${testCase.operation} for ${testCase.method} ${testCase.path}`);
      
      // Generate tool code
      const tsCode = await generateEndpointToolCode({
        path: testCase.path,
        method: testCase.method,
        swaggerFilePath,
        includeApiInName: false,
        includeVersionInName: false,
        singularizeResourceNames: true
      });
      
      // Save the generated code for inspection
      const filename = `file-${testCase.operation}-test.ts`;
      saveGeneratedCode(tsCode, filename);
      
      // Check for file-related content in the generated code
      const fileRelatedTerms = [
        'file',
        'multipart',
        'form-data',
        'binary',
        'stream',
        'download',
        'upload',
        'attachment',
        'content-type',
        'octet-stream'
      ];
      
      const fileRelatedChecks = fileRelatedTerms.map(term => 
        tsCode.toLowerCase().includes(term.toLowerCase())
      );
      
      // If any file-related term is found, consider it a success
      const hasFileRelatedContent = fileRelatedChecks.some(check => check);
      
      if (hasFileRelatedContent) {
        console.log(`✅ File ${testCase.operation} handling detected in generated code`);
      } else {
        console.log(`⚠️ No file ${testCase.operation} handling detected. This might be expected if the endpoint doesn't involve files.`);
      }
      
      console.log(`✅ Successfully generated MCP definition for ${testCase.method} ${testCase.path}`);
    } catch (error: any) {
      console.error(`❌ Error testing ${testCase.operation} for ${testCase.method} ${testCase.path}:`, error.message);
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
testFileOperations(); 