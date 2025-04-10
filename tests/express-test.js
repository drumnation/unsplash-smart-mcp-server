#!/usr/bin/env node

import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create an Express server to check if FastMCP works over HTTP
const app = express();
const PORT = 3333;

// Set up a basic endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Express test server running!' });
});

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`Express test server running on port ${PORT}`);
  
  // Set default API key for testing
  process.env.UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0';
  
  try {
    // Run the standard test script
    console.log('Running standard tests...');
    await runCommand('npm test');
    console.log('✅ Standard tests passed');
    
    // Run the manual test script
    console.log('\nRunning manual tests...');
    await runCommand('npm run test:manual');
    console.log('✅ Manual tests passed');
    
    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Clean up and exit
    server.close();
  }
});

// Helper function to run a command and return a promise
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, {
      env: {
        ...process.env,
        UNSPLASH_ACCESS_KEY: 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0',
        NODE_ENV: 'test'
      }
    }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
} 