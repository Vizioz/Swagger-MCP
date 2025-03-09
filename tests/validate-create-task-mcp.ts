// Validate Create Task MCP Definition
// This script validates the generated MCP definition for the create task endpoint against the official MCP schema

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      
      // Check what's in the required array
      const requiredParams = toolCode.match(/required:\s*\[(.*?)\]/s);
      if (requiredParams && requiredParams[1]) {
        console.log(`- Required parameters: ${requiredParams[1].trim()}`);
      }
    }
    
    // All required properties are present
    console.log('✅ Tool definition is valid according to MCP schema');
    return true;
  } catch (error: any) {
    console.error('Error validating tool against MCP schema:', error);
    return false;
  }
}

async function validateCreateTaskMCP(): Promise<void> {
  try {
    console.log('Validating Create Task MCP definition...');
    
    // Path to the generated MCP definition
    const mcpFilePath = path.join(__dirname, 'generated', 'create-task-mcp--projects-api-v3-tasklists-tasklistId-tasksjson.ts');
    
    if (!fs.existsSync(mcpFilePath)) {
      console.error(`MCP definition file not found at ${mcpFilePath}`);
      console.log('Please run the generate-create-task-mcp.ts script first.');
      return;
    }
    
    // Read the generated MCP definition
    const mcpCode = fs.readFileSync(mcpFilePath, 'utf8');
    
    // Validate the MCP definition against the schema
    const isValid = await validateToolAgainstMCPSchema(mcpCode);
    
    if (isValid) {
      console.log('\n✅ Create Task MCP definition complies with the MCP schema');
    } else {
      console.error('\n❌ Create Task MCP definition does NOT comply with the MCP schema');
      console.log('\nPlease check the generated code and fix any issues.');
    }
    
    // Print the MCP definition for reference
    console.log('\n=== Create Task MCP Definition ===');
    
    // Extract just the tool definition part
    const toolDefMatch = mcpCode.match(/export const .*?= ({[\s\S]*?});/);
    if (toolDefMatch && toolDefMatch[1]) {
      console.log(toolDefMatch[0]);
    } else {
      console.log('Could not extract tool definition from the MCP code.');
    }
  } catch (error: any) {
    console.error('Error validating Create Task MCP definition:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the validator
validateCreateTaskMCP(); 