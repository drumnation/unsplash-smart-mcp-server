#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the server script
const serverPath = path.join(__dirname, '..', 'src', 'server.ts');

// Get API key from environment or use test key
const apiKey = process.env.UNSPLASH_ACCESS_KEY || 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0';

console.log('Starting Stock Photo MCP server...');

// Start the server as a child process
const server = spawn('tsx', [serverPath], {
  env: { 
    ...process.env,
    UNSPLASH_ACCESS_KEY: apiKey,
    NODE_ENV: 'test'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('Test timed out');
  server.kill();
  process.exit(1);
}, 60000);

// Flag to track if we're getting a proper response
let initialResponseReceived = false;

// Handle server output
server.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`Server stdout: ${output}`);
  
  try {
    // Try to parse as JSON to see if it's a proper response
    const jsonData = JSON.parse(output);
    
    // If we get here, it's valid JSON
    initialResponseReceived = true;
    
    // If we see downloaded photos in the response, print success message
    if (jsonData.result && jsonData.result.downloaded_photos) {
      console.log('\n✅ Success! Stock photo tool returned:');
      console.log(`- Downloaded ${jsonData.result.downloaded_photos.length} images`);
      console.log(`- Output directory: ${jsonData.result.output_directory}`);
      jsonData.result.downloaded_photos.forEach((photo, i) => {
        console.log(`\nImage ${i+1}:`);
        console.log(`- Path: ${photo.file_path}`);
        console.log(`- Description: ${photo.description}`);
        console.log(`- Dimensions: ${photo.dimensions}`);
        console.log(`- Attribution: ${photo.attribution}`);
      });
      
      console.log('\nTest completed successfully!');
      server.kill();
      clearTimeout(timeout);
      process.exit(0);
    }
  } catch (e) {
    // Not JSON or error parsing, just log it
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.error(`Server stderr: ${output}`);
  
  // Check if server is ready
  if (output.includes('Stock Photo MCP Server started')) {
    console.log('\nServer is ready, sending test request...');
    
    // Give it a moment to initialize
    setTimeout(() => {
      // Send a request to test the stock_photo tool
      const request = {
        jsonrpc: '2.0',
        method: 'tool/invoke',
        id: 123,
        params: {
          name: 'stock_photo',
          args: {
            purpose: 'hero',
            orientation: 'landscape',
            count: 2,
            width: 1920,
            height: 1080
          }
        }
      };
      
      console.log('Sending request:', JSON.stringify(request, null, 2));
      server.stdin.write(JSON.stringify(request) + '\n');
    }, 1000);
  }
});

server.on('close', (code) => {
  if (code !== 0 && !initialResponseReceived) {
    console.error(`Server process exited with code ${code} before sending a response`);
  }
  clearTimeout(timeout);
  process.exit(code);
});

// Exit cleanly on interruptions
process.on('SIGINT', () => {
  console.log('Terminating test...');
  server.kill();
  clearTimeout(timeout);
  process.exit(0);
}); 