// Test script for the format suffix functionality with real endpoints
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateEndpointToolCode function
import generateEndpointToolCode from '../build/services/generateEndpointToolCode.js';

async function testFormatSuffix() {
  try {
    console.log('Testing format suffix functionality with real endpoints...');
    
    // Test with PDF format
    const pdfEndpoint = {
      path: '/projects/api/v3/tasklists.pdf',
      method: 'GET',
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log('\n1. PDF format:');
    console.log(`Testing with parameters:`, pdfEndpoint);
    const pdfCode = await generateEndpointToolCode(pdfEndpoint);
    saveGeneratedCode(pdfCode, 'generated-pdf-format.ts');
    
    // Test with CSV format
    const csvEndpoint = {
      path: '/projects/api/v3/tasklists.csv',
      method: 'GET',
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log('\n2. CSV format:');
    console.log(`Testing with parameters:`, csvEndpoint);
    const csvCode = await generateEndpointToolCode(csvEndpoint);
    saveGeneratedCode(csvCode, 'generated-csv-format.ts');
    
    // Test with Excel format
    const excelEndpoint = {
      path: '/projects/api/v3/tasklists.xlsx',
      method: 'GET',
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log('\n3. Excel format:');
    console.log(`Testing with parameters:`, excelEndpoint);
    const excelCode = await generateEndpointToolCode(excelEndpoint);
    saveGeneratedCode(excelCode, 'generated-excel-format.ts');
    
    // Test with HTML format
    const htmlEndpoint = {
      path: '/projects/api/v3/tasklists.html',
      method: 'GET',
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log('\n4. HTML format:');
    console.log(`Testing with parameters:`, htmlEndpoint);
    const htmlCode = await generateEndpointToolCode(htmlEndpoint);
    saveGeneratedCode(htmlCode, 'generated-html-format.ts');
    
    console.log('\nAll tests completed. Check the generated files for results.');
  } catch (error) {
    console.error('Error testing format suffix:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

function saveGeneratedCode(code, filename) {
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
testFormatSuffix(); 