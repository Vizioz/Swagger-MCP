// Simple test script for the listEndpoints functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the listEndpoints function
import listEndpoints from '../build/services/listEndpoints.js';

async function testListEndpoints(): Promise<void> {
  try {
    console.log('Testing listEndpoints...');
    
    // Use the mock Swagger file for testing
    const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
    
    const endpoints = await listEndpoints({ swaggerFilePath });
    console.log('Endpoints:');
    console.log(JSON.stringify(endpoints, null, 2));
    console.log(`Found ${endpoints.length} endpoints.`);
  } catch (error: any) {
    console.error('Error testing listEndpoints:', error);
  }
}

// Run the test
testListEndpoints(); 