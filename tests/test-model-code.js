// Simple test script for the generateModelCode functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateModelCode function
import generateModelCode from './build/services/generateModelCode.js';

async function testGenerateModelCode() {
  try {
    console.log('Testing generateModelCode...');
    
    // Example model from the Swagger definition
    const params = {
      modelName: 'view.TaskV205'
    };
    
    console.log(`Testing with model: ${params.modelName}`);
    
    const tsCode = await generateModelCode(params);
    console.log('Generated TypeScript code:');
    console.log('--------------------------------------------------');
    console.log(tsCode);
    console.log('--------------------------------------------------');
    
    // Save the generated code to a file for easier viewing
    const outputPath = path.join(__dirname, 'generated-model.ts');
    fs.writeFileSync(outputPath, tsCode);
    console.log(`Generated code saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error testing generateModelCode:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testGenerateModelCode(); 