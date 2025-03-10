// Simple test script for the generateModelCode functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateModelCode function
import generateModelCode from '../build/services/generateModelCode.js';

interface ModelParams {
  modelName: string;
  swaggerFilePath: string;
}

async function testGenerateModelCode(): Promise<void> {
  try {
    console.log('Testing generateModelCode...');
    
    // Use the mock Swagger file for testing
    const swaggerFilePath = path.join(__dirname, '..', 'ReferenceFiles', 'projects-api-v3.oas2.yml');
    
    // Example model from the Swagger definition
    const params: ModelParams = {
      modelName: 'project.FeatureOrder',
      swaggerFilePath
    };
    
    console.log(`Testing with model: ${params.modelName}`);
    
    const tsCode = await generateModelCode(params);
    console.log('Generated TypeScript code:');
    console.log('--------------------------------------------------');
    console.log(tsCode);
    console.log('--------------------------------------------------');
    
    // Save the generated code to a file for easier viewing
    const outputPath = path.join(__dirname, 'generated/generated-model.ts');
    
    // Ensure the directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, tsCode);
    console.log(`Generated code saved to: ${outputPath}`);
  } catch (error: any) {
    console.error('Error testing generateModelCode:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testGenerateModelCode(); 