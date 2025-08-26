# Darbot Presento MCP Server

A Model Context Protocol (MCP) server implementation for Darbot Presento, enabling AI assistants like Claude to create and manage presentations through natural language.

## Features

- **Create Presentations**: Generate AI-powered presentations from text prompts
- **List Presentations**: View all your saved presentations
- **Export Presentations**: Export to PDF or PPTX formats
- **Status Tracking**: Monitor presentation generation progress

## Installation

### Prerequisites
- Node.js 18+ 
- Darbot Presento backend running (default: http://localhost:8000)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Run the MCP server:
```bash
npm start
```

## Claude Desktop Integration

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "darbot-presento": {
      "command": "node", 
      "args": ["/path/to/darbot-presento/mcp-server.js"],
      "env": {
        "DARBOT_PRESENTO_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Available Tools

### `create_presentation`
Create a new AI-generated presentation.

**Parameters:**
- `prompt` (required): Description of the presentation topic
- `slides` (optional): Number of slides (1-20, default: 8)
- `language` (optional): Presentation language (default: "English")
- `theme` (optional): Theme/template (default: "modern")

**Example:**
```
Create a presentation about "The Future of AI in Healthcare" with 10 slides
```

### `list_presentations`
List all saved presentations.

**Parameters:**
- `limit` (optional): Maximum presentations to return (default: 10)

### `export_presentation`
Export a presentation to PDF or PPTX.

**Parameters:**
- `presentation_id` (required): ID of the presentation
- `format` (optional): Export format "pdf" or "pptx" (default: "pdf")

### `get_presentation_status`
Check the status of a presentation.

**Parameters:**
- `presentation_id` (required): ID of the presentation

## Environment Variables

- `DARBOT_PRESENTO_API_URL`: Base URL for the Darbot Presento API (default: http://localhost:8000)

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Architecture

This Node.js MCP server acts as a bridge between MCP-compatible AI assistants and the Darbot Presento backend API. It provides a standardized interface for presentation creation and management through the Model Context Protocol.

```
Claude Desktop ↔ MCP Server (Node.js) ↔ Darbot Presento API ↔ Presentation Engine
```

## Troubleshooting

### Common Issues

1. **Connection Error**: Ensure Darbot Presento backend is running on the configured URL
2. **Tool Not Found**: Restart Claude Desktop after updating the configuration
3. **Permission Denied**: Check file permissions on the mcp-server.js file

### Logs
The MCP server logs to stderr. Check Claude Desktop's logs for debugging information.

## License

Apache 2.0 - see LICENSE file for details.