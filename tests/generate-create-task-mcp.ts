// Generate MCP Definition for Create Task Endpoint
// This script generates the MCP tool definition for the POST /tasks endpoint

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

async function generateCreateTaskMCP(): Promise<void> {
  try {
    console.log('Generating MCP definition for Create Task endpoint...');
    
    // Use the existing Swagger file from ReferenceFiles
    const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
    
    if (!fs.existsSync(swaggerFilePath)) {
      console.error(`Swagger file not found at ${swaggerFilePath}`);
      return;
    }
    
    console.log(`Using Swagger file: ${swaggerFilePath}`);
    
    // Try to find a POST endpoint for creating tasks
    // We'll try a few common paths
    const postEndpoints = [
      '/projects/api/v3/tasks.json',
      '/projects/api/v3/tasklists/{tasklistId}/tasks.json'
    ];
    
    for (const postPath of postEndpoints) {
      try {
        console.log(`Trying POST endpoint: ${postPath}`);
        
        // Generate tool code with default options
        const params: GenerateEndpointToolCodeParams = {
          path: postPath,
          method: 'POST',
          swaggerFilePath,
          includeApiInName: false,
          includeVersionInName: false,
          singularizeResourceNames: true
        };
        
        const tsCode = await generateEndpointToolCode(params);
        
        // Save the generated code for inspection
        const filename = `create-task-mcp-${postPath.replace(/\//g, '-').replace(/[{}\.]/g, '')}.ts`;
        saveGeneratedCode(tsCode, filename);
        
        console.log(`\n✅ Successfully generated MCP definition for POST ${postPath}`);
        console.log(`Check the file in tests/generated/${filename}`);
        
        // Break after the first successful endpoint
        break;
      } catch (error: any) {
        console.error(`Error generating MCP for POST ${postPath}:`, error.message);
        console.log('Trying next endpoint...');
      }
    }
  } catch (error: any) {
    console.error('Error generating Create Task MCP definition:', error);
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

// Run the generator
generateCreateTaskMCP(); 