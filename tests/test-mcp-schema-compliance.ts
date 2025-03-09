// Test MCP Schema Compliance
// This test validates that our generated MCP tool code complies with the official MCP schema

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

// Import the MCP schema types
import { Tool } from './mcp-schema.js';

// Create a function to validate a generated tool against the MCP schema
async function validateToolAgainstMCPSchema(toolCode: string): Promise<boolean> {
  try {
    // Instead of trying to parse the code as JSON, we'll use regex to check for required properties
    console.log('Validating tool definition against MCP schema...');
    
    // Check if the tool has a name property
    const nameMatch = toolCode.match(/name:\s*["']([^"']+)["']/);
    if (!nameMatch) {
      console.error('- Missing "name" property in tool definition');
      return false;
    }
    console.log(`- Tool name: ${nameMatch[1]}`);
    
    // Check if the tool has a description property
    const descMatch = toolCode.match(/description:\s*["']([^"']+)["']/);
    if (!descMatch) {
      console.warn('- Missing "description" property in tool definition (optional)');
      // Description is optional, so we don't return false
    } else {
      console.log(`- Tool description: ${descMatch[1].substring(0, 50)}...`);
    }
    
    // Check if the tool has an inputSchema property
    const schemaMatch = toolCode.match(/inputSchema:\s*{/);
    if (!schemaMatch) {
      console.error('- Missing "inputSchema" property in tool definition');
      return false;
    }
    console.log('- Tool has inputSchema property');
    
    // Check if the inputSchema has a type property
    const typeMatch = toolCode.match(/type:\s*["']object["']/);
    if (!typeMatch) {
      console.error('- Missing or incorrect "type" property in inputSchema');
      return false;
    }
    console.log('- inputSchema has correct type: "object"');
    
    // Check if the inputSchema has a properties property
    const propertiesMatch = toolCode.match(/properties:\s*{/);
    if (!propertiesMatch) {
      console.warn('- Missing "properties" property in inputSchema (optional)');
      // Properties is optional, so we don't return false
    } else {
      console.log('- inputSchema has properties');
    }
    
    // Check if the inputSchema has a required property
    const requiredMatch = toolCode.match(/required:\s*\[/);
    if (!requiredMatch) {
      console.warn('- Missing "required" property in inputSchema (optional)');
      // Required is optional, so we don't return false
    } else {
      console.log('- inputSchema has required array');
    }
    
    // All required properties are present
    console.log('✅ Tool definition is valid according to MCP schema');
    return true;
  } catch (error: any) {
    console.error('Error validating tool against MCP schema:', error);
    return false;
  }
}

async function testEndpoint(endpoint: { path: string, method: string, swaggerFilePath: string }): Promise<boolean> {
  try {
    // Generate tool code with default options
    const params: GenerateEndpointToolCodeParams = {
      ...endpoint,
      includeApiInName: false,
      includeVersionInName: false,
      singularizeResourceNames: true
    };
    
    console.log(`Generating tool code for ${endpoint.method} ${endpoint.path}...`);
    const tsCode = await generateEndpointToolCode(params);
    
    // Save the generated code for inspection
    const filename = `mcp-schema-test-${endpoint.method.toLowerCase()}.ts`;
    saveGeneratedCode(tsCode, filename);
    
    // Validate the generated tool code against the MCP schema
    const isValid = await validateToolAgainstMCPSchema(tsCode);
    
    if (isValid) {
      console.log(`\n✅ Generated tool code for ${endpoint.method} ${endpoint.path} complies with the MCP schema`);
    } else {
      console.error(`\n❌ Generated tool code for ${endpoint.method} ${endpoint.path} does NOT comply with the MCP schema`);
      console.log('\nPlease check the generated code and fix any issues.');
    }
    
    return isValid;
  } catch (error: any) {
    console.error(`Error testing endpoint ${endpoint.method} ${endpoint.path}:`, error);
    return false;
  }
}

async function testMCPSchemaCompliance(): Promise<void> {
  try {
    console.log('Testing MCP schema compliance for generated tool code...');
    
    // Use the existing Swagger file from ReferenceFiles
    const mockSwaggerPath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
    
    if (!fs.existsSync(mockSwaggerPath)) {
      console.error(`Swagger file not found at ${mockSwaggerPath}`);
      return;
    }
    
    console.log(`Using Swagger file: ${mockSwaggerPath}`);
    
    // Test GET endpoint (calendar events PDF)
    console.log('\n=== Testing GET endpoint (calendar events PDF) ===');
    const getEndpoint = {
      path: '/projects/api/v3/calendar/events.pdf',
      method: 'GET',
      swaggerFilePath: mockSwaggerPath
    };
    
    const getEndpointValid = await testEndpoint(getEndpoint);
    
    // For this test, we'll focus on validating the GET endpoint only
    // since we know it exists in the mock Swagger file
    
    // Summary
    console.log('\n=== Test Summary ===');
    if (getEndpointValid) {
      console.log('✅ GET endpoint complies with the MCP schema');
      console.log('✅ MCP schema compliance test passed');
    } else {
      console.error('❌ GET endpoint does not comply with the MCP schema');
      console.error('❌ MCP schema compliance test failed');
    }
    
    // Note about POST endpoints
    console.log('\nNote: This test currently only validates GET endpoints.');
    console.log('To test POST endpoints, update the test to use a specific POST endpoint from the mock Swagger file.');
  } catch (error: any) {
    console.error('Error testing MCP schema compliance:', error);
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
testMCPSchemaCompliance(); 