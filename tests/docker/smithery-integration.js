#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import assert from 'assert';

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
const dockerImageName = `unsplash-mcp-smithery-test-${Date.now()}`;

console.log('======= UNSPLASH MCP SERVER SMITHERY INTEGRATION TEST =======');

// First, validate that the required files exist
console.log('Validating required Smithery files...');
const dockerfilePath = path.join(rootDir, 'Dockerfile');
const smitheryYamlPath = path.join(rootDir, 'smithery.yaml');

if (!fs.existsSync(dockerfilePath)) {
  console.error('❌ Dockerfile not found at', dockerfilePath);
  process.exit(1);
}

if (!fs.existsSync(smitheryYamlPath)) {
  console.error('❌ smithery.yaml not found at', smitheryYamlPath);
  process.exit(1);
}

console.log('✅ Required files found');

// Validate the smithery.yaml file content
console.log('Validating smithery.yaml content...');
try {
  const smitheryYamlContent = fs.readFileSync(smitheryYamlPath, 'utf8');
  const smitheryConfig = yaml.parse(smitheryYamlContent);

  // Check required fields
  assert.strictEqual(smitheryConfig.startCommand.type, 'stdio', 'startCommand.type should be "stdio"');
  assert.ok(smitheryConfig.startCommand.configSchema, 'configSchema should be defined');
  assert.ok(smitheryConfig.startCommand.configSchema.properties.UNSPLASH_ACCESS_KEY, 'UNSPLASH_ACCESS_KEY should be defined in configSchema');
  assert.strictEqual(smitheryConfig.startCommand.configSchema.required[0], 'UNSPLASH_ACCESS_KEY', 'UNSPLASH_ACCESS_KEY should be in required array');
  assert.ok(smitheryConfig.startCommand.commandFunction, 'commandFunction should be defined');

  console.log('✅ smithery.yaml content is valid');
} catch (error) {
  console.error('❌ Failed to validate smithery.yaml:', error.message);
  process.exit(1);
}

// Build the Docker image using the Dockerfile
console.log('Building Docker image...');
try {
  execSync(`docker build -t ${dockerImageName} ${rootDir}`, { 
    stdio: 'inherit' 
  });
  
  console.log('✅ Docker image built successfully!');
} catch (error) {
  console.error('❌ Failed to build Docker image:', error.message);
  process.exit(1);
}

// Create temporary files for requests/responses
const pingRequestFile = path.join(os.tmpdir(), `mcp-ping-request-${Date.now()}.json`);
const pingResponseFile = path.join(os.tmpdir(), `mcp-ping-response-${Date.now()}.json`);
const toolRequestFile = path.join(os.tmpdir(), `mcp-tool-request-${Date.now()}.json`);
const toolResponseFile = path.join(os.tmpdir(), `mcp-tool-response-${Date.now()}.json`);

try {
  // Test 1: Ping test
  console.log('\nTesting ping response...');
  
  // Create ping request
  const pingRequest = {
    jsonrpc: '2.0',
    method: 'ping',
    id: 123
  };
  
  // Write request to file
  fs.writeFileSync(pingRequestFile, JSON.stringify(pingRequest));
  
  // Run Docker with ping request
  execSync(`cat ${pingRequestFile} | docker run -i --rm -e UNSPLASH_ACCESS_KEY=${apiKey} -e NODE_ENV=production ${dockerImageName} > ${pingResponseFile}`, {
    stdio: ['inherit', 'inherit', 'inherit'],
    timeout: 10000 // 10 second timeout
  });
  
  // Read and validate ping response
  const pingResponseContent = fs.readFileSync(pingResponseFile, 'utf8');
  console.log('Ping response:', pingResponseContent);
  
  const pingResponse = JSON.parse(pingResponseContent);
  assert.strictEqual(pingResponse.jsonrpc, '2.0', 'Response should use JSON-RPC 2.0');
  assert.strictEqual(pingResponse.id, 123, 'Response ID should match request ID');
  assert.strictEqual(pingResponse.result, 'pong', 'Ping should return "pong"');
  
  console.log('✅ Ping test successful');
  
  // Test 2: Tool invocation
  console.log('\nTesting tool invocation...');
  
  // Create tool request
  const toolRequest = {
    jsonrpc: '2.0',
    method: 'tool/invoke',
    id: 456,
    params: {
      name: 'get_attributions',
      args: {
        format: 'json'
      }
    }
  };
  
  // Write request to file
  fs.writeFileSync(toolRequestFile, JSON.stringify(toolRequest));
  
  // Run Docker with tool request
  execSync(`cat ${toolRequestFile} | docker run -i --rm -e UNSPLASH_ACCESS_KEY=${apiKey} -e NODE_ENV=production ${dockerImageName} > ${toolResponseFile}`, {
    stdio: ['inherit', 'inherit', 'inherit'],
    timeout: 10000 // 10 second timeout
  });
  
  // Read and validate tool response
  const toolResponseContent = fs.readFileSync(toolResponseFile, 'utf8');
  console.log('Tool response preview:', toolResponseContent.substring(0, 200) + '...');
  
  const toolResponse = JSON.parse(toolResponseContent);
  assert.strictEqual(toolResponse.jsonrpc, '2.0', 'Response should use JSON-RPC 2.0');
  assert.strictEqual(toolResponse.id, 456, 'Response ID should match request ID');
  assert.ok(toolResponse.result, 'Response should have a result');
  assert.ok(typeof toolResponse.result.count !== 'undefined', 'Result should include count');
  assert.ok(Array.isArray(toolResponse.result.attributions), 'Result should include attributions array');
  
  console.log('✅ Tool invocation test successful');
  console.log('\n✅ All Smithery integration tests passed!');
  
} catch (error) {
  console.error('❌ Smithery integration test failed:', error.message);
  process.exit(1);
} finally {
  // Clean up temporary files
  try {
    if (fs.existsSync(pingRequestFile)) fs.unlinkSync(pingRequestFile);
    if (fs.existsSync(pingResponseFile)) fs.unlinkSync(pingResponseFile);
    if (fs.existsSync(toolRequestFile)) fs.unlinkSync(toolRequestFile);
    if (fs.existsSync(toolResponseFile)) fs.unlinkSync(toolResponseFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Clean up Docker image
  try {
    execSync(`docker rmi ${dockerImageName}`, { stdio: 'ignore' });
    console.log('\nCleanup completed.');
  } catch (e) {
    console.error('Failed to remove Docker image:', e.message);
  }
} 