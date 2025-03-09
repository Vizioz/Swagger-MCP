// Test script for the format suffix functionality with mock operations
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateToolName function directly from the source file
import fs_source from 'fs';
const sourceCode = fs_source.readFileSync(path.join(__dirname, '../src/services/generateEndpointToolCode.ts'), 'utf8');

// Remove TypeScript type annotations for JavaScript compatibility
const jsSourceCode = sourceCode
  .replace(/\(([^)]*): string([^)]*)\)/g, '($1$2)')
  .replace(/\(([^)]*): number([^)]*)\)/g, '($1$2)')
  .replace(/\(([^)]*): boolean([^)]*)\)/g, '($1$2)')
  .replace(/\(([^)]*): any([^)]*)\)/g, '($1$2)')
  .replace(/\(([^)]*): void([^)]*)\)/g, '($1$2)')
  .replace(/: string/g, '')
  .replace(/: number/g, '')
  .replace(/: boolean/g, '')
  .replace(/: any/g, '')
  .replace(/: void/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/array\[\]/g, 'array');

// Extract the getFormatSuffix function
const getFormatSuffixFnMatch = jsSourceCode.match(/function getFormatSuffix\([^{]*{([\s\S]*?)^}/m);
if (!getFormatSuffixFnMatch) {
  console.error('Could not extract getFormatSuffix function from source');
  process.exit(1);
}

// Extract the formatMethodName function
const formatMethodNameFnMatch = jsSourceCode.match(/function formatMethodName\([^{]*{([\s\S]*?)^}/m);
if (!formatMethodNameFnMatch) {
  console.error('Could not extract formatMethodName function from source');
  process.exit(1);
}

// Extract the pascalCase function
const pascalCaseFnMatch = jsSourceCode.match(/function pascalCase\([^{]*{([\s\S]*?)^}/m);
if (!pascalCaseFnMatch) {
  console.error('Could not extract pascalCase function from source');
  process.exit(1);
}

// Extract the camelCase function
const camelCaseFnMatch = jsSourceCode.match(/function camelCase\([^{]*{([\s\S]*?)^}/m);
if (!camelCaseFnMatch) {
  console.error('Could not extract camelCase function from source');
  process.exit(1);
}

// Define types for the operations
interface Operation {
  produces?: string[];
  responses?: {
    [key: string]: {
      content?: {
        [key: string]: Record<string, unknown>;
      };
    };
  };
  [key: string]: unknown;
}

// Create the functions
const camelCase = new Function('str', `${camelCaseFnMatch[1]} return camelCase(str);`) as (str: string) => string;
const pascalCase = new Function('str', `
  const camelCase = ${camelCase.toString()};
  ${pascalCaseFnMatch[1]} return pascalCase(str);
`) as (str: string) => string;
const formatMethodName = new Function('method', `${formatMethodNameFnMatch[1]} return formatMethodName(method);`) as (method: string) => string;
const getFormatSuffix = new Function(
  'endpointPath', 
  'operation',
  `${getFormatSuffixFnMatch[1]} return getFormatSuffix(endpointPath, operation);`
) as (endpointPath: string, operation: Operation) => string;

// Test the getFormatSuffix function with different parameters
function testFormatSuffix(): void {
  console.log('Testing format suffix functionality with mock operations:');
  
  // Test with different file extensions
  console.log('\nTesting with different file extensions:');
  
  const mockOperation: Operation = {};
  
  // Test with PDF extension
  const pdfPath = '/projects/api/v3/tasklists.pdf';
  const pdfSuffix = getFormatSuffix(pdfPath, mockOperation);
  console.log(`1. PDF extension: ${pdfSuffix}`);
  
  // Test with CSV extension
  const csvPath = '/projects/api/v3/tasklists.csv';
  const csvSuffix = getFormatSuffix(csvPath, mockOperation);
  console.log(`2. CSV extension: ${csvSuffix}`);
  
  // Test with Excel extension
  const excelPath = '/projects/api/v3/tasklists.xlsx';
  const excelSuffix = getFormatSuffix(excelPath, mockOperation);
  console.log(`3. Excel extension: ${excelSuffix}`);
  
  // Test with HTML extension
  const htmlPath = '/projects/api/v3/tasklists.html';
  const htmlSuffix = getFormatSuffix(htmlPath, mockOperation);
  console.log(`4. HTML extension: ${htmlSuffix}`);
  
  // Test with XML extension
  const xmlPath = '/projects/api/v3/tasklists.xml';
  const xmlSuffix = getFormatSuffix(xmlPath, mockOperation);
  console.log(`5. XML extension: ${xmlSuffix}`);
  
  // Test with TXT extension
  const txtPath = '/projects/api/v3/tasklists.txt';
  const txtSuffix = getFormatSuffix(txtPath, mockOperation);
  console.log(`6. TXT extension: ${txtSuffix}`);
  
  // Test with JSON extension (should not add a suffix)
  const jsonPath = '/projects/api/v3/tasklists.json';
  const jsonSuffix = getFormatSuffix(jsonPath, mockOperation);
  console.log(`7. JSON extension: ${jsonSuffix}`);
  
  // Test with produces field (Swagger 2.0)
  console.log('\nTesting with produces field (Swagger 2.0):');
  
  // Test with PDF content type
  const pdfOperation: Operation = { produces: ['application/pdf'] };
  const pdfProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', pdfOperation);
  console.log(`8. PDF content type: ${pdfProducesSuffix}`);
  
  // Test with CSV content type
  const csvOperation: Operation = { produces: ['text/csv'] };
  const csvProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', csvOperation);
  console.log(`9. CSV content type: ${csvProducesSuffix}`);
  
  // Test with Excel content type
  const excelOperation: Operation = { produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] };
  const excelProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', excelOperation);
  console.log(`10. Excel content type: ${excelProducesSuffix}`);
  
  // Test with HTML content type
  const htmlOperation: Operation = { produces: ['text/html'] };
  const htmlProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', htmlOperation);
  console.log(`11. HTML content type: ${htmlProducesSuffix}`);
  
  // Test with XML content type
  const xmlOperation: Operation = { produces: ['application/xml'] };
  const xmlProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', xmlOperation);
  console.log(`12. XML content type: ${xmlProducesSuffix}`);
  
  // Test with TXT content type
  const txtOperation: Operation = { produces: ['text/plain'] };
  const txtProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', txtOperation);
  console.log(`13. TXT content type: ${txtProducesSuffix}`);
  
  // Test with JSON content type (should not add a suffix)
  const jsonOperation: Operation = { produces: ['application/json'] };
  const jsonProducesSuffix = getFormatSuffix('/projects/api/v3/tasklists', jsonOperation);
  console.log(`14. JSON content type: ${jsonProducesSuffix}`);
  
  // Test with responses content field (OpenAPI 3.0.x)
  console.log('\nTesting with responses content field (OpenAPI 3.0.x):');
  
  // Test with PDF content type
  const pdfResponseOperation: Operation = { responses: { '200': { content: { 'application/pdf': {} } } } };
  const pdfResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', pdfResponseOperation);
  console.log(`15. PDF content type: ${pdfResponseSuffix}`);
  
  // Test with CSV content type
  const csvResponseOperation: Operation = { responses: { '200': { content: { 'text/csv': {} } } } };
  const csvResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', csvResponseOperation);
  console.log(`16. CSV content type: ${csvResponseSuffix}`);
  
  // Test with Excel content type
  const excelResponseOperation: Operation = { responses: { '200': { content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {} } } } };
  const excelResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', excelResponseOperation);
  console.log(`17. Excel content type: ${excelResponseSuffix}`);
  
  // Test with HTML content type
  const htmlResponseOperation: Operation = { responses: { '200': { content: { 'text/html': {} } } } };
  const htmlResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', htmlResponseOperation);
  console.log(`18. HTML content type: ${htmlResponseSuffix}`);
  
  // Test with XML content type
  const xmlResponseOperation: Operation = { responses: { '200': { content: { 'application/xml': {} } } } };
  const xmlResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', xmlResponseOperation);
  console.log(`19. XML content type: ${xmlResponseSuffix}`);
  
  // Test with TXT content type
  const txtResponseOperation: Operation = { responses: { '200': { content: { 'text/plain': {} } } } };
  const txtResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', txtResponseOperation);
  console.log(`20. TXT content type: ${txtResponseSuffix}`);
  
  // Test with JSON content type (should not add a suffix)
  const jsonResponseOperation: Operation = { responses: { '200': { content: { 'application/json': {} } } } };
  const jsonResponseSuffix = getFormatSuffix('/projects/api/v3/tasklists', jsonResponseOperation);
  console.log(`21. JSON content type: ${jsonResponseSuffix}`);
}

// Run the test
testFormatSuffix(); 