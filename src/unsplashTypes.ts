import { z } from 'zod';

// Basic URL structure
export const UrlsSchema = z.object({
  raw: z.string().url(),
  full: z.string().url(),
  regular: z.string().url(),
  small: z.string().url(),
  thumb: z.string().url()
});

// Links structure
export const LinksSchema = z.object({
  self: z.string().url(),
  html: z.string().url(),
  download: z.string().url(),
  download_location: z.string().url()
});

// User structure
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string().nullable(),
  portfolio_url: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  instagram_username: z.string().nullable().optional(),
  twitter_username: z.string().nullable().optional()
});

// Photo structure
export const PhotoSchema = z.object({
  id: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  width: z.number().int(),
  height: z.number().int(),
  color: z.string().optional().nullable(),
  blur_hash: z.string().optional().nullable(),
  description: z.string().nullable(),
  alt_description: z.string().nullable(),
  urls: UrlsSchema,
  links: LinksSchema,
  user: UserSchema
});

// Search results structure
export const SearchResultsSchema = z.object({
  total: z.number().int(),
  total_pages: z.number().int(),
  results: z.array(PhotoSchema)
});

// Download tracking response schema
export const DownloadTrackingSchema = z.object({
  url: z.string().url()
}).passthrough();

// Export types
export type Urls = z.infer<typeof UrlsSchema>;
export type Links = z.infer<typeof LinksSchema>;
export type User = z.infer<typeof UserSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type DownloadTracking = z.infer<typeof DownloadTrackingSchema>; 