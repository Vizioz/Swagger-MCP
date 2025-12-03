// Test script for the version tool functionality
import { fileURLToPath } from 'url';
import path from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the handleVersion function from the build
import { handleVersion } from '../build/tools/version.js';

// Semantic versioning regex pattern (major.minor.patch with optional pre-release/build)
const SEMVER_REGEX = /^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

async function testVersion(): Promise<void> {
  console.log('Testing version tool...\n');
  
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Version tool returns a response
  console.log('Test 1: Version tool returns a valid response');
  try {
    const result = await handleVersion({});
    
    if (!result || !result.content || !result.content[0]) {
      throw new Error('Response is missing expected structure');
    }
    
    console.log('✅ Version tool returned a valid response structure');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 2: Response contains valid JSON with version field
  console.log('\nTest 2: Response contains valid JSON with version field');
  try {
    const result = await handleVersion({});
    const responseText = result.content[0].text;
    const parsed = JSON.parse(responseText);
    
    if (!parsed.version) {
      throw new Error('Response JSON is missing "version" field');
    }
    
    console.log(`✅ Response contains version field: ${parsed.version}`);
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 3: Version number follows semver-like pattern
  console.log('\nTest 3: Version number follows semantic versioning pattern');
  try {
    const result = await handleVersion({});
    const responseText = result.content[0].text;
    const parsed = JSON.parse(responseText);
    const version = parsed.version;
    
    if (!SEMVER_REGEX.test(version)) {
      throw new Error(`Version "${version}" does not match semantic versioning pattern (e.g., 1.0.0)`);
    }
    
    console.log(`✅ Version "${version}" follows semantic versioning pattern`);
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 4: Version matches package.json
  console.log('\nTest 4: Version matches package.json');
  try {
    const result = await handleVersion({});
    const responseText = result.content[0].text;
    const parsed = JSON.parse(responseText);
    
    // Read package.json directly to compare
    const fs = await import('fs');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (parsed.version !== packageJson.version) {
      throw new Error(`Version mismatch: tool returned "${parsed.version}" but package.json has "${packageJson.version}"`);
    }
    
    console.log(`✅ Version matches package.json: ${parsed.version}`);
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 5: Response content type is "text"
  console.log('\nTest 5: Response content type is "text"');
  try {
    const result = await handleVersion({});
    
    if (result.content[0].type !== 'text') {
      throw new Error(`Expected content type "text" but got "${result.content[0].type}"`);
    }
    
    console.log('✅ Response content type is "text"');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Test failed: ${error.message}`);
    testsFailed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`Test Summary: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run the test
testVersion();

