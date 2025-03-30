import 'dotenv/config';
import { z } from 'zod';
import * as path from 'path';

// Define schema for environment variables
const envSchema = z.object({
  UNSPLASH_ACCESS_KEY: z.string().min(1, 'Unsplash API key is required'),
  DEFAULT_DOWNLOAD_DIR: z.string().default('./downloads')
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', 
    JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

// Export validated config
export const config = {
  unsplash: {
    accessKey: parsedEnv.data.UNSPLASH_ACCESS_KEY
  },
  download: {
    defaultDir: path.resolve(process.cwd(), parsedEnv.data.DEFAULT_DOWNLOAD_DIR)
  }
}; 