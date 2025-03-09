// Simple test script for the listEndpointModels functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the listEndpointModels function
import listEndpointModels from './build/services/listEndpointModels.js';

async function testListEndpointModels() {
  try {
    console.log('Testing listEndpointModels...');
    
    // Example endpoint from the Swagger definition
    const params = {
      path: '/projects/api/v3/tasks.json',
      method: 'GET'
    };
    
    console.log(`Testing with endpoint: ${params.method} ${params.path}`);
    
    const models = await listEndpointModels(params);
    console.log('Models:');
    console.log(JSON.stringify(models, null, 2));
    console.log(`Found ${models.length} models.`);
  } catch (error) {
    console.error('Error testing listEndpointModels:', error);
  }
}

// Run the test
testListEndpointModels(); 