// Script to run all tests
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running all tests...\n');

const tests = [
  'test-endpoint-tool-code.js',
  'test-format-suffix-mock.js',
  'test-calendar-events.js',
  'test-combined-features.js'
];

// Run each test
tests.forEach((test, index) => {
  console.log(`\n${index + 1}. Running ${test}...\n`);
  try {
    execSync(`node ${path.join(__dirname, test)}`, { stdio: 'inherit' });
    console.log(`\n✅ ${test} completed successfully.\n`);
  } catch (error) {
    console.error(`\n❌ ${test} failed with error: ${error.message}\n`);
  }
});

console.log('\nAll tests completed.'); 