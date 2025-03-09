import fs from 'fs';
import path from 'path';
import generateEndpointToolCode from '../src/services/generateEndpointToolCode.js';

async function testImprovedImplementation() {
  try {
    console.log('Testing improved MCP tool code generator...');
    
    // Path to the Swagger definition file
    const swaggerFilePath = path.resolve('./petstore.json');
    
    // Test endpoint and method
    const endpointPath = '/pets';
    const method = 'POST';
    
    // Generate the MCP tool code
    const toolCode = await generateEndpointToolCode({
      path: endpointPath,
      method,
      swaggerFilePath,
      singularizeResourceNames: true
    });
    
    // Save the generated code to a file
    const outputDir = path.resolve('./tests/generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'improved-create-pet-mcp.ts');
    fs.writeFileSync(outputFile, toolCode);
    
    console.log(`Successfully generated MCP tool code and saved to ${outputFile}`);
    console.log('Generated code:');
    console.log('-----------------------------------');
    console.log(toolCode);
    console.log('-----------------------------------');
    
    return true;
  } catch (error) {
    console.error('Error testing improved implementation:', error);
    return false;
  }
}

// Run the test
testImprovedImplementation()
  .then(success => {
    if (success) {
      console.log('Test completed successfully!');
      process.exit(0);
    } else {
      console.error('Test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 