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

// Unique image and container names for this test
const dockerImageName = `unsplash-mcp-uptime-test-${Date.now()}`;
const containerName = `unsplash-mcp-container-${Date.now()}`;

console.log('======= UNSPLASH MCP SERVER DOCKER UPTIME TEST =======');
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

// Function to sleep for specified milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the container in detached mode
console.log('\nStarting Docker container in detached mode...');
try {
  execSync(`docker run -d --name ${containerName} -e UNSPLASH_ACCESS_KEY=${apiKey} ${dockerImageName}`, {
    stdio: 'inherit'
  });
  console.log(`\n✅ Container ${containerName} started successfully`);
} catch (error) {
  console.error('\n❌ Failed to start Docker container:', error.message);
  process.exit(1);
}

// Function to verify if container is still running
function isContainerRunning() {
  try {
    const status = execSync(`docker inspect -f {{.State.Status}} ${containerName}`, { 
      encoding: 'utf8'
    }).trim();
    return status === 'running';
  } catch (error) {
    console.error('Error checking container status:', error.message);
    return false;
  }
}

// Function to get container uptime in seconds
function getContainerUptime() {
  try {
    const startTimeStr = execSync(
      `docker inspect -f '{{.State.StartedAt}}' ${containerName}`, 
      { encoding: 'utf8' }
    ).trim().replace(/'/g, '');
    
    const startTime = new Date(startTimeStr);
    const uptime = (new Date() - startTime) / 1000; // Convert to seconds
    return uptime;
  } catch (error) {
    console.error('Error getting container uptime:', error.message);
    return -1;
  }
}

// Function to check container logs for errors
function hasErrorInLogs() {
  try {
    const logs = execSync(`docker logs ${containerName}`, { encoding: 'utf8' });
    const errorIndicators = [
      'Error:', 
      'error:', 
      'Uncaught Exception', 
      'Fatal Error', 
      'exited with code'
    ];
    
    return errorIndicators.some(indicator => logs.includes(indicator));
  } catch (error) {
    console.error('Error checking container logs:', error.message);
    return true;
  }
}

// Main test function
async function runUptimeTest() {
  try {
    // Check immediately after startup
    console.log('\nVerifying container is running immediately after start...');
    
    if (!isContainerRunning()) {
      throw new Error('Container is not running immediately after startup');
    }
    console.log('✅ Container is running after startup');
    
    // Wait 5 seconds and check again
    console.log('\nWaiting 5 seconds to verify container stays up...');
    await sleep(5000);
    
    if (!isContainerRunning()) {
      throw new Error('Container stopped after 5 seconds');
    }
    const uptime1 = getContainerUptime();
    console.log(`✅ Container is still running after 5 seconds (uptime: ${uptime1.toFixed(1)} seconds)`);
    
    // Wait 10 more seconds
    console.log('\nWaiting 10 more seconds to further verify uptime...');
    await sleep(10000);
    
    if (!isContainerRunning()) {
      throw new Error('Container stopped after 15 seconds');
    }
    const uptime2 = getContainerUptime();
    console.log(`✅ Container is still running after 15 seconds (uptime: ${uptime2.toFixed(1)} seconds)`);
    
    // Check for errors in logs
    if (hasErrorInLogs()) {
      console.warn('⚠️ Warning: Error indicators found in container logs');
    } else {
      console.log('✅ No error indicators found in container logs');
    }
    
    // Make a final verification with a longer wait
    console.log('\nWaiting 30 more seconds for final verification...');
    await sleep(30000);
    
    if (!isContainerRunning()) {
      throw new Error('Container stopped after 45 seconds');
    }
    const uptime3 = getContainerUptime();
    console.log(`✅ Container is still running after 45 seconds (uptime: ${uptime3.toFixed(1)} seconds)`);
    
    console.log('\n✅ SUCCESS! The server remained up through all test intervals.');
    
    // Print the container logs for verification
    console.log('\nContainer logs:');
    try {
      const logs = execSync(`docker logs ${containerName}`, { encoding: 'utf8' });
      console.log(logs || '(No logs output)');
    } catch (error) {
      console.warn('⚠️ Could not retrieve container logs:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Uptime test failed:', error.message);
    return false;
  }
}

// Run the test and clean up
runUptimeTest()
  .then(success => {
    // Clean up Docker container and image
    console.log('\nCleaning up Docker resources...');
    try {
      execSync(`docker stop ${containerName}`, { stdio: 'ignore' });
      execSync(`docker rm ${containerName}`, { stdio: 'ignore' });
      execSync(`docker rmi ${dockerImageName}`, { stdio: 'ignore' });
      console.log('✅ Clean up successful');
    } catch (e) {
      console.error('Warning: Failed to clean up some Docker resources:', e.message);
    }
    
    process.exit(success ? 0 : 1);
  }); 