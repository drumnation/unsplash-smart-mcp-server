#!/usr/bin/env node

// Test the FastMCP server over HTTP
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting server in HTTP mode...');

// Start the server with HTTP enabled
const server = spawn('npx', ['tsx', path.join(rootDir, 'src/server.ts')], 
  {
    env: {
      ...process.env,
      UNSPLASH_ACCESS_KEY: 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0',
      NODE_ENV: 'test',
      PORT: '3000',
      HOST: 'localhost'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  }
);

// Log server output
server.stdout.on('data', (data) => {
  console.log(`Server stdout: ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.log(`Server stderr: ${data.toString().trim()}`);
});

// Test function to make an HTTP request to the server
function testHttpRequest() {
  console.log('Sending HTTP request to server...');
  
  // Create test request for ping
  const pingRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'ping'
  };
  
  // Options for HTTP request
  const requestOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Send request
  const req = http.request(requestOptions, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response received:', responseData);
      
      try {
        const response = JSON.parse(responseData);
        if (response.result === 'pong') {
          console.log('✅ Server ping test successful!');
          server.kill();
          process.exit(0);
        } else {
          console.error('❌ Unexpected response:', response);
          server.kill();
          process.exit(1);
        }
      } catch (e) {
        console.error('Error parsing response:', e);
        server.kill();
        process.exit(1);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Request error:', error);
    
    // If the server isn't ready yet, retry after a delay
    if (error.code === 'ECONNREFUSED' && !hasFailed) {
      console.log('Server not ready yet, retrying in 1 second...');
      setTimeout(testHttpRequest, 1000);
      return;
    }
    
    hasFailed = true;
    server.kill();
    process.exit(1);
  });
  
  // Write request data
  req.write(JSON.stringify(pingRequest));
  req.end();
}

// Variable to track if the test has failed
let hasFailed = false;

// Give the server time to start
setTimeout(() => {
  testHttpRequest();
}, 2000);

// Set a timeout in case the test never completes
setTimeout(() => {
  if (!hasFailed) {
    console.error('❌ Test timed out after 10 seconds');
    server.kill();
    process.exit(1);
  }
}, 10000);

// Handle clean exit
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
}); 