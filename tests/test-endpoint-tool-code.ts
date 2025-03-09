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
  includeApiInName?: boolean;
  includeVersionInName?: boolean;
  singularizeResourceNames?: boolean;
}

async function testGenerateEndpointToolCode(): Promise<void> {
  try {
    console.log('Testing generateEndpointToolCode with different naming options...');
    
    // Example endpoint from the Swagger definition
    const endpoint: Pick<GenerateEndpointToolCodeParams, 'path' | 'method'> = {
      path: '/projects/api/v3/tasks.json',
      method: 'GET'
    };
    
    // Test with default options (no API, no version, singularize)
    console.log('\n1. Default options (no API, no version, singularize):');
    const defaultParams: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log(`Testing with parameters:`, defaultParams);
    const defaultCode = await generateEndpointToolCode(defaultParams);
    saveGeneratedCode(defaultCode, 'generated-endpoint-tool-default.ts');
    
    // Test with API included
    console.log('\n2. Include API in name:');
    const includeApiParams: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: true,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log(`Testing with parameters:`, includeApiParams);
    const includeApiCode = await generateEndpointToolCode(includeApiParams);
    saveGeneratedCode(includeApiCode, 'generated-endpoint-tool-with-api.ts');
    
    // Test with version included
    console.log('\n3. Include version in name:');
    const includeVersionParams: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: true,
      singularizeResourceNames: true
    };
    
    console.log(`Testing with parameters:`, includeVersionParams);
    const includeVersionCode = await generateEndpointToolCode(includeVersionParams);
    saveGeneratedCode(includeVersionCode, 'generated-endpoint-tool-with-version.ts');
    
    // Test with both API and version included
    console.log('\n4. Include both API and version in name:');
    const includeApiAndVersionParams: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: true,
      includeVersionInName: true,
      singularizeResourceNames: true
    };
    
    console.log(`Testing with parameters:`, includeApiAndVersionParams);
    const includeApiAndVersionCode = await generateEndpointToolCode(includeApiAndVersionParams);
    saveGeneratedCode(includeApiAndVersionCode, 'generated-endpoint-tool-with-api-and-version.ts');
    
    // Test without singularization
    console.log('\n5. Without singularization:');
    const noSingularizeParams: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: false
    };
    
    console.log(`Testing with parameters:`, noSingularizeParams);
    const noSingularizeCode = await generateEndpointToolCode(noSingularizeParams);
    saveGeneratedCode(noSingularizeCode, 'generated-endpoint-tool-no-singularize.ts');
    
    console.log('\nAll tests completed. Check the generated files for results.');
  } catch (error: any) {
    console.error('Error testing generateEndpointToolCode:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

function saveGeneratedCode(code: string, filename: string): void {
  // Ensure the generated directory exists
  const generatedDir = path.join(__dirname, 'generated');
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }
  
  const outputPath = path.join(generatedDir, filename);
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
testGenerateEndpointToolCode(); 