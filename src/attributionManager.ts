import fs from 'fs-extra';
import path from 'path';
import { Photo } from './unsplashTypes.js';

// Define interfaces for attribution data
export interface Attribution {
  id: string;
  photographer: string;
  photographerUrl?: string;
  source: string;
  sourceUrl: string;
  license: string;
  downloadDate: string;
  projectPath?: string;
  projectFile?: string;
}

export interface AttributionDatabase {
  attributions: Record<string, Attribution>;
  version: string;
}

export class AttributionManager {
  private dbPath: string;
  private db: AttributionDatabase;
  
  constructor(dbDirectory: string) {
    // Create the attribution database in the specified directory
    this.dbPath = path.join(dbDirectory, 'unsplash-attributions.json');
    
    // Initialize or load the database
    this.db = this.loadDatabase();
  }
  
  private loadDatabase(): AttributionDatabase {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(data) as AttributionDatabase;
      }
    } catch (error) {
      console.warn(`Could not load attribution database: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Return empty database if file doesn't exist or can't be parsed
    return {
      attributions: {},
      version: '1.0.0'
    };
  }
  
  private saveDatabase(): void {
    try {
      // Ensure the directory exists
      fs.ensureDirSync(path.dirname(this.dbPath));
      
      // Save the database
      fs.writeFileSync(
        this.dbPath, 
        JSON.stringify(this.db, null, 2), 
        'utf8'
      );
    } catch (error) {
      console.error(`Error saving attribution database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  public addAttribution(photo: Photo, filePath: string): Attribution {
    const photographer = photo.user.name || photo.user.username;
    
    const attribution: Attribution = {
      id: photo.id,
      photographer,
      photographerUrl: `https://unsplash.com/@${photo.user.username}`,
      source: 'Unsplash',
      sourceUrl: photo.links.html,
      license: 'Unsplash License',
      downloadDate: new Date().toISOString(),
      projectPath: path.dirname(filePath),
      projectFile: path.basename(filePath)
    };
    
    // Add to database
    this.db.attributions[photo.id] = attribution;
    
    // Save changes
    this.saveDatabase();
    
    return attribution;
  }
  
  public getAttribution(photoId: string): Attribution | null {
    return this.db.attributions[photoId] || null;
  }
  
  public getAllAttributions(): Attribution[] {
    return Object.values(this.db.attributions);
  }
  
  public getAttributionsForProject(projectPath: string): Attribution[] {
    return Object.values(this.db.attributions).filter(
      attr => attr.projectPath && attr.projectPath.startsWith(projectPath)
    );
  }
  
  // Generate HTML for displaying attributions
  public generateAttributionHtml(attributions: Attribution[] = this.getAllAttributions()): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Attributions</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
    .attribution { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px; }
    .attribution:hover { background-color: #f9f9f9; }
    .attribution h3 { margin-top: 0; }
    .file-path { font-family: monospace; background: #f5f5f5; padding: 3px 6px; border-radius: 3px; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Image Attributions</h1>
  <p>The following images require attribution according to their respective licenses:</p>
  <div class="attributions">
`;

    attributions.forEach(attr => {
      html += `    <div class="attribution">
      <h3>Image: <span class="file-path">${attr.projectFile || 'Unknown'}</span></h3>
      <p><strong>Photographer:</strong> <a href="${attr.photographerUrl || '#'}" target="_blank" rel="noopener noreferrer">${attr.photographer}</a></p>
      <p><strong>Source:</strong> <a href="${attr.sourceUrl}" target="_blank" rel="noopener noreferrer">${attr.source}</a></p>
      <p><strong>License:</strong> ${attr.license}</p>
      <p><strong>Downloaded:</strong> ${new Date(attr.downloadDate).toLocaleString()}</p>
      <p><strong>Location:</strong> <span class="file-path">${attr.projectPath || 'Unknown'}</span></p>
    </div>
`;
    });

    html += `  </div>
</body>
</html>`;

    return html;
  }
  
  // Save attribution HTML to a file
  public saveAttributionHtml(outputPath: string, attributions: Attribution[] = this.getAllAttributions()): void {
    try {
      const html = this.generateAttributionHtml(attributions);
      
      // Ensure the directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Write the HTML file
      fs.writeFileSync(outputPath, html, 'utf8');
    } catch (error) {
      console.error(`Error saving attribution HTML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Generate a React component for attribution display
  public generateReactComponent(outputPath: string): void {
    const componentCode = `import React from 'react';

type Attribution = {
  id: string;
  photographer: string;
  photographerUrl?: string;
  source: string;
  sourceUrl: string;
  license: string;
  downloadDate: string;
  projectPath?: string;
  projectFile?: string;
};

type ImageAttributionProps = {
  photoId: string;
  className?: string;
};

const attributions: Record<string, Attribution> = ${JSON.stringify(this.db.attributions, null, 2)};

export const ImageAttribution: React.FC<ImageAttributionProps> = ({ photoId, className }) => {
  const attribution = attributions[photoId];

  if (!attribution) {
    return null;
  }

  return (
    <div className={className || 'image-attribution'}>
      <p>
        Photo by{' '}
        <a 
          href={attribution.photographerUrl} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {attribution.photographer}
        </a>
        {' '}on{' '}
        <a 
          href={attribution.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {attribution.source}
        </a>
      </p>
    </div>
  );
};
`;

    try {
      // Ensure the directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Write the component file
      fs.writeFileSync(outputPath, componentCode, 'utf8');
    } catch (error) {
      console.error(`Error generating React component: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 