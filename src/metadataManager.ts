import { ExifTool } from 'exiftool-vendored';
import { Photo } from './unsplashTypes.js';
import path from 'path';

/**
 * Class for handling image metadata operations using ExifTool
 */
export class MetadataManager {
  private exiftool: ExifTool;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization to avoid overhead when not used
    this.initialized = false;
  }

  /**
   * Initialize ExifTool when needed
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      try {
        this.exiftool = new ExifTool({ taskTimeoutMillis: 5000 });
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize ExifTool:', error);
        throw new Error('ExifTool initialization failed');
      }
    }
  }

  /**
   * Close ExifTool process when done
   */
  public async close(): Promise<void> {
    if (this.initialized) {
      await this.exiftool.end();
      this.initialized = false;
    }
  }

  /**
   * Add Unsplash attribution metadata to an image
   */
  public async addAttributionMetadata(filePath: string, photo: Photo): Promise<void> {
    await this.ensureInitialized();

    try {
      const photographer = photo.user.name || photo.user.username;
      const photographerUrl = `https://unsplash.com/@${photo.user.username}`;

      // Prepare metadata to write
      const metadata = {
        'XMP:Creator': photographer,
        'XMP:Credit': `Photo by ${photographer} on Unsplash`,
        'XMP:Rights': 'Unsplash License',
        'XMP:Source': 'Unsplash',
        'XMP:WebStatement': photo.links.html,
        'IPTC:Credit': `${photographer} / Unsplash`,
        'IPTC:Source': 'Unsplash',
        'IPTC:CopyrightNotice': `Photo by ${photographer} on Unsplash`,
        'EXIF:Artist': photographer,
        'EXIF:Copyright': `Photo by ${photographer} on Unsplash (${photo.links.html})`,
        'XMP:UsageTerms': 'Free to use under the Unsplash License',
        'XMP:Title': photo.description || photo.alt_description || `Photo by ${photographer}`,
        'XMP:Description': `Original photo by ${photographer} on Unsplash: ${photo.links.html}`,
        'XMP:Identifier': photo.id,
        'XMP:CreatorWorkURL': photographerUrl,
        'IPTC:Creator': photographer,
        'IPTC:CreatorWorkURL': photographerUrl
      };

      // Write metadata to file
      await this.exiftool.write(filePath, metadata);
      console.log(`Added attribution metadata to ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`Error adding metadata to ${filePath}:`, error);
      // Don't throw error - metadata is nice to have but not critical
    }
  }

  /**
   * Extract attribution metadata from an image
   */
  public async extractAttributionMetadata(filePath: string): Promise<Record<string, any>> {
    await this.ensureInitialized();

    try {
      // Read metadata from file
      const metadata = await this.exiftool.read(filePath);
      
      // Extract relevant attribution fields
      const attributionData = {
        title: metadata.XMP?.Title || metadata.IPTC?.ObjectName,
        creator: metadata.XMP?.Creator || metadata.IPTC?.Creator || metadata.EXIF?.Artist,
        source: metadata.XMP?.Source || metadata.IPTC?.Source,
        rights: metadata.XMP?.Rights || metadata.IPTC?.CopyrightNotice || metadata.EXIF?.Copyright,
        webStatement: metadata.XMP?.WebStatement,
        usageTerms: metadata.XMP?.UsageTerms,
        identifier: metadata.XMP?.Identifier
      };

      return attributionData;
    } catch (error) {
      console.error(`Error extracting metadata from ${filePath}:`, error);
      return {};
    }
  }
} 