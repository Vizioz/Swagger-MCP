// Simple test script for the generateEndpointToolCode functionality with a complex path
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateEndpointToolCode function
import generateEndpointToolCode from '../build/services/generateEndpointToolCode.js';

interface EndpointParams {
  path: string;
  method: string;
  swaggerFilePath: string;
  includeApiInName: boolean;
  includeVersionInName: boolean;
  singularizeResourceNames: boolean;
}

async function testComplexPath(): Promise<void> {
  try {
    console.log('Testing generateEndpointToolCode with a complex path...');
    
    // Example endpoint with a more complex path
    const endpoint = {
      path: '/projects/api/v3/companies/tasks.json',
      method: 'GET'
    };
    
    // Test with default options (no API, no version, singularize)
    console.log('\nComplex path with singularization:');
    const params: EndpointParams = {
      ...endpoint,
      swaggerFilePath: path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml'),
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log(`Testing with parameters:`, params);
    const code = await generateEndpointToolCode(params);
    saveGeneratedCode(code, 'generated/generated-complex-path.ts');
    
    console.log('\nTest completed. Check the generated file for results.');
  } catch (error: any) {
    console.error('Error testing complex path:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

function saveGeneratedCode(code: string, filename: string): void {
  const outputPath = path.join(__dirname, filename);
  fs.writeFileSync(outputPath, code);
  console.log(`Generated code saved to: ${outputPath}`);
  
  // Extract the tool name from the code for display
  const toolNameMatch = code.match(/export const (\w+) = {/);
  if (toolNameMatch && toolNameMatch[1]) {
    console.log(`Generated tool name: ${toolNameMatch[1]}`);
  }
  
  // Extract the handler function name
  const handlerMatch = code.match(/export async function handle(\w+)\(input: any\) {/);
  if (handlerMatch && handlerMatch[1]) {
    console.log(`Generated handler function: handle${handlerMatch[1]}`);
  }
}

// Run the test
testComplexPath(); 