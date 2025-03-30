#!/usr/bin/env tsx

/**
 * Attribution Generator Script
 * 
 * This script generates attribution files for Unsplash images used in your project.
 * 
 * Usage:
 *   npm run generate-attributions -- [options]
 * 
 * Options:
 *   --format <format>       Output format (json, html, react) [default: html]
 *   --project-path <path>   Filter attributions to specific project path
 *   --output-path <path>    Where to save attribution files
 *   --extract-metadata      Extract metadata from images in project-path
 *   --help                  Show this help message
 */

import { AttributionManager } from '../src/attributionManager.js';
import { MetadataManager } from '../src/metadataManager.js';
import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';

// Parse command line arguments
const args = process.argv.slice(2);
let format = 'html';
let projectPath = '';
let outputPath = '';
let extractMetadata = false;

// Simple argument parser
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--help') {
    showHelp();
    process.exit(0);
  } else if (arg === '--format' && i + 1 < args.length) {
    format = args[++i];
    if (!['json', 'html', 'react'].includes(format)) {
      console.error(`Error: Invalid format '${format}'. Must be one of: json, html, react`);
      process.exit(1);
    }
  } else if (arg === '--project-path' && i + 1 < args.length) {
    projectPath = args[++i];
  } else if (arg === '--output-path' && i + 1 < args.length) {
    outputPath = args[++i];
  } else if (arg === '--extract-metadata') {
    extractMetadata = true;
  } else {
    console.error(`Error: Unknown argument '${arg}'`);
    showHelp();
    process.exit(1);
  }
}

// Set up attribution manager with a default path
const defaultAttributionDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.unsplash-mcp');
const attributionManager = new AttributionManager(defaultAttributionDir);

// Main function
async function main() {
  console.log('Unsplash Attribution Generator');
  console.log('==============================');
  
  // Extract metadata from images if requested
  if (extractMetadata && projectPath) {
    await extractImagesMetadata(projectPath);
  }
  
  // Get attributions
  const attributions = projectPath 
    ? attributionManager.getAttributionsForProject(projectPath)
    : attributionManager.getAllAttributions();
    
  if (attributions.length === 0) {
    console.log('No attributions found in the database. Have you used the MCP tool to download images?');
    return;
  }
  
  console.log(`Found ${attributions.length} attributions.`);
  
  // Default output paths
  const outputPathBase = outputPath || (projectPath || defaultAttributionDir);
  
  // Handle different formats
  switch (format) {
    case 'html': {
      const htmlOutputPath = path.join(outputPathBase, 'unsplash-attributions.html');
      attributionManager.saveAttributionHtml(htmlOutputPath, attributions);
      console.log(`Generated HTML attribution file at: ${htmlOutputPath}`);
      break;
    }
    
    case 'react': {
      const reactOutputPath = path.join(outputPathBase, 'ImageAttribution.tsx');
      attributionManager.generateReactComponent(reactOutputPath);
      console.log(`Generated React component at: ${reactOutputPath}`);
      break;
    }
    
    case 'json':
    default: {
      const jsonOutputPath = path.join(outputPathBase, 'unsplash-attributions.json');
      fs.writeFileSync(jsonOutputPath, JSON.stringify({ attributions }, null, 2));
      console.log(`Generated JSON attribution file at: ${jsonOutputPath}`);
      break;
    }
  }
  
  console.log('Attribution generation complete!');
}

// Extract metadata from all images in directory
async function extractImagesMetadata(dirPath: string): Promise<void> {
  console.log(`Scanning for images in: ${dirPath}`);
  
  const metadataManager = new MetadataManager();
  
  try {
    // Find all image files
    const imageFiles = glob.sync(path.join(dirPath, '**/*.{jpg,jpeg,png,gif}'));
    console.log(`Found ${imageFiles.length} images.`);
    
    // Extract metadata from each image
    for (const imagePath of imageFiles) {
      try {
        const metadata = await metadataManager.extractAttributionMetadata(imagePath);
        
        // If we found attribution data in metadata, log it
        if (metadata.identifier) {
          console.log(`Found attribution data in: ${path.relative(dirPath, imagePath)}`);
        }
      } catch (error) {
        console.error(`Error processing ${imagePath}:`, error);
      }
    }
    
    // Clean up
    await metadataManager.close();
    
  } catch (error) {
    console.error('Error scanning images:', error);
  }
}

// Show help message
function showHelp(): void {
  console.log(`
Unsplash Attribution Generator

Usage:
  npm run generate-attributions -- [options]

Options:
  --format <format>       Output format (json, html, react) [default: html]
  --project-path <path>   Filter attributions to specific project path
  --output-path <path>    Where to save attribution files
  --extract-metadata      Extract metadata from images in project-path
  --help                  Show this help message
`);
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 