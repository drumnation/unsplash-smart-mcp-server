[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/drumnation-unsplash-smart-mcp-server-badge.png)](https://mseep.ai/app/drumnation-unsplash-smart-mcp-server)

# 🖼️ Unsplash Smart MCP Server

> **Empower your AI agents with stunning visuals, zero hassle.**

A powerful FastMCP server that enables AI agents to seamlessly search, recommend, and deliver professional stock photos from Unsplash with intelligent context awareness and automated attribution management.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)
![TypeScript Ready](https://img.shields.io/badge/TypeScript-Ready-blue)
[![smithery badge](https://smithery.ai/badge/@drumnation/unsplash-smart-mcp-server)](https://smithery.ai/server/@drumnation/unsplash-smart-mcp-server)
[![npm version](https://img.shields.io/npm/v/@drumnation/unsplash-smart-mcp-server.svg)](https://www.npmjs.com/package/@drumnation/unsplash-smart-mcp-server)

## 🚀 Why Choose This Unsplash Integration

In the landscape of visual content integration, our Unsplash Smart MCP Server stands out as the **definitive solution** for AI-powered image acquisition:

- **🧠 AI-Agent Optimized**: Purpose-built for AI agents like Claude in Cursor, streamlining image requests with natural language
- **🔍 Context-Aware Image Selection**: Interprets vague requests intelligently, delivering relevant images even from abstract prompts
- **⚡ Single Tool Efficiency**: Eliminates tool spam with a unified `stock_photo` tool that handles the entire image workflow
- **📊 Resource Optimization**: URL-first approach conserves bandwidth and storage while maintaining flexibility
- **✅ Automatic Attribution**: Built-in compliance with Unsplash's Terms of Service with zero developer effort
- **📁 Project-Aware Organization**: Intelligently organizes images based on your project structure (Next.js, React, Vue, etc.)
- **🧩 Seamless Integration**: Designed for minimal setup and maximum compatibility with your existing workflow

## ✨ Features Beyond Comparison

### For AI Agent Developers

- **Smart Contextual Search**: Find the perfect image through natural language requests
- **Automatic Subject Selection**: AI determines optimal image subjects from your purpose description
- **Intent-Driven Results**: Get images that match not just keywords, but the underlying intent
- **Seamless Agent Integration**: Works out-of-the-box with Claude in Cursor and other MCP-compatible agents

### For Project Efficiency

- **Two-Step Workflow**: Get URLs for controlled downloads, avoiding permission issues and unnecessary storage
- **Project-Aware File Management**: Auto-organizes images based on framework conventions
- **Intelligent Directory Creation**: Creates appropriate folder structures based on your project type
- **Progressive Enhancement**: Works with any project size, from quick prototypes to enterprise applications

### For Compliance Peace of Mind

- **Complete Attribution Management**:
  - Local attribution database tracks all image usage
  - Automatic embedding of photographer metadata in images (EXIF, IPTC, XMP)
  - One-click generation of attribution pages in multiple formats
  - Comprehensive API for attribution data

## 🛠️ Installation

### Prerequisites

- Node.js 18.x or higher
- An Unsplash API access key ([get one here](https://unsplash.com/developers))

### Local Installation (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/drumnation/unsplash-smart-mcp-server.git
cd unsplash-smart-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure your Cursor MCP settings:
   - macOS: Edit `~/.cursor/mcp.json`
   - Windows: Edit `%USERPROFILE%\.cursor\mcp.json`
   - Linux: Edit `~/.cursor/mcp.json`

4. Add the following configuration:
```json
{
  "servers": {
    "unsplash": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "cwd": "/absolute/path/to/unsplash-smart-mcp-server",
      "env": {
        "UNSPLASH_ACCESS_KEY": "your_api_key_here"
      }
    }
  }
}
```

5. Replace:
   - `/absolute/path/to/unsplash-smart-mcp-server` with the actual path where you cloned the repo
   - `your_api_key_here` with your Unsplash API key

6. Save the file and restart Cursor.

> **Important:** Unlike many MCP servers, this server requires direct process piping and cannot be accessed via TCP ports or through npm directly due to how it handles FastMCP's I/O interactions. The local installation method is the most reliable approach.

### Cursor CLI Alternative

If you prefer using Cursor's CLI:

```bash
claude mcp add unsplash npx tsx /path/to/unsplash-smart-mcp-server/src/server.ts --cwd /path/to/unsplash-smart-mcp-server
claude mcp config set unsplash UNSPLASH_ACCESS_KEY=your_api_key_here
```

Replace the paths and API key with your actual values.

### Via Docker (Most Reliable Method)

1. Clone the repository:
```bash
git clone https://github.com/drumnation/unsplash-smart-mcp-server.git
cd unsplash-smart-mcp-server
```

2. Create a `docker-compose.yml` file:
```yaml
services:
  unsplash-mcp:
    build: .
    image: unsplash-mcp-server
    restart: always
    stdin_open: true
    tty: true
    environment:
      - UNSPLASH_ACCESS_KEY=your_api_key_here
```

3. Build and start the container:
```bash
docker-compose up -d
```

4. Configure your Cursor MCP settings:
   - macOS: Edit `~/.cursor/mcp.json`
   - Windows: Edit `%USERPROFILE%\.cursor\mcp.json`
   - Linux: Edit `~/.cursor/mcp.json`

5. Add the following configuration:
```json
{
  "servers": {
    "unsplash": {
      "command": "docker",
      "args": ["exec", "-i", "unsplash-mcp-unsplash-mcp-1", "tsx", "src/server.ts"],
      "env": {}
    }
  }
}
```

6. Save the file and restart Cursor.

This setup will:
- Start the server automatically when Docker starts
- Restart the server if it crashes
- Run in the background without terminal windows
- Provide a reliable connection to Cursor

### Via Smithery (Cloud Deployment)

If you prefer cloud deployment, you can use Smithery:

1. Install the server in Cursor via Smithery:

```bash
npx @smithery/cli install @drumnation/unsplash-smart-mcp-server --client cursor --key your_api_key_here
```

2. Alternatively, you can log in to [Smithery.ai](https://smithery.ai) and deploy it through their web interface.

> **Note for Windows users:** Smithery deployment includes special handling for Windows compatibility.

For detailed instructions and troubleshooting, see the [Smithery Deployment Guide](./docs/smithery-deployment.md).

## 🧩 Integration with AI Agents

### Step-by-Step Guide for Claude in Cursor

Our Unsplash Smart MCP Server is designed to make image acquisition through AI agents effortless and intuitive:

1. **Initiate a request**: Simply ask Claude for an image in natural language
2. **AI interpretation**: Claude understands your needs and calls the `stock_photo` tool with optimized parameters
3. **Smart image selection**: The server interprets context and finds the most relevant images
4. **Presentation of options**: Claude presents you with the best matches and download commands
5. **Seamless download**: Execute the suggested commands to place images exactly where you need them
6. **Automatic attribution**: All attribution data is stored and can be accessed whenever needed

This process eliminates the traditional workflow of:
1. ~~Searching Unsplash manually~~
2. ~~Scrolling through hundreds of results~~
3. ~~Downloading images to random locations~~
4. ~~Moving files to the correct project folders~~
5. ~~Manually tracking attribution data~~
6. ~~Creating attribution pages~~

### Example Prompts for AI Agents

Ask Claude in Cursor for images using natural language prompts like these:

```
"Find a professional image for a tech startup landing page hero section"
```

## 🪟 Windows Compatibility

If you're using Windows and experiencing the "Client closed" error when running the MCP server in Cursor, follow these special configuration steps:

### Windows-specific MCP Configuration

Create a file named `mcp.json` in your `.cursor` directory (typically at `%USERPROFILE%\.cursor\mcp.json`) with one of these configurations:

#### Option 1: Direct Node Execution (Recommended)

```json
{
  "mcpServers": {
    "stock_photo": {
      "command": "node",
      "args": ["./node_modules/.bin/tsx", "path/to/unsplash-mcp/src/server.ts"],
      "disabled": false,
      "env": {
        "UNSPLASH_ACCESS_KEY": "your_api_key_here"
      },
      "shell": false
    }
  }
}
```

#### Option 2: PowerShell Approach

```json
{
  "mcpServers": {
    "stock_photo": {
      "command": "powershell",
      "args": ["-Command", "npx tsx path/to/unsplash-mcp/src/server.ts"],
      "disabled": false,
      "env": {
        "UNSPLASH_ACCESS_KEY": "your_api_key_here"
      }
    }
  }
}
```

For complete documentation on Windows compatibility, see [Windows Compatibility Guide](./docs/windows-compatibility.md).

## 🛠️ API Reference

### URL-First Approach: The Smart Choice

Our architecture uses a URL-first approach rather than direct image embedding for several critical reasons:

1. **Storage Efficiency**: Prevents AI agents from unnecessarily storing large binary data in their context
2. **Bandwidth Conservation**: Reduces data transfer between services, improving response times
3. **Placement Flexibility**: Allows developers to download images exactly where they're needed
4. **Permission Management**: Avoids filesystem permission issues in restricted environments
5. **Workflow Integration**: Seamlessly integrates with existing development pipelines

This strategy enables AI agents to intelligently suggest the optimal download location based on project context, without being constrained by their own environment limitations.

### Minimizing Tool Spam and API Calls

Unlike other solutions that require multiple tool calls for searching, filtering, downloading, and attributing images, our server:

- **Unifies the entire image workflow** into a single `stock_photo` tool
- **Optimizes result retrieval** by requesting more images upfront to enable better filtering
- **Eliminates ping-pong interactions** between the agent and services
- **Reduces agent token usage** by streamlining request and response formats

This design significantly reduces the number of API calls and tool invocations, leading to faster results and lower operational costs.

## 🔄 Automatic Attribution and Compliance

### Unsplash Terms of Service: Effortless Compliance

Using images from Unsplash requires adherence to their [Terms of Service](https://unsplash.com/license). Our server handles this automatically:

1. **Attribution Data Capture**: Every image download automatically stores photographer information
2. **Metadata Embedding**: Photographer details are embedded directly into image files
3. **Attribution Database**: A local database maintains a record of all image usage
4. **Attribution Generators**: Built-in tools create HTML and React attribution components
5. **API Access**: Simple endpoints to retrieve attribution data for any project

By using our Unsplash Smart MCP Server, you are automatically compliant with Unsplash's requirements without any additional effort.

### Attribution Management System

The server includes a comprehensive attribution management system:

```javascript
// Retrieve attribution data for your project
const attributions = await fetch('http://localhost:3000/api/unsplash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'get_attributions',
    params: {
      format: 'json',  // Options: json, html, react
      projectPath: '/path/to/your/project'
    }
  })
}).then(res => res.json());

// attributions contains complete data about every image used
```

The API can generate three types of attribution files:

1. **JSON**: Structured data for custom implementations
2. **HTML**: Ready-to-use HTML page for website footer or credits section
3. **React**: Drop-in React component for modern web applications

## 💼 Developer Workflow Integration

### Real-World Use Cases

Our Unsplash Smart MCP Server seamlessly integrates into your development workflow:

#### UI Development
- Instantly populate mockups with relevant placeholder images
- Maintain consistent image dimensions across components
- Organize images logically within your project structure

#### Documentation
- Enhance technical documentation with explanatory visuals
- Create visually appealing tutorials and guides
- Maintain proper attribution for all visual assets

#### Content Creation
- Quickly find images for blog posts and articles
- Generate visuals for social media content
- Access consistent imagery for product marketing

#### Application Development
- Populate e-commerce sites with product imagery
- Create visually rich user experiences
- Maintain separate image collections for different sections

### Framework-Specific Organization

Images are automatically organized based on your project type:

| Framework | Default Image Path | Alternate Paths |
|-----------|-------------------|----------------|
| Next.js   | `/public/images/` | `/public/assets/images/` |
| React     | `/src/assets/images/` | `/assets/images/` |
| Vue       | `/src/assets/images/` | `/public/images/` |
| Angular   | `/src/assets/images/` | `/assets/images/` |
| Generic   | `/assets/images/` | `~/Downloads/stock-photos/` |

## 🥇 Competitive Differentiation

### Why Choose Our Unsplash Integration?

| Feature | Unsplash Smart MCP Server | Alternatives |
|---------|--------------|--------------|
| **AI Agent Integration** | ✅ Purpose-built for AI agent workflow | ❌ Typically requires manual parameter setting |
| **Context Awareness** | ✅ Interprets vague requests intelligently | ❌ Relies on exact keyword matching |
| **Tool Efficiency** | ✅ Single tool handles entire workflow | ❌ Often requires multiple separate tools |
| **Attribution Management** | ✅ Comprehensive system with multiple formats | ❌ Manual tracking or basic text output |
| **Project Organization** | ✅ Framework-aware folder structures | ❌ Generic downloads to a single location |
| **Installation Complexity** | ✅ Simple one-line command | ❌ Often requires multiple configuration steps |
| **Response Format** | ✅ AI-optimized with relevant context | ❌ Generic JSON requiring further processing |
| **Download Flexibility** | ✅ URL-first with intelligent suggestions | ❌ Either direct downloads or just URLs |

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UNSPLASH_ACCESS_KEY` | Your Unsplash API access key | - |
| `PORT` | Port for the server to listen on | `3000` |
| `HOST` | Host for the server | `localhost` |
| `ATTRIBUTION_DB_PATH` | Path to store attribution database | `~/.unsplash-mcp` |

### Tool Parameters

#### stock_photo

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `query` | string | What to search for (AI will choose if not specified) | - |
| `purpose` | string | Where the image will be used (e.g., hero, background) | - |
| `count` | number | Number of images to return | `1` |
| `orientation` | string | Preferred orientation (any, landscape, portrait, square) | `any` |
| `width` | number | Target width in pixels | - |
| `height` | number | Target height in pixels | - |
| `minWidth` | number | Minimum width for filtering results | - |
| `minHeight` | number | Minimum height for filtering results | - |
| `outputDir` | string | Directory to save photos | `~/Downloads/stock-photos` |
| `projectType` | string | Project type for folder structure (next, react, vue, angular) | - |
| `category` | string | Category for organizing images (e.g., heroes, backgrounds) | - |
| `downloadMode` | string | Whether to download images or return URLs | `urls_only` |

#### get_attributions

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `format` | string | Output format (json, html, react) | `json` |
| `projectPath` | string | Filter attributions to a specific project path | - |
| `outputPath` | string | Where to save attribution files | - |

## 🔧 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| **Connection Refused** | Ensure the server is running on the configured port |
| **Authentication Error** | Verify your Unsplash API key is correctly set |
| **No Images Found** | Try broader search terms or check your search query |
| **Download Permission Issues** | Use `downloadMode: 'urls_only'` and manual download commands |
| **Docker Container Exits Prematurely** | Ensure you're using `CMD ["npm", "start"]` in your Dockerfile instead of directly running the TypeScript file with tsx. This ensures the server stays running in a Docker environment. |
| **Timeout Errors** | The default MCP timeout is 60 seconds, which may be insufficient for downloading larger images or processing multiple images. For image-heavy operations: 1) Process fewer images per request, 2) Use smaller image dimensions, 3) Consider using `urls_only` mode instead of auto-download, 4) Check network connectivity |
| **Attribution Not Found** | Verify the image was downloaded through the MCP server |
| **Unhandled MCP Errors** | If you see `"McpError: MCP error -32001: Request timed out"` errors, your request is likely taking too long. Break it into smaller operations or use the URLs-only approach |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Unsplash API key
4. Run in development mode with `npm run dev`
5. Run tests with `npm test`

## 🗺️ Roadmap

Here's what we're planning for future releases:

- **Image Editing Capabilities**: Basic resizing, cropping, and adjustment tools
- **Advanced Search Filters**: More granular control over image selection
- **Batch Processing**: Handle multiple image requests efficiently
- **Custom Collections**: Save and manage groups of images for projects
- **Team Collaboration**: Share attribution and image collections
- **Usage Analytics**: Track image usage across projects
- **Additional Image Sources**: Integration with other stock photo providers
- **Improved Timeout Handling**: Enhanced timeout configuration and recovery mechanisms

## 📄 License

MIT License

## 📚 Attribution Requirements

When using images from Unsplash, you must comply with the [Unsplash License](https://unsplash.com/license):

- Attribution is not required but appreciated
- You cannot sell unaltered copies of the photos
- You cannot compile photos from Unsplash to create a competing service

Our server's attribution system makes it easy to provide proper credit to photographers.

## 📞 Contact

For issues or questions, please [open an issue](https://github.com/drumnation/unsplash-smart-mcp-server/issues) on GitHub.

## 🧰 Development and Testing

### Running the Server Locally

```bash
# Clone the repository
git clone https://github.com/drumnation/unsplash-smart-mcp-server.git
cd unsplash-smart-mcp-server

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env to add your UNSPLASH_ACCESS_KEY

# Start the development server
npm run dev
```

### Testing

The package includes a comprehensive test suite:

```bash
# Run core tests
npm test

# Run all tests and get a summary report
npm run test:all
```

The test suite includes:
- Unit and integration tests
- Manual tool testing
- Docker container tests
- Smithery.ai integration tests

For detailed information about testing, see [docs/testing.md](docs/testing.md).

---

<p align="center">
  <strong>Empower your AI agents with the perfect images, every time.</strong><br>
  Built with ❤️ for developers and AI enthusiasts.
</p>
