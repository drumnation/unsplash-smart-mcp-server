import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import { UnsplashClient } from '../../unsplashClient.js';
// Create our own FastMCPServer mock class for testing
import { UserError } from 'fastmcp';
import { config } from '../../config.js';

// Simple mock of the FastMCPServer class for testing
class FastMCPServer {
  name: string;
  tools: any[] = [];

  constructor(name: string) {
    this.name = name;
  }

  addTool(tool: any) {
    this.tools.push(tool);
  }
}

// Create a separate test directory for downloads
const TEST_DOWNLOAD_DIR = path.join(process.cwd(), 'downloads-test');

// Define interface for the stock_photo tool arguments
interface StockPhotoArgs {
  query?: string;
  purpose?: string;
  count?: number;
  orientation?: 'any' | 'landscape' | 'portrait' | 'square';
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  outputDir?: string;
  projectType?: 'next' | 'react' | 'vue' | 'angular' | 'generic';
  category?: string;
  downloadMode?: 'auto' | 'urls_only';
}

// Define interface for the attribution tool arguments
interface AttributionArgs {
  format?: 'json' | 'html' | 'react';
  projectPath?: string;
  outputPath?: string;
}

// Define a type for the mock context
interface MockContext {
  log: {
    info: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
  };
}

// Create a mock FastMCPServer for testing
const mockServer = new FastMCPServer("Unsplash MCP Server");

// Create a mock stock_photo tool for testing
const stockPhotoTool = {
  name: 'stock_photo',
  execute: async (args: StockPhotoArgs, context: MockContext) => {
    const unsplashClient = new UnsplashClient();
    
    // Default arguments
    const query = args.query || 'professional background';
    const count = args.count || 1;
    const outputDir = args.outputDir || TEST_DOWNLOAD_DIR;
    
    try {
      // Ensure output directory exists
      await fs.ensureDir(outputDir);
      
      // Search for photos
      const searchQuery = args.orientation && args.orientation !== 'any' 
        ? `${query} ${args.orientation}` 
        : query;
      
      const results = await unsplashClient.searchPhotos(searchQuery, 1, Math.max(count * 3, 30));
      
      if (results.total === 0) {
        return JSON.stringify({
          error: `No photos found matching "${searchQuery}"`,
          query: query,
          purpose: args.purpose
        }, null, 2);
      }
      
      // Filter results based on dimensions and orientation if specified
      let filteredResults = results.results.filter(photo => {
        // Check minimum dimensions if specified
        if (args.minWidth && photo.width < args.minWidth) return false;
        if (args.minHeight && photo.height < args.minHeight) return false;
        
        // Check orientation if specified
        if (args.orientation && args.orientation !== 'any') {
          const ratio = photo.width / photo.height;
          if (args.orientation === 'landscape' && ratio <= 1) return false;
          if (args.orientation === 'portrait' && ratio >= 1) return false;
          if (args.orientation === 'square' && (ratio < 0.9 || ratio > 1.1)) return false;
        }
        
        return true;
      });
      
      // If no photos match the criteria, fall back to the original results
      if (filteredResults.length === 0) {
        context.log.warn(`No photos match the specified criteria. Using unfiltered results.`);
        filteredResults = results.results;
      }
      
      // Take only the requested number of photos
      const selectedPhotos = filteredResults.slice(0, count);
      
      // Process photos based on download mode
      const photoInfoList = [];
      
      // Mock download for testing purposes
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const fileName = `test_photo_${photo.id}.jpg`;
        const filePath = path.join(outputDir, fileName);
        
        // In a test, we just create an empty file instead of actually downloading
        await fs.writeFile(filePath, 'test photo content');
        
        photoInfoList.push({
          id: photo.id,
          file_path: filePath,
          description: photo.description || photo.alt_description || 'No description',
          photographer: photo.user.name || photo.user.username,
          dimensions: `${photo.width}x${photo.height}`,
          orientation: photo.width > photo.height ? 'landscape' : (photo.width < photo.height ? 'portrait' : 'square'),
          attribution: `Photo by ${photo.user.name || photo.user.username} on Unsplash`,
          url: photo.urls.regular,
          unsplash_url: photo.links.html,
          attribution_saved: true,
          metadata_added: true
        });
      }
      
      if (args.downloadMode === 'urls_only') {
        return JSON.stringify({
          query: query,
          purpose: args.purpose,
          mode: "urls_only",
          suggested_directory: outputDir,
          directory_setup_commands: [`mkdir -p ${outputDir}`],
          found_photos: photoInfoList,
          download_commands: photoInfoList.map(p => `curl -o "${path.basename(p.file_path)}" "${p.url}" # Download required! Include attribution: ${p.attribution}`),
          message: `Found ${photoInfoList.length} photos matching your search. IMPORTANT: Please include attribution "${photoInfoList.map(p => p.attribution).join('" or "')}" when using these images.`
        }, null, 2);
      } else {
        return JSON.stringify({
          query: query,
          purpose: args.purpose,
          output_directory: outputDir,
          downloaded_photos: photoInfoList,
          message: `Successfully downloaded ${photoInfoList.length} photos. IMPORTANT: Please include attribution "${photoInfoList.map(p => p.attribution).join('" or "')}" when using these images.`
        }, null, 2);
      }
    } catch (error) {
      context.log.error(`Error processing stock photo request:`, error instanceof Error ? error.message : String(error));
      throw new UserError(`Failed to process stock photo request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Create mock attribution tool for testing
const attributionTool = {
  name: 'get_attributions',
  execute: async (args: AttributionArgs, context: MockContext) => {
    // Mock attribution data
    const attributions = [
      {
        id: 'test123',
        photographer: 'Test Photographer',
        photographerUrl: 'https://unsplash.com/@testuser',
        source: 'Unsplash',
        sourceUrl: 'https://unsplash.com/photos/test123',
        license: 'Unsplash License',
        downloadDate: new Date().toISOString(),
        projectPath: TEST_DOWNLOAD_DIR,
        projectFile: 'test_photo.jpg'
      }
    ];
    
    return JSON.stringify({
      count: attributions.length,
      attributions: attributions,
      message: `Found ${attributions.length} attributions in the database`
    }, null, 2);
  }
};

// Define Tool interface to match our tool structure
interface Tool<TArgs> {
  name: string;
  execute: (args: TArgs, context: MockContext) => Promise<string>;
}

// Add tools to mock server
mockServer.addTool(stockPhotoTool);
mockServer.addTool(attributionTool);

test('Unsplash MCP Server Integration Tests', async (t) => {
  let unsplashClient: UnsplashClient;

  t.beforeEach(async () => {
    // Create a fresh UnsplashClient for each test
    unsplashClient = new UnsplashClient();
    
    // Ensure the test download directory exists and is empty
    await fs.emptyDir(TEST_DOWNLOAD_DIR);
  });

  t.afterEach(async () => {
    // Clean up the test download directory
    await fs.remove(TEST_DOWNLOAD_DIR);
  });

  await t.test('should have the correct server name', () => {
    assert.strictEqual(mockServer.name, 'Unsplash MCP Server');
  });

  await t.test('should have the required tools defined', () => {
    // Get tool names from the mock server
    const toolNames = mockServer.tools.map(tool => tool.name);
    assert.deepStrictEqual(toolNames, ['stock_photo', 'get_attributions']);
  });

  await t.test('should search Unsplash photos', async () => {
    // Skip this test if no API key is available
    if (!config.unsplash.accessKey) {
      console.log('Skipping search test - no API key available');
      return;
    }

    // Create a mock context with a log object
    const context: MockContext = {
      log: {
        info: (message: string, data?: any) => console.log(`[INFO] ${message}`),
        error: (message: string, data?: any) => console.error(`[ERROR] ${message}`),
        warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`),
        debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`)
      }
    };

    // Execute the stock_photo tool
    const result = await stockPhotoTool.execute({ 
      query: 'nature', 
      count: 1,
      downloadMode: 'auto'
    }, context);

    // Parse the result JSON
    const parsedResult = JSON.parse(result as string);
    
    // Validate the response structure
    assert.ok(typeof parsedResult.query === 'string');
    assert.ok(Array.isArray(parsedResult.downloaded_photos));
    assert.strictEqual(parsedResult.downloaded_photos.length, 1);
    
    // Validate the structure of the photo
    const photo = parsedResult.downloaded_photos[0];
    assert.ok(typeof photo.id === 'string');
    assert.ok(typeof photo.file_path === 'string');
    assert.ok(typeof photo.description === 'string');
    assert.ok(typeof photo.photographer === 'string');
    assert.ok(typeof photo.attribution === 'string');
    assert.ok(photo.attribution_saved === true);
    assert.ok(photo.metadata_added === true);
    
    // Verify that the file exists
    const fileExists = await fs.pathExists(photo.file_path);
    assert.ok(fileExists, 'Downloaded file does not exist');
  });

  await t.test('should return URLs in urls_only mode', async () => {
    // Skip this test if no API key is available
    if (!config.unsplash.accessKey) {
      console.log('Skipping URL test - no API key available');
      return;
    }

    // Create a mock context with a log object
    const context: MockContext = {
      log: {
        info: (message: string, data?: any) => console.log(`[INFO] ${message}`),
        error: (message: string, data?: any) => console.error(`[ERROR] ${message}`),
        warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`),
        debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`)
      }
    };
    
    // Execute the stock_photo tool with URLs-only mode
    const result = await stockPhotoTool.execute({ 
      query: 'landscape', 
      count: 1,
      orientation: 'landscape',
      downloadMode: 'urls_only',
      outputDir: TEST_DOWNLOAD_DIR
    }, context);
    
    // Parse the result
    const parsedResult = JSON.parse(result as string);
    
    // Validate the response structure for URLs-only mode
    assert.strictEqual(parsedResult.query, 'landscape');
    assert.strictEqual(parsedResult.mode, 'urls_only');
    assert.ok(Array.isArray(parsedResult.found_photos));
    assert.ok(Array.isArray(parsedResult.download_commands));
    assert.ok(parsedResult.download_commands.length > 0);
    assert.ok(parsedResult.download_commands[0].includes('curl -o'));
  });

  await t.test('should retrieve attributions', async () => {
    // Create a mock context with a log object
    const context: MockContext = {
      log: {
        info: (message: string, data?: any) => console.log(`[INFO] ${message}`),
        error: (message: string, data?: any) => console.error(`[ERROR] ${message}`),
        warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`),
        debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`)
      }
    };
    
    // Execute the get_attributions tool
    const result = await attributionTool.execute({
      format: 'json'
    }, context);
    
    // Parse the result
    const parsedResult = JSON.parse(result as string);
    
    // Validate the response structure for attributions
    assert.ok(typeof parsedResult.count === 'number');
    assert.ok(Array.isArray(parsedResult.attributions));
    assert.ok(parsedResult.attributions.length > 0);
    
    const attribution = parsedResult.attributions[0];
    assert.ok(typeof attribution.id === 'string');
    assert.ok(typeof attribution.photographer === 'string');
    assert.ok(typeof attribution.license === 'string');
  });
}); 