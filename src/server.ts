import { FastMCP, UserError, type Context } from 'fastmcp';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from './config.js';
import { UnsplashClient } from './unsplashClient.js';
import { Photo } from './unsplashTypes.js';
import { AttributionManager } from './attributionManager.js';
import { MetadataManager } from './metadataManager.js';

// Create Unsplash client instance
const unsplashClient = new UnsplashClient();

// Set up attribution manager with a default path
const defaultAttributionDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.unsplash-mcp');
const attributionManager = new AttributionManager(defaultAttributionDir);
const metadataManager = new MetadataManager();

// Create FastMCP server instance
const server = new FastMCP({
  name: 'Unsplash MCP Server',
  version: '1.0.0'
});

// Define the stock_photo tool - combined search and download with smart features
server.addTool({
  name: 'stock_photo',
  description: 'Search and download professional stock photos from Unsplash. If no query is provided, the AI should determine an appropriate subject based on the purpose parameter and overall context. RECOMMENDED WORKFLOW: Use with downloadMode: "urls_only" to get URLs and directory commands, then use terminal to download - this avoids permission issues.',
  parameters: z.object({
    query: z.string().optional().describe('What to search for (AI will choose if not specified)'),
    purpose: z.string().optional().describe('Where the image will be used (e.g., hero, background, profile)'),
    count: z.number().int().min(1).max(10).optional().default(1).describe('Number of options to download'),
    orientation: z.enum(['any', 'landscape', 'portrait', 'square']).optional().default('any').describe('Preferred image orientation'),
    width: z.number().int().positive().optional().describe('Target width in pixels - images will be resized to this width'),
    height: z.number().int().positive().optional().describe('Target height in pixels - images will be resized to this height'),
    minWidth: z.number().int().positive().optional().describe('Minimum width for filtering results (separate from resizing)'),
    minHeight: z.number().int().positive().optional().describe('Minimum height for filtering results (separate from resizing)'),
    outputDir: z.string().optional().describe('Directory to save photos (defaults to ~/Downloads/stock-photos)'),
    projectType: z.enum(['next', 'react', 'vue', 'angular', 'generic']).optional().describe('Project type for automatic folder structure'),
    category: z.string().optional().describe('Logical category to organize images (e.g., "heroes", "backgrounds", "profiles", "products")'),
    downloadMode: z.enum(['auto', 'urls_only']).optional().default('urls_only').describe('Whether to download images (auto) or just return URLs (urls_only). RECOMMENDED: Use "urls_only" and follow the returned workflow instructions.')
  }),
  execute: async (args, { log }) => {
    // Determine search query if not provided
    if (!args.query) {
      args.query = determineAppropriateSubject(args.purpose);
      log.info(`No query provided. AI determined subject: "${args.query}" based on purpose: ${args.purpose || 'general'}`);
    }

    // URLs-only mode doesn't need output directory setup
    let outputDir = "";
    let categoryDir = "";
    let imagesDir = "";
    
    // Only set up directories if we're actually downloading
    if (args.downloadMode !== 'urls_only') {
      // Determine the best output directory based on context and parameters
      outputDir = determineOutputDirectory(args, log);
      log.info(`Using output directory: ${outputDir}`);
      
      // Determine the category folder (if applicable)
      categoryDir = outputDir;
      if (args.category) {
        categoryDir = path.join(outputDir, sanitizeFilename(args.category));
        log.info(`Using category directory: ${categoryDir}`);
      }
      
      // Ensure the output directory exists
      try {
        await fs.promises.mkdir(categoryDir, { recursive: true });
      } catch (error) {
        log.error(`Failed to create output directory: ${error instanceof Error ? error.message : String(error)}`);
        throw new UserError(`Failed to create output directory: ${error instanceof Error ? error.message : String(error)}. Try specifying an explicit outputDir parameter where you have write permissions, or use downloadMode: 'urls_only' to get URLs without downloading.`);
      }
    }

    // Improve search query construction to get more relevant results
    let searchQuery = args.query;
    if (args.orientation && args.orientation !== 'any') {
      // Don't add orientation to the query directly to avoid confusion
      // Instead use it only for filtering later
      log.info(`Will filter results for ${args.orientation} orientation`);
    }

    // Check if the query is about workspaces, offices or business environments
    // and enhance it with more precise terms
    if (searchQuery.toLowerCase().includes('workspace') || 
        searchQuery.toLowerCase().includes('office') || 
        searchQuery.toLowerCase().includes('desk') ||
        searchQuery.toLowerCase().includes('business')) {
      // Add specific terms to improve relevance for office/workspace queries
      searchQuery = `${searchQuery} interior`;
      log.info(`Enhanced office/workspace query to: "${searchQuery}"`);
    }

    log.info(`Searching Unsplash for "${searchQuery}" (${args.count} images)`);
    
    try {
      // Search for photos with more results to improve filtering
      const results = await unsplashClient.searchPhotos(
        searchQuery, 
        1, 
        Math.max(args.count * 10, 50) // Get more results for better filtering
      );
      
      if (results.total === 0) {
        throw new UserError(`No photos found matching "${searchQuery}"`);
      }
      
      log.info(`Found ${results.total} photos matching "${searchQuery}"`);
      
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
      
      // If doing a workspace/office query, apply additional content relevance filtering
      if (args.query.toLowerCase().includes('workspace') || 
          args.query.toLowerCase().includes('office') || 
          args.query.toLowerCase().includes('desk') ||
          args.query.toLowerCase().includes('business')) {
        
        // Look for workspace relevance signals in tags and descriptions
        const officeKeywords = ['office', 'desk', 'workspace', 'work', 'business', 'computer', 'laptop', 'interior'];
        const natureKeywords = ['mountain', 'nature', 'outdoor', 'landscape', 'tree', 'forest', 'lake'];
        
        // Score each image for relevance
        const scoredResults = filteredResults.map(photo => {
          let relevanceScore = 0;
          const description = (photo.description || photo.alt_description || '').toLowerCase();
          
          // Use type assertion for tags or create an empty array if not present
          const tags: Array<{title?: string}> = (photo as any).tags || [];
          
          // Check description for relevant terms
          officeKeywords.forEach(keyword => {
            if (description.includes(keyword)) relevanceScore += 2;
          });
          
          // Penalize nature images for office queries
          natureKeywords.forEach(keyword => {
            if (description.includes(keyword)) relevanceScore -= 3;
          });
          
          // Check tags for relevant terms if they exist
          tags.forEach((tag: {title?: string}) => {
            const tagName = tag.title ? tag.title.toLowerCase() : '';
            if (officeKeywords.some(k => tagName.includes(k))) relevanceScore += 3;
            if (natureKeywords.some(k => tagName.includes(k))) relevanceScore -= 4;
          });
          
          return { photo, relevanceScore };
        });
        
        // Sort by relevance score
        scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Take the most relevant results
        filteredResults = scoredResults
          .filter(item => item.relevanceScore >= 0) // Only take positively scored items
          .map(item => item.photo);
        
        log.info(`Applied workspace relevance filtering, found ${filteredResults.length} relevant images`);
      }
      
      // If no photos match the criteria, fall back to the original results
      if (filteredResults.length === 0) {
        log.warn(`No photos match the specified criteria. Using unfiltered results.`);
        filteredResults = results.results;
      }
      
      // Take only the requested number of photos
      const selectedPhotos = filteredResults.slice(0, args.count);
      
      // Initialize array to track photo information
      const photoInfoList = [];
      
      // If we're in auto download mode, handle the complete download workflow
      if (args.downloadMode === 'auto') {
        // Create a directory for this specific search if downloading multiple images
        imagesDir = categoryDir;
        const usePurposeSubfolder = args.purpose && !args.category;
        if ((args.count > 1 || usePurposeSubfolder) && !shouldUseOriginalFilenames(args)) {
          const subfolderName = usePurposeSubfolder ? 
            sanitizeFilename(args.purpose as string) : 
            sanitizeFilename(args.query);
          imagesDir = path.join(categoryDir, subfolderName);
          await fs.promises.mkdir(imagesDir, { recursive: true });
        }
        
        // Download photos
        for (let i = 0; i < selectedPhotos.length; i++) {
          const photo = selectedPhotos[i];
          
          // Generate appropriate filename based on context
          const fileName = generateFilename(photo, args, i);
          
          // Get the base URLs for download and preview
          let downloadUrl = photo.urls.full;
          let previewUrl = photo.urls.regular;
          
          // Apply dimensions by directly adding parameters to the URL
          if (args.width || args.height) {
            // Add width parameter if specified
            if (args.width) {
              downloadUrl += downloadUrl.includes('?') ? '&' : '?';
              downloadUrl += `w=${args.width}`;
              
              previewUrl += previewUrl.includes('?') ? '&' : '?';
              previewUrl += `w=${args.width}`;
            }
            
            // Add height parameter if specified
            if (args.height) {
              downloadUrl += downloadUrl.includes('?') ? '&' : '?';
              downloadUrl += `h=${args.height}`;
              
              previewUrl += previewUrl.includes('?') ? '&' : '?';
              previewUrl += `h=${args.height}`;
            }
            
            // Add fit parameter based on whether both dimensions are specified
            if (args.width && args.height) {
              downloadUrl += '&fit=crop';
              previewUrl += '&fit=crop';
            } else {
              downloadUrl += '&fit=max';
              previewUrl += '&fit=max';
            }
            
            log.info(`Applied resizing parameters: ${args.width ? `width=${args.width}` : ''}${args.height ? ` height=${args.height}` : ''}`);
          }
          
          log.info(`Downloading photo ${i + 1}/${selectedPhotos.length}: ${fileName}`);
          
          // Pass the modified URL to the download function
          let filePath = await unsplashClient.downloadPhoto(photo, imagesDir, fileName, downloadUrl);
          
          // Add to attribution database
          attributionManager.addAttribution(photo, filePath);
          
          // Add metadata to image if possible
          try {
            await metadataManager.addAttributionMetadata(filePath, photo);
          } catch (error) {
            log.warn(`Could not add EXIF metadata: ${error instanceof Error ? error.message : String(error)}`);
          }
          
          photoInfoList.push({
            id: photo.id,
            file_path: filePath,
            description: photo.description || photo.alt_description || 'No description',
            photographer: photo.user.name || photo.user.username,
            dimensions: `${photo.width}x${photo.height}`,
            target_dimensions: args.width && args.height ? `${args.width}x${args.height}` : 
                               args.width ? `${args.width}x(auto)` : 
                               args.height ? `(auto)x${args.height}` : `Original (${photo.width}x${photo.height})`,
            orientation: photo.width > photo.height ? 'landscape' : (photo.width < photo.height ? 'portrait' : 'square'),
            attribution: `Photo by ${photo.user.name || photo.user.username} on Unsplash`,
            url: previewUrl,
            download_url: downloadUrl,
            unsplash_url: photo.links.html,
            attribution_saved: true,
            metadata_added: true
          });
        }
        
        // Return result for auto download mode
        return JSON.stringify({
          query: args.query,
          purpose: args.purpose,
          output_directory: imagesDir,
          downloaded_photos: photoInfoList,
          message: `Successfully downloaded ${photoInfoList.length} photos to ${imagesDir}. IMPORTANT: Please include attribution "${photoInfoList.map(p => p.attribution).join('" or "')}" when using these images.`
        }, null, 2);
      } 
      // If we're in URLs-only mode, just return the URLs and photo information
      else {
        // Process photos without downloading
        for (let i = 0; i < selectedPhotos.length; i++) {
          const photo = selectedPhotos[i];
          
          // Generate appropriate filename based on context (for reference)
          const fileName = generateFilename(photo, args, i);
          
          // Get the base URLs for download and preview
          let downloadUrl = photo.urls.full;
          let previewUrl = photo.urls.regular;
          
          // Apply dimensions by directly adding parameters to the URL
          if (args.width || args.height) {
            // Add width parameter if specified
            if (args.width) {
              downloadUrl += downloadUrl.includes('?') ? '&' : '?';
              downloadUrl += `w=${args.width}`;
              
              previewUrl += previewUrl.includes('?') ? '&' : '?';
              previewUrl += `w=${args.width}`;
            }
            
            // Add height parameter if specified
            if (args.height) {
              downloadUrl += downloadUrl.includes('?') ? '&' : '?';
              downloadUrl += `h=${args.height}`;
              
              previewUrl += previewUrl.includes('?') ? '&' : '?';
              previewUrl += `h=${args.height}`;
            }
            
            // Add fit parameter based on whether both dimensions are specified
            if (args.width && args.height) {
              downloadUrl += '&fit=crop';
              previewUrl += '&fit=crop';
            } else {
              downloadUrl += '&fit=max';
              previewUrl += '&fit=max';
            }
            
            log.info(`Applied resizing parameters: ${args.width ? `width=${args.width}` : ''}${args.height ? ` height=${args.height}` : ''}`);
          }
          
          photoInfoList.push({
            id: photo.id,
            suggested_filename: fileName,
            description: photo.description || photo.alt_description || 'No description',
            photographer: photo.user.name || photo.user.username,
            dimensions: `${photo.width}x${photo.height}`,
            target_dimensions: args.width && args.height ? `${args.width}x${args.height}` : 
                               args.width ? `${args.width}x(auto)` : 
                               args.height ? `(auto)x${args.height}` : `Original (${photo.width}x${photo.height})`,
            orientation: photo.width > photo.height ? 'landscape' : (photo.width < photo.height ? 'portrait' : 'square'),
            attribution: `Photo by ${photo.user.name || photo.user.username} on Unsplash`,
            url: previewUrl,
            download_url: downloadUrl,
            unsplash_url: photo.links.html,
            curl_command: `curl -o "${fileName}" "${downloadUrl}" # Download required! Include attribution: Photo by ${photo.user.name || photo.user.username} on Unsplash`
          });
        }
        
        // For URLs-only mode, provide path suggestions without actually creating directories
        const suggestedPath = args.projectType ? 
          getProjectSuggestedPath(args) : 
          '~/Downloads/stock-photos';
        
        // Generate directory creation commands for the agent
        const mkdirCommands = generateDirectoryCreationCommands(args);
        
        // Update the return value for URL-only mode to include teaching instructions
        return JSON.stringify({
          query: args.query,
          purpose: args.purpose,
          mode: "urls_only",
          suggested_directory: suggestedPath,
          directory_setup_commands: mkdirCommands,
          found_photos: photoInfoList,
          download_commands: photoInfoList.map(p => p.curl_command),
          agent_workflow: {
            title: "Recommended Two-Step Workflow",
            description: "This workflow avoids permission issues by separating search from download.",
            steps: [
              {
                step: 1,
                title: "Create the directory structure",
                description: "First create the directories where you want to save the images",
                commands: mkdirCommands,
                explanation: "Creating folders first ensures your downloads have a valid destination"
              },
              {
                step: 2,
                title: "Download the images",
                description: "Use curl to download the images to their destination",
                commands: photoInfoList.map(p => p.curl_command),
                explanation: "curl requests download directly from Unsplash to your specified location"
              },
              {
                step: 3,
                title: "Use the downloaded images",
                description: "Reference the images in your project",
                code_examples: generateCodeExamples(args, photoInfoList)
              }
            ],
            best_practices: [
              "Always check if directories exist before downloading",
              "For multiple images, create category-specific directories", 
              "Remember to include attribution when using Unsplash images",
              "Use this 'urls_only' mode to avoid permission problems"
            ]
          },
          message: `Found ${photoInfoList.length} photos matching your search. Follow the agent_workflow steps to properly download and use these images. IMPORTANT: Please include attribution "${photoInfoList.map(p => p.attribution).join('" or "')}" when using these images.`
        }, null, 2);
      }
    } catch (error) {
      log.error(`Error processing stock photo request:`, error instanceof Error ? error.message : String(error));
      throw new UserError(`Failed to process stock photo request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

// Add the attribution tool
server.addTool({
  name: 'get_attributions',
  description: 'Retrieve attribution information for Unsplash photos used in the project',
  parameters: z.object({
    format: z.enum(['json', 'html', 'react']).default('json').describe('Output format for attribution data'),
    projectPath: z.string().optional().describe('Filter attributions to a specific project path'),
    outputPath: z.string().optional().describe('Where to save attribution files (HTML, React components)')
  }),
  execute: async (args, { log }) => {
    try {
      // Get attributions
      let attributions = args.projectPath 
        ? attributionManager.getAttributionsForProject(args.projectPath)
        : attributionManager.getAllAttributions();
        
      if (attributions.length === 0) {
        return JSON.stringify({
          count: 0,
          message: 'No attributions found in the database. Use the stock_photo tool to download images first.'
        }, null, 2);
      }
      
      // Default output paths
      const outputPathBase = args.outputPath || (args.projectPath || defaultAttributionDir);
      
      // Handle different formats
      switch (args.format) {
        case 'html': {
          const htmlOutputPath = path.join(outputPathBase, 'unsplash-attributions.html');
          attributionManager.saveAttributionHtml(htmlOutputPath, attributions);
          
          return JSON.stringify({
            count: attributions.length,
            format: 'html',
            outputPath: htmlOutputPath,
            message: `Generated HTML attribution file with ${attributions.length} entries at ${htmlOutputPath}`
          }, null, 2);
        }
        
        case 'react': {
          const reactOutputPath = path.join(outputPathBase, 'ImageAttribution.tsx');
          attributionManager.generateReactComponent(reactOutputPath);
          
          return JSON.stringify({
            count: attributions.length,
            format: 'react',
            outputPath: reactOutputPath,
            message: `Generated React component with ${attributions.length} attributions at ${reactOutputPath}`
          }, null, 2);
        }
        
        case 'json':
        default:
          return JSON.stringify({
            count: attributions.length,
            attributions: attributions,
            message: `Found ${attributions.length} attributions in the database`
          }, null, 2);
      }
    } catch (error) {
      log.error(`Error processing attribution request:`, error instanceof Error ? error.message : String(error));
      throw new UserError(`Failed to process attribution request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

// Generate directory creation commands based on arguments
function generateDirectoryCreationCommands(args: any): string[] {
  const commands = [];
  let basePath = '';
  
  if (args.projectType) {
    // Get project-specific path
    basePath = getProjectSuggestedPath(args);
    commands.push(`mkdir -p ${basePath}`);
  } else if (args.outputDir) {
    // Use specified output directory
    basePath = args.outputDir;
    commands.push(`mkdir -p ${basePath}`);
  } else {
    // Use default directory
    basePath = '~/Downloads/stock-photos';
    commands.push(`mkdir -p ${basePath}`);
  }
  
  // Add category subdirectory if specified
  if (args.category) {
    const categoryPath = `${basePath}/${sanitizeFilename(args.category)}`;
    commands.push(`mkdir -p ${categoryPath}`);
    basePath = categoryPath;
  }
  
  // Add purpose subdirectory if needed
  if (args.purpose && !args.category && (args.count > 1 || args.downloadMode === 'urls_only')) {
    const purposePath = `${basePath}/${sanitizeFilename(args.purpose)}`;
    commands.push(`mkdir -p ${purposePath}`);
  }
  
  return commands;
}

// Get suggested path for project types
function getProjectSuggestedPath(args: any): string {
  const projectTypePaths = {
    next: 'public/images',
    react: 'src/assets/images',
    vue: 'src/assets/images',
    angular: 'src/assets/images',
    generic: 'assets/images'
  };
  
  return projectTypePaths[args.projectType as keyof typeof projectTypePaths] || 'assets/images';
}

// Determine the best output directory based on context and parameters
function determineOutputDirectory(args: any, log: any): string {
  // If explicit output directory is provided, use it
  if (args.outputDir) {
    // Expand ~ to the home directory if present
    if (args.outputDir.startsWith('~')) {
      return path.join(os.homedir(), args.outputDir.substring(1));
    }
    return args.outputDir;
  }
  
  // If project type is specified, use appropriate project structure
  if (args.projectType) {
    const cwd = process.cwd();
    
    switch (args.projectType) {
      case 'next':
        // Create in the public/images folder for Next.js
        return path.join(cwd, 'public', 'images');
        
      case 'react':
        // For React, typically in src/assets/images
        return path.join(cwd, 'src', 'assets', 'images');
        
      case 'vue':
        // For Vue, typically in public/assets/images or src/assets/images
        return path.join(cwd, 'src', 'assets', 'images');
        
      case 'angular':
        // For Angular, typically in src/assets/images
        return path.join(cwd, 'src', 'assets', 'images');
        
      default:
        // Generic project structure
        return path.join(cwd, 'assets', 'images');
    }
  }

  // Fallback to user's Downloads folder as default
  return path.join(os.homedir(), 'Downloads', 'stock-photos');
}

// Generate appropriate filename based on context
function generateFilename(photo: any, args: any, index: number): string {
  // For project contexts, use more predictable filenames
  if (args.projectType) {
    const purpose = args.purpose ? sanitizeFilename(args.purpose) : 'image';
    const basePrefix = args.query ? sanitizeFilename(args.query) : purpose;
    
    // If multiple images, add index
    const suffix = args.count > 1 ? `_${index + 1}` : '';
    
    return `${basePrefix}${suffix}.jpg`;
  }
  
  // For normal downloads, include the Unsplash ID for uniqueness
  const suffix = args.count > 1 ? `_${index + 1}` : '';
  const fileName = `${sanitizeFilename(args.query)}${suffix}_${photo.id}.jpg`;
  
  return fileName;
}

// Determine if we should use more original filenames (mainly for project contexts)
function shouldUseOriginalFilenames(args: any): boolean {
  return !!args.projectType;
}

// Helper function to determine appropriate subject based on purpose
function determineAppropriateSubject(purpose?: string): string {
  if (!purpose) return 'professional background';
  
  purpose = purpose.toLowerCase();
  
  // Common purpose-to-subject mappings
  if (purpose.includes('hero') || purpose.includes('banner')) {
    return 'professional landscape wide angle';
  }
  
  if (purpose.includes('background')) {
    return 'abstract texture';
  }
  
  if (purpose.includes('profile') || purpose.includes('avatar')) {
    return 'professional headshot portrait';
  }
  
  if (purpose.includes('product')) {
    return 'minimal product photography';
  }
  
  if (purpose.includes('team')) {
    return 'professional team meeting';
  }
  
  if (purpose.includes('contact')) {
    return 'office contact communication';
  }
  
  if (purpose.includes('blog') || purpose.includes('article')) {
    return 'relevant topic illustration';
  }
  
  if (purpose.includes('about')) {
    return 'office workspace professional';
  }
  
  if (purpose.includes('services')) {
    return 'professional service offering';
  }
  
  // For other purposes, use a generic professional image
  return 'professional business image';
}

// Helper function to sanitize filenames
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

// Add a new helper function to generate code examples
function generateCodeExamples(args: any, photos: any[]): any[] {
  if (!args.projectType || photos.length === 0) return [];
  
  const examples = [];
  const photo = photos[0]; // Use the first photo for examples
  const fileName = photo.suggested_filename;
  let suggestedPath = getProjectSuggestedPath(args);
  
  if (args.category) {
    suggestedPath = `${suggestedPath}/${sanitizeFilename(args.category)}`;
  }
  
  const imagePath = `${suggestedPath}/${fileName}`;
  
  switch (args.projectType) {
    case 'next':
      examples.push({
        language: "jsx",
        description: "Next.js Image component usage",
        code: `import Image from 'next/image';\n\n<Image\n  src="/${imagePath.replace('public/', '')}"\n  alt="${args.purpose || 'Image from Unsplash'}" \n  width={800} \n  height={600} \n  // Photo by ${photo.photographer} on Unsplash\n/>`
      });
      break;
      
    case 'react':
      examples.push({
        language: "jsx",
        description: "React image usage",
        code: `// Photo by ${photo.photographer} on Unsplash\n<img\n  src="${imagePath}"\n  alt="${args.purpose || 'Image from Unsplash'}"\n  className="your-image-class"\n/>`
      });
      break;
      
    case 'vue':
      examples.push({
        language: "vue",
        description: "Vue.js image usage",
        code: `<!-- Photo by ${photo.photographer} on Unsplash -->\n<img\n  :src="require('@/${imagePath}')"\n  :alt="'${args.purpose || 'Image from Unsplash'}'"\n  class="your-image-class"\n/>`
      });
      break;
      
    case 'angular':
      examples.push({
        language: "html",
        description: "Angular image usage",
        code: `<!-- Photo by ${photo.photographer} on Unsplash -->\n<img\n  [src]="'${imagePath}'"\n  [alt]="'${args.purpose || 'Image from Unsplash'}'"\n  class="your-image-class"\n>`
      });
      break;
      
    default:
      examples.push({
        language: "html",
        description: "Basic HTML image usage",
        code: `<!-- Photo by ${photo.photographer} on Unsplash -->\n<img src="${imagePath}" alt="${args.purpose || 'Image from Unsplash'}">`
      });
  }
  
  return examples;
}