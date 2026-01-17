import 'dotenv/config';
import { z } from 'zod';
import * as path from 'path';

// Define schema for environment variables
const envSchema = z.object({
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  DEFAULT_DOWNLOAD_DIR: z.string().default('./downloads')
});

// Parse environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', 
    JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

// Determine if we're in a test environment
const isTestEnvironment = process.env.NODE_ENV === 'test' ||
                         process.argv.some(arg => arg.includes('test'));

// In test environment, use a placeholder that tests should mock
// NEVER commit real API keys to source code
const apiKey = parsedEnv.data.UNSPLASH_ACCESS_KEY ||
              (isTestEnvironment ? 'TEST_API_KEY_PLACEHOLDER' : undefined);

// Validate API key
if (!apiKey) {
  throw new Error('Unsplash API key is required. Set UNSPLASH_ACCESS_KEY environment variable.');
}

// Warn if using placeholder in non-mocked test
if (apiKey === 'TEST_API_KEY_PLACEHOLDER' && isTestEnvironment) {
  console.warn('⚠️  Using placeholder API key. Ensure tests mock the Unsplash API.');
}

// Export validated config
export const config = {
  unsplash: {
    accessKey: apiKey
  },
  download: {
    defaultDir: path.resolve(process.cwd(), parsedEnv.data.DEFAULT_DOWNLOAD_DIR)
  }
}; 