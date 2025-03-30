# Unsplash Attribution Usage Guide

This guide demonstrates how to use the attribution features of the Unsplash MCP Server.

## Setting Up Attribution Management

The attribution system is enabled by default and requires no additional setup. When using the `stock_photo` tool, all attribution information is automatically:

1. Stored in a local database (`~/.unsplash-mcp/unsplash-attributions.json`)
2. Embedded directly in image metadata (EXIF, IPTC, XMP) if the `exiftool-vendored` package is installed

## Using the Attribution API

The `get_attributions` tool provides a simple way to retrieve and generate attribution files:

```javascript
// Node.js example
const response = await fetch('http://localhost:3000/api/unsplash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'get_attributions',
    params: {
      format: 'json',
      projectPath: '/path/to/your/project',
      outputPath: '/path/to/save/attribution/files'
    }
  })
});

const data = await response.json();
console.log(data.attributions);
```

## Attribution Formats

### 1. JSON Format

The JSON format provides raw attribution data that you can use in your application:

```javascript
// Example output
{
  "count": 2,
  "attributions": [
    {
      "id": "abc123",
      "photographer": "Jane Doe",
      "photographerUrl": "https://unsplash.com/@janedoe",
      "source": "Unsplash",
      "sourceUrl": "https://unsplash.com/photos/abc123",
      "license": "Unsplash License",
      "downloadDate": "2023-04-01T12:34:56Z",
      "projectPath": "/path/to/your/project/public/images",
      "projectFile": "hero-image.jpg"
    },
    // More attributions...
  ],
  "message": "Found 2 attributions in the database"
}
```

### 2. HTML Format

The HTML format generates a complete webpage displaying all attributions in a user-friendly format:

```html
<!-- Example output -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Attributions</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
    .attribution { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px; }
    /* More styles... */
  </style>
</head>
<body>
  <h1>Image Attributions</h1>
  <p>The following images require attribution according to their respective licenses:</p>
  <div class="attributions">
    <div class="attribution">
      <h3>Image: <span class="file-path">hero-image.jpg</span></h3>
      <p><strong>Photographer:</strong> <a href="https://unsplash.com/@janedoe" target="_blank" rel="noopener noreferrer">Jane Doe</a></p>
      <p><strong>Source:</strong> <a href="https://unsplash.com/photos/abc123" target="_blank" rel="noopener noreferrer">Unsplash</a></p>
      <!-- More attribution information... -->
    </div>
    <!-- More attributions... -->
  </div>
</body>
</html>
```

### 3. React Component

The React format generates a reusable component that you can import into your project:

```jsx
// Example output (ImageAttribution.tsx)
import React from 'react';

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

const attributions: Record<string, Attribution> = {
  "abc123": {
    "id": "abc123",
    "photographer": "Jane Doe",
    "photographerUrl": "https://unsplash.com/@janedoe",
    "source": "Unsplash",
    "sourceUrl": "https://unsplash.com/photos/abc123",
    "license": "Unsplash License",
    "downloadDate": "2023-04-01T12:34:56Z",
    "projectPath": "/path/to/your/project/public/images",
    "projectFile": "hero-image.jpg"
  },
  // More attributions...
};

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
```

## Example Usage in Different Frameworks

### Next.js

```jsx
// pages/index.js
import { ImageAttribution } from '../components/ImageAttribution';
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      <div className="hero-image-container">
        <Image 
          src="/images/hero-image.jpg" 
          alt="Hero image" 
          width={1200} 
          height={600} 
        />
        <ImageAttribution photoId="abc123" className="hero-attribution" />
      </div>
    </div>
  );
}
```

### React

```jsx
// App.js
import { ImageAttribution } from './components/ImageAttribution';

function App() {
  return (
    <div className="App">
      <header>
        <div className="hero-image-container">
          <img 
            src="/assets/images/hero-image.jpg" 
            alt="Hero image" 
          />
          <ImageAttribution photoId="abc123" className="hero-attribution" />
        </div>
      </header>
    </div>
  );
}
```

### Vue.js

```vue
<!-- App.vue -->
<template>
  <div class="hero-image-container">
    <img 
      src="/images/hero-image.jpg" 
      alt="Hero image" 
    />
    <div class="attribution">
      Photo by <a :href="attribution.photographerUrl">{{ attribution.photographer }}</a> 
      on <a :href="attribution.sourceUrl">{{ attribution.source }}</a>
    </div>
  </div>
</template>

<script>
import attributions from './assets/attributions/unsplash-attributions.json';

export default {
  data() {
    return {
      attribution: attributions.attributions.find(a => a.id === 'abc123')
    }
  }
}
</script>
```

## Extracting Metadata from Images

If you've downloaded images outside of the MCP server, you can extract any embedded attribution metadata using the CLI tool:

```bash
npm run generate-attributions -- --extract-metadata --project-path /path/to/your/project
```

This will scan for any images with embedded Unsplash attribution metadata and add them to the attribution database. 