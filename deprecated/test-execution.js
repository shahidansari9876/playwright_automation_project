#!/usr/bin/env node

/**
 * Test Execution Script
 * Runs tests and logs output to file and console
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'test-execution.log');
const writeStream = fs.createWriteStream(logFile, { flags: 'w' });

function log(message) {
  console.log(message);
  writeStream.write(message + '\n');
}

log('╔════════════════════════════════════════════════════════════════╗');
log('║              TEST EXECUTION LOG                                ║');
log('╚════════════════════════════════════════════════════════════════╝\n');

log(`Started at: ${new Date().toISOString()}\n`);

const command = 'npx playwright test tests/01-positive.spec.ts tests/02-negative.spec.ts tests/03-edgecases.spec.ts --reporter=list';

log(`Executing: ${command}\n\n`);

const proc = exec(command, { cwd: __dirname, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
  log('\n╔════════════════════════════════════════════════════════════════╗');
  log('║              EXECUTION COMPLETE                                 ║');
  log('╚════════════════════════════════════════════════════════════════╝\n');

  if (error) {
    log(`❌ Error: ${error.message}`);
    log(`Exit Code: ${error.code}\n`);
  } else {
    log('✅ Tests completed successfully\n');
  }

  log(`Finished at: ${new Date().toISOString()}\n`);
  writeStream.end();

  console.log(`\n📝 Full log saved to: ${logFile}`);
});

// Stream output in real-time
proc.stdout.on('data', (data) => {
  log(data.toString().trim());
});

proc.stderr.on('data', (data) => {
  log(`⚠️ ${data.toString().trim()}`);
});

// Handle process exit
proc.on('close', (code) => {
  log(`\nProcess exited with code: ${code}`);
  writeStream.end();
});
