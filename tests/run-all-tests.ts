// Script to run all tests
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running all tests...\n');

// No more JavaScript tests to run
const jsTests: string[] = [];

// TypeScript tests
const tsTests: string[] = [
  'test-endpoint-tool-code.ts',
  'test-format-suffix-mock.ts',
  'test-calendar-events.ts',
  'test-combined-features.ts',
  'test-complex-path.ts',
  'test-endpoint-models.ts',
  'test-endpoints.ts',
  'test-model-code.ts',
  'test-tool-name.ts',
  'test-mcp-schema-compliance.ts',
  'test-mcp-validation.ts',
  'test-create-task-validation.ts',
  // New tests
  'test-generator.ts',
  'test-openapi-versions.ts',
  'test-authentication-support.ts',
  'test-file-operations.ts',
  'test-error-handling.ts',
  'test-schema-validation.ts'
];

// Run JavaScript tests
for (let i = 0; i < jsTests.length; i++) {
  const test = jsTests[i];
  console.log(`\n${i + 1}. Running ${test}...`);
  
  try {
    const { execSync } = await import('child_process');
    execSync(`node R:\\Development\\Projects\\swagger-mcp\\tests\\${test}`, { stdio: 'inherit' });
    console.log(`\n✅ ${test} completed successfully.`);
  } catch (error: any) {
    console.log(`\n❌ ${test} failed with error: ${error.message}`);
  }
}

// Run TypeScript tests
for (let i = 0; i < tsTests.length; i++) {
  const test = tsTests[i];
  console.log(`\n${i + jsTests.length + 1}. Running ${test}...`);
  
  try {
    const { execSync } = await import('child_process');
    execSync(`npx tsx R:\\Development\\Projects\\swagger-mcp\\tests\\${test}`, { stdio: 'inherit' });
    console.log(`\n✅ ${test} completed successfully.`);
  } catch (error: any) {
    console.log(`\n❌ ${test} failed with error: ${error.message}`);
  }
}

console.log('\nAll tests completed.'); 