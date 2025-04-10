#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import assert from 'assert';
import os from 'os';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Check if Docker is installed
try {
  execSync('docker --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Docker is not installed or not running. Please install Docker to run this test.');
  process.exit(1);
}

// Get API key from environment or use test key
const apiKey = process.env.UNSPLASH_ACCESS_KEY || 'Ahw5GzA-2fIX3ffrKHiHwTmy8dTWEmvWYpSK0wKzZw0';

// Unique image name for this test
const dockerImageName = `unsplash-mcp-test-${Date.now()}`;

console.log('======= UNSPLASH MCP SERVER DOCKER TEST =======');
console.log('Building Docker image...');

try {
  // Build the Docker image
  execSync(`docker build -t ${dockerImageName} ${rootDir}`, { 
    stdio: 'inherit' 
  });
  
  console.log('\n✅ Docker image built successfully!');
} catch (error) {
  console.error('\n❌ Failed to build Docker image:', error.message);
  process.exit(1);
}

console.log('\nTesting Docker container with MCP request...');

// Create a test request file
const requestFile = path.join(os.tmpdir(), `mcp-request-${Date.now()}.json`);
const responseFile = path.join(os.tmpdir(), `mcp-response-${Date.now()}.json`);

// Create a test request
const request = {
  jsonrpc: '2.0',
  method: 'tool/invoke',
  id: 123,
  params: {
    name: 'stock_photo',
    args: {
      query: 'mountain landscape',
      orientation: 'landscape',
      count: 2,
      downloadMode: 'urls_only'
    }
  }
};

// Write the request to a temporary file
fs.writeFileSync(requestFile, JSON.stringify(request));

try {
  // Run Docker container with file redirection
  console.log(`Running Docker container with MCP request...`);
  execSync(`cat ${requestFile} | docker run -i --rm -e UNSPLASH_ACCESS_KEY=${apiKey} ${dockerImageName} > ${responseFile}`, {
    stdio: ['inherit', 'inherit', 'inherit'],
    timeout: 30000 // 30 second timeout
  });
  
  // Read the response
  const responseContent = fs.readFileSync(responseFile, 'utf8');
  console.log('\nResponse received from Docker container:');
  console.log(responseContent.substring(0, 200) + '...');
  
  // Parse the response
  try {
    const jsonData = JSON.parse(responseContent);
    
    // Validate the response for urls_only mode
    if (jsonData.result && jsonData.result.mode === 'urls_only') {
      console.log('\n✅ Success! Stock photo tool returned:');
      console.log(`- Found ${jsonData.result.found_photos.length} images`);
      console.log(`- Mode: ${jsonData.result.mode}`);
      console.log(`- Suggested directory: ${jsonData.result.suggested_directory}`);
      
      // Verify the necessary fields exist
      assert.ok(Array.isArray(jsonData.result.found_photos), 'found_photos should be an array');
      assert.ok(Array.isArray(jsonData.result.download_commands), 'download_commands should be an array');
      assert.ok(jsonData.result.directory_setup_commands.length > 0, 'directory_setup_commands should not be empty');
      assert.strictEqual(jsonData.result.mode, 'urls_only', 'mode should be urls_only');
      
      console.log('\n✅ All tests passed!');
    } else {
      console.error('❌ Response does not contain expected data format');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Failed to parse response as JSON:', e);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Docker test failed:', error.message);
  process.exit(1);
} finally {
  // Clean up temporary files
  try {
    fs.unlinkSync(requestFile);
    fs.unlinkSync(responseFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Clean up Docker image
  try {
    execSync(`docker rmi ${dockerImageName}`, { stdio: 'ignore' });
  } catch (e) {
    console.error('Failed to remove Docker image:', e.message);
  }
}

console.log('\nDocker test completed successfully!'); 