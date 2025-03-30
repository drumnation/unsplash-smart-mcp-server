#!/usr/bin/env tsx

import { Client } from '@modelcontextprotocol/sdk';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/dist/esm/client/stdio.js';

/**
 * A simple test script to verify that the Unsplash MCP server is working
 */
async function main() {
  console.log('Initializing Unsplash MCP client...');
  
  // Create a client
  const client = new Client({
    name: 'Unsplash MCP Test',
    version: '1.0.0',
  });

  // Connect to the server
  console.log('Connecting to Unsplash MCP server...');
  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['/Users/dmieloch/Dev/singularityApps/mcp-servers/unsplash-mcp/src/server.ts']
  });
  await client.connect(transport);

  // Get the server info
  const serverInfo = client.serverInfo;
  console.log(`Connected to ${serverInfo.name} v${serverInfo.version}`);

  // List available tools
  const tools = client.tools;
  console.log('\nAvailable tools:');
  for (const tool of tools) {
    console.log(`- ${tool.name}: ${tool.description}`);
  }

  // Search for photos
  console.log('\nSearching for photos with query "mountains"...');
  try {
    const searchResult = await client.invokeTool('unsplashSearchPhotos', {
      query: 'mountains',
      page: 1,
      perPage: 3
    });
    
    const searchData = JSON.parse(searchResult);
    console.log(`Found ${searchData.total} photos. Showing ${searchData.photos.length} results:`);
    
    for (const photo of searchData.photos) {
      console.log(`- ${photo.description || 'No description'} (ID: ${photo.id})`);
      console.log(`  By: ${photo.photographer_name}`);
      console.log(`  Preview URL: ${photo.preview_url}`);
      console.log();
    }

    // Download the first photo
    if (searchData.photos.length > 0) {
      const photoId = searchData.photos[0].id;
      console.log(`\nDownloading photo with ID: ${photoId}...`);
      
      const downloadResult = await client.invokeTool('unsplashDownloadPhotoById', {
        photoId,
        downloadDirectory: './downloads'
      });
      
      const downloadData = JSON.parse(downloadResult);
      console.log(`Photo downloaded to: ${downloadData.filepath}`);
      console.log(`Attribution: ${downloadData.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Disconnect from the server
  await client.disconnect();
  console.log('\nDisconnected from server');
}

main().catch(console.error); 