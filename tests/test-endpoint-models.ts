// Simple test script for the listEndpointModels functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the listEndpointModels function
import listEndpointModels from '../build/services/listEndpointModels.js';

interface EndpointParams {
  path: string;
  method: string;
  swaggerFilePath: string;
}

async function testListEndpointModels(): Promise<void> {
  try {
    console.log('Testing listEndpointModels...');
    
    // Use the mock Swagger file for testing
    const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
    
    // Test multiple endpoints to find ones with models
    const endpoints = [
      {
        path: '/projects/api/v3/projects.json',
        method: 'GET',
        description: 'Get projects endpoint'
      },
      {
        path: '/projects/api/v3/tasklists/{tasklistId}/tasks.json',
        method: 'POST',
        description: 'Create task endpoint'
      },
      {
        path: '/projects/api/v3/tasks/{taskId}.json',
        method: 'PATCH',
        description: 'Update task endpoint'
      }
    ];
    
    for (const endpoint of endpoints) {
      const params: EndpointParams = {
        path: endpoint.path,
        method: endpoint.method,
        swaggerFilePath
      };
      
      console.log(`\nTesting with endpoint: ${endpoint.description} (${params.method} ${params.path})`);
      
      const models = await listEndpointModels(params);
      console.log('Models:');
      console.log(JSON.stringify(models, null, 2));
      console.log(`Found ${models.length} models.`);
    }
  } catch (error: any) {
    console.error('Error testing listEndpointModels:', error);
  }
}

// Run the test
testListEndpointModels(); 