// Test script for date and time types handling
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateEndpointToolCode function
import generateEndpointToolCode from '../build/services/generateEndpointToolCode.js';

// Define the interface for the function parameters
interface GenerateEndpointToolCodeParams {
  path: string;
  method: string;
  swaggerFilePath: string;
  includeApiInName?: boolean;
  includeVersionInName?: boolean;
  singularizeResourceNames?: boolean;
}

// Helper function to save generated code to a file
function saveGeneratedCode(code: string, filename: string): void {
  const outputPath = path.join(__dirname, 'generated', filename);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, code);
  console.log(`\nSaved generated code to ${outputPath}`);
}

async function testDateTimeTypes(): Promise<void> {
  try {
    console.log('Testing date and time types handling...');

    // Test with JSON file
    const jsonParams: GenerateEndpointToolCodeParams = {
      path: '/events',
      method: 'POST',
      swaggerFilePath: path.join(__dirname, 'test-data/date-time-test.json')
    };

    console.log(`\nGenerating tool code for ${jsonParams.method} ${jsonParams.path} from JSON file...`);
    const jsonCode = await generateEndpointToolCode(jsonParams);
    console.log('\nGenerated code from JSON:');
    console.log(jsonCode);

    // Save the generated code to a file for inspection
    saveGeneratedCode(jsonCode, 'create-event-json.ts');

    // Test with YAML file
    const yamlParams: GenerateEndpointToolCodeParams = {
      path: '/events',
      method: 'POST',
      swaggerFilePath: path.join(__dirname, 'test-data/date-time-test.yml')
    };

    console.log(`\nGenerating tool code for ${yamlParams.method} ${yamlParams.path} from YAML file...`);
    const yamlCode = await generateEndpointToolCode(yamlParams);
    console.log('\nGenerated code from YAML:');
    console.log(yamlCode);

    // Save the generated code to a file for inspection
    saveGeneratedCode(yamlCode, 'create-event-yaml.ts');

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing date and time types:', error);
  }
}

// Run the test
testDateTimeTypes(); 