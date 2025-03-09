// Simple test script for the generateToolName function
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock operation object
const mockOperation = {
  operationId: 'GET_projects_api_v3_tasks.json',
  summary: 'Get all tasks',
  description: 'Return multiple tasks according to the provided filter.'
};

// Mock path and method
const mockPath = '/projects/api/v3/tasks.json';
const mockMethod = 'GET';

// Import the functions directly from the source file
import fs_source from 'fs';
const sourceCode = fs_source.readFileSync('./src/services/generateEndpointToolCode.ts', 'utf8');

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

// Extract the generateToolName function
const generateToolNameFnMatch = jsSourceCode.match(/function generateToolName\([^{]*{([\s\S]*?)^}/m);
if (!generateToolNameFnMatch) {
  console.error('Could not extract generateToolName function from source');
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

// Create the functions
const camelCase = new Function('str', `${camelCaseFnMatch[1]} return camelCase(str);`);
const pascalCase = new Function('str', `
  const camelCase = ${camelCase.toString()};
  ${pascalCaseFnMatch[1]} return pascalCase(str);
`);
const formatMethodName = new Function('method', `${formatMethodNameFnMatch[1]} return formatMethodName(method);`);
const generateToolName = new Function(
  'operation', 
  'endpointPath', 
  'method', 
  'includeApiInName', 
  'includeVersionInName', 
  'singularizeResourceNames',
  `
  const formatMethodName = ${formatMethodName.toString()};
  const pascalCase = ${pascalCase.toString()};
  const camelCase = ${camelCase.toString()};
  ${generateToolNameFnMatch[1]} return generateToolName(operation, endpointPath, method, includeApiInName, includeVersionInName, singularizeResourceNames);
  `
);

// Test the function with different parameters
function testGenerateToolName() {
  console.log('Testing generateToolName function with different parameters:');
  
  // Test 1: Default options
  const test1 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('1. Default options (no API, no version, singularize):', test1);
  
  // Test 2: Include API
  const test2 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('2. Include API in name:', test2);
  
  // Test 3: Include version
  const test3 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('3. Include version in name:', test3);
  
  // Test 4: Include both API and version
  const test4 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('4. Include both API and version in name:', test4);
  
  // Test 5: No singularization
  const test5 = generateToolName(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  console.log('5. Without singularization:', test5);
  
  // Test 6: Without operationId
  const noOperationIdMock = { ...mockOperation };
  delete noOperationIdMock.operationId;
  
  const test6 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('6. Without operationId (no API, no version, singularize):', test6);
  
  // Test 7: Without operationId, include API
  const test7 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('7. Without operationId, include API:', test7);
  
  // Test 8: Without operationId, include version
  const test8 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('8. Without operationId, include version:', test8);
  
  // Test 9: Without operationId, no singularization
  const test9 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  console.log('9. Without operationId, no singularization:', test9);
  
  // Test 10: Without operationId, include both API and version
  const test10 = generateToolName(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('10. Without operationId, include both API and version:', test10);
  
  // Test with a more complex path
  const complexPath = '/projects/api/v3/companies/tasks.json';
  
  // Test 11: Complex path with singularization
  const test11 = generateToolName(
    { ...mockOperation, operationId: null }, 
    complexPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  console.log('11. Complex path with singularization:', test11);
  
  // Test 12: Complex path without singularization
  const test12 = generateToolName(
    { ...mockOperation, operationId: null }, 
    complexPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  console.log('12. Complex path without singularization:', test12);
}

// Run the test
testGenerateToolName(); 