// Script to run all tests
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running all tests...\n');

// Keep the original JS tests for now
const jsTests: string[] = [
  'test-endpoint-tool-code.js',
  'test-format-suffix-mock.js',
  'test-calendar-events.js',
  'test-combined-features.js'
];

// Add TypeScript tests as we convert them
const tsTests: string[] = [
  'test-endpoint-tool-code.ts',
  'test-format-suffix-mock.ts',
  'test-calendar-events.ts',
  'test-combined-features.ts'
];

// Run JavaScript tests
jsTests.forEach((test: string, index: number) => {
  console.log(`\n${index + 1}. Running ${test}...\n`);
  try {
    execSync(`node ${path.join(__dirname, test)}`, { stdio: 'inherit' });
    console.log(`\n✅ ${test} completed successfully.\n`);
  } catch (error: any) {
    console.error(`\n❌ ${test} failed with error: ${error.message}\n`);
  }
});

// Run TypeScript tests
tsTests.forEach((test: string, index: number) => {
  console.log(`\n${jsTests.length + index + 1}. Running ${test}...\n`);
  try {
    execSync(`npx tsx ${path.join(__dirname, test)}`, { stdio: 'inherit' });
    console.log(`\n✅ ${test} completed successfully.\n`);
  } catch (error: any) {
    console.error(`\n❌ ${test} failed with error: ${error.message}\n`);
  }
});

console.log('\nAll tests completed.'); 