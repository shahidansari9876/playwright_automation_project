#!/usr/bin/env node

/**
 * Simple Test Runner for Login & OTP Tests
 * Helps debug issues with test execution
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║              LOGIN & OTP - TEST SUITE RUNNER                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function runTests() {
  return new Promise((resolve) => {
    const testProcess = spawn('npx', [
      'playwright',
      'test',
      '--reporter=json',
      '--output=test-results/results.json'
    ], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      console.log(`\n\n✅ Test suite completed with exit code: ${code}`);
      resolve(code);
    });

    testProcess.on('error', (err) => {
      console.error(`❌ Test error: ${err.message}`);
      resolve(1);
    });
  });
}

async function main() {
  try {
    console.log('🚀 Starting test execution...\n');
    const exitCode = await runTests();

    if (exitCode === 0) {
      console.log('\n📊 All tests passed! ✅');
      console.log('\n💡 To view detailed report:');
      console.log('   npx playwright show-report\n');
    } else {
      console.log('\n⚠️  Some tests failed. Checking results...\n');
    }

    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  }
}

main();
