// Simple test script for the generateEndpointToolCode functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function testGenerateEndpointToolCode(): Promise<void> {
  try {
    console.log('Testing generateEndpointToolCode with different naming options...');
    
    // Use the mock Swagger file for testing
    const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
    
    // Example endpoint from the Swagger definition
    const endpoint = {
      path: '/projects/api/v3/tasks.json',
      method: 'GET',
      swaggerFilePath
    };
    
    // Test with default options
    console.log('\nTest 1: Default options');
    console.log(`Testing with endpoint: ${endpoint.method} ${endpoint.path}`);
    
    const params1: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    const tsCode1 = await generateEndpointToolCode(params1);
    console.log('Generated TypeScript code (default options):');
    console.log('--------------------------------------------------');
    console.log(tsCode1);
    console.log('--------------------------------------------------');
    
    saveGeneratedCode(tsCode1, 'default-options.ts');
    
    // Test with includeApiInName = true
    console.log('\nTest 2: Include API in name');
    
    const params2: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: true,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    const tsCode2 = await generateEndpointToolCode(params2);
    console.log('Generated TypeScript code (includeApiInName = true):');
    console.log('--------------------------------------------------');
    console.log(tsCode2);
    console.log('--------------------------------------------------');
    
    saveGeneratedCode(tsCode2, 'include-api.ts');
    
    // Test with includeVersionInName = true
    console.log('\nTest 3: Include version in name');
    
    const params3: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: true,
      singularizeResourceNames: true
    };
    
    const tsCode3 = await generateEndpointToolCode(params3);
    console.log('Generated TypeScript code (includeVersionInName = true):');
    console.log('--------------------------------------------------');
    console.log(tsCode3);
    console.log('--------------------------------------------------');
    
    saveGeneratedCode(tsCode3, 'include-version.ts');
    
    // Test with singularizeResourceNames = false
    console.log('\nTest 4: Don\'t singularize resource names');
    
    const params4: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: false
    };
    
    const tsCode4 = await generateEndpointToolCode(params4);
    console.log('Generated TypeScript code (singularizeResourceNames = false):');
    console.log('--------------------------------------------------');
    console.log(tsCode4);
    console.log('--------------------------------------------------');
    
    saveGeneratedCode(tsCode4, 'no-singularize.ts');
    
  } catch (error: any) {
    console.error('Error testing generateEndpointToolCode:', error);
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
testGenerateEndpointToolCode(); 