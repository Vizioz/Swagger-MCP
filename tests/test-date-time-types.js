// Test script for date and time types handling
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the generateEndpointToolCode function
import generateEndpointToolCode from '../build/services/generateEndpointToolCode.js';

async function testDateTimeTypes() {
  try {
    console.log('Testing date and time types handling...');

    // Test with JSON file
    const jsonParams = {
      path: '/events',
      method: 'POST',
      swaggerFilePath: path.join(__dirname, 'test-data/date-time-test.json')
    };

    console.log(`\nGenerating tool code for ${jsonParams.method} ${jsonParams.path} from JSON file...`);
    const jsonCode = await generateEndpointToolCode(jsonParams);
    console.log('\nGenerated code:');
    console.log(jsonCode);

    // Save the generated code to a file for inspection
    const jsonOutputPath = path.join(__dirname, 'generated/create-event-json.js');
    fs.mkdirSync(path.dirname(jsonOutputPath), { recursive: true });
    fs.writeFileSync(jsonOutputPath, jsonCode);
    console.log(`\nSaved generated code to ${jsonOutputPath}`);

    // Test with YAML file
    const yamlParams = {
      path: '/events',
      method: 'POST',
      swaggerFilePath: path.join(__dirname, 'test-data/date-time-test.yml')
    };

    console.log(`\nGenerating tool code for ${yamlParams.method} ${yamlParams.path} from YAML file...`);
    const yamlCode = await generateEndpointToolCode(yamlParams);
    console.log('\nGenerated code:');
    console.log(yamlCode);

    // Save the generated code to a file for inspection
    const yamlOutputPath = path.join(__dirname, 'generated/create-event-yaml.js');
    fs.writeFileSync(yamlOutputPath, yamlCode);
    console.log(`\nSaved generated code to ${yamlOutputPath}`);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing date and time types:', error);
  }
}

// Run the test
testDateTimeTypes(); 