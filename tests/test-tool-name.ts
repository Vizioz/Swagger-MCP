// Simple test script for the generateToolName function
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the functions directly from the source file
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

// Mock operation object
interface MockOperation {
  operationId?: string;
  summary: string;
  description: string;
}

const mockOperation: MockOperation = {
  operationId: 'GET_projects_api_v3_tasks.json',
  summary: 'Get all tasks',
  description: 'Return multiple tasks according to the provided filter.'
};

// Mock path and method
const mockPath = '/projects/api/v3/tasks.json';
const mockMethod = 'GET';

// Since we can't directly import generateToolName, we'll create a wrapper function
// that extracts the tool name from the generated code
async function testGenerateToolName(): Promise<void> {
  console.log('Testing generateToolName function with different parameters:');
  
  // Test 1: Default options
  await testWithOptions(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 2: Include API
  await testWithOptions(
    mockOperation, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 3: Include version
  await testWithOptions(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 4: Include both API and version
  await testWithOptions(
    mockOperation, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 5: No singularization
  await testWithOptions(
    mockOperation, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  
  // Test 6: Without operationId
  const noOperationIdMock = { ...mockOperation };
  delete noOperationIdMock.operationId;
  
  await testWithOptions(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 7: Without operationId, include API
  await testWithOptions(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 8: Without operationId, include version
  await testWithOptions(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 9: Without operationId, no singularization
  await testWithOptions(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
  
  // Test 10: Without operationId, include both API and version
  await testWithOptions(
    noOperationIdMock, 
    mockPath, 
    mockMethod, 
    true,  // includeApiInName
    true,  // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test with a more complex path
  const complexPath = '/projects/api/v3/companies/tasks.json';
  
  // Test 11: Complex path with singularization
  await testWithOptions(
    { ...mockOperation, operationId: undefined }, 
    complexPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    true   // singularizeResourceNames
  );
  
  // Test 12: Complex path without singularization
  await testWithOptions(
    { ...mockOperation, operationId: undefined }, 
    complexPath, 
    mockMethod, 
    false, // includeApiInName
    false, // includeVersionInName
    false  // singularizeResourceNames
  );
}

async function testWithOptions(
  operation: MockOperation, 
  endpointPath: string, 
  method: string,
  includeApiInName: boolean,
  includeVersionInName: boolean,
  singularizeResourceNames: boolean
): Promise<void> {
  try {
    // Create a temporary .swagger-mcp file for testing
    const swaggerConfigPath = './tests/.swagger-mcp-temp';
    const mockSwaggerPath = path.join(__dirname, 'mock-swagger.json');
    fs.writeFileSync(swaggerConfigPath, `SWAGGER_FILEPATH=${mockSwaggerPath}`);
    
    // Create a mock Swagger file
    const mockSwagger: {
      swagger: string;
      paths: {
        [key: string]: {
          [key: string]: MockOperation;
        };
      };
    } = {
      swagger: '2.0',
      paths: {}
    };
    
    mockSwagger.paths[endpointPath] = {};
    mockSwagger.paths[endpointPath][method.toLowerCase()] = operation;
    
    fs.writeFileSync(mockSwaggerPath, JSON.stringify(mockSwagger, null, 2));
    
    // Test the tool name generation
    const params = {
      path: endpointPath,
      method,
      swaggerFilePath: mockSwaggerPath,
      includeApiInName,
      includeVersionInName,
      singularizeResourceNames
    };
    
    // Extract the tool name from the generated code
    const code = await generateEndpointToolCode(params);
    const toolNameMatch = code.match(/export const (\w+) = {/);
    const toolName = toolNameMatch ? toolNameMatch[1] : 'Unknown';
    
    // Log the result
    const testDescription = getTestDescription(includeApiInName, includeVersionInName, singularizeResourceNames, endpointPath);
    console.log(`${testDescription}: ${toolName}`);
    
    // Clean up temporary files
    fs.unlinkSync(swaggerConfigPath);
    fs.unlinkSync(mockSwaggerPath);
  } catch (error: any) {
    console.error('Error testing tool name:', error.message);
  }
}

function getTestDescription(
  includeApiInName: boolean,
  includeVersionInName: boolean,
  singularizeResourceNames: boolean,
  path: string
): string {
  const parts = [];
  
  if (path.includes('companies')) {
    parts.push('Complex path');
  }
  
  if (includeApiInName) {
    parts.push('include API');
  }
  
  if (includeVersionInName) {
    parts.push('include version');
  }
  
  if (!singularizeResourceNames) {
    parts.push('no singularization');
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Default options';
}

// Run the test
testGenerateToolName(); 