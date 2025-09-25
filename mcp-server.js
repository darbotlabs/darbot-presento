#!/usr/bin/env node

/**
 * Darbot Presento MCP Server (Node.js Implementation)
 * 
 * This is a Model Context Protocol (MCP) server implementation in Node.js 
 * that provides tools for creating and managing AI presentations.
 * 
 * This complements the existing Python MCP server by providing a lightweight
 * Node.js alternative that can be used directly with Claude Desktop and
 * other MCP-compatible clients.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from 'node-fetch';

/**
 * Configuration for the Darbot Presento API
 */
const API_BASE_URL = process.env.DARBOT_PRESENTO_API_URL || 'http://localhost:8000';

/**
 * Available tools for the MCP server
 */
const TOOLS = [
  {
    name: "create_presentation",
    description: "Create a new AI-generated presentation",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Description of the presentation topic and content"
        },
        slides: {
          type: "integer",
          description: "Number of slides to generate",
          minimum: 1,
          maximum: 20,
          default: 8
        },
        language: {
          type: "string",
          description: "Language for the presentation",
          default: "English"
        },
        theme: {
          type: "string", 
          description: "Presentation theme/template",
          default: "modern"
        }
      },
      required: ["prompt"]
    }
  },
  {
    name: "list_presentations",
    description: "List all saved presentations",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of presentations to return",
          default: 10
        }
      }
    }
  },
  {
    name: "export_presentation",
    description: "Export a presentation to PDF or PPTX format",
    inputSchema: {
      type: "object",
      properties: {
        presentation_id: {
          type: "string",
          description: "ID of the presentation to export"
        },
        format: {
          type: "string",
          enum: ["pdf", "pptx"],
          description: "Export format",
          default: "pdf"
        }
      },
      required: ["presentation_id"]
    }
  },
  {
    name: "get_presentation_status",
    description: "Get the status of a presentation generation",
    inputSchema: {
      type: "object",
      properties: {
        presentation_id: {
          type: "string",
          description: "ID of the presentation"
        }
      },
      required: ["presentation_id"]
    }
  }
];

/**
 * Make API request to Darbot Presento backend
 */
async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to communicate with Darbot Presento API: ${error.message}`
    );
  }
}

/**
 * Handle tool execution
 */
async function handleToolCall(name, args) {
  switch (name) {
    case "create_presentation":
      return await createPresentation(args);
    
    case "list_presentations":
      return await listPresentations(args);
    
    case "export_presentation":
      return await exportPresentation(args);
    
    case "get_presentation_status":
      return await getPresentationStatus(args);
    
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
  }
}

/**
 * Create a new presentation
 */
async function createPresentation(args) {
  const { prompt, slides = 8, language = "English", theme = "modern" } = args;
  
  if (!prompt) {
    throw new McpError(ErrorCode.InvalidParams, "Prompt is required");
  }

  const payload = {
    prompt,
    slides,
    language,
    theme
  };

  const result = await makeApiRequest('/api/v1/presentations/generate', 'POST', payload);
  
  return {
    content: [
      {
        type: "text",
        text: `✅ Presentation creation started successfully!

📋 **Details:**
- **Topic:** ${prompt}
- **Slides:** ${slides}
- **Language:** ${language}
- **Theme:** ${theme}
- **Presentation ID:** ${result.presentation_id || result.id || 'N/A'}

🔄 **Status:** ${result.status || 'Processing'}

The presentation is being generated. You can check its status using the get_presentation_status tool.`
      }
    ]
  };
}

/**
 * List presentations
 */
async function listPresentations(args) {
  const { limit = 10 } = args;
  
  const result = await makeApiRequest(`/api/v1/presentations?limit=${limit}`);
  
  if (!result.presentations || result.presentations.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "📝 No presentations found. Create your first presentation using the create_presentation tool!"
        }
      ]
    };
  }

  const presentationList = result.presentations
    .map((p, index) => `${index + 1}. **${p.title || p.id}** (ID: ${p.id})
   - Status: ${p.status || 'Unknown'}
   - Created: ${p.created_at || 'Unknown'}
   - Slides: ${p.slide_count || 'N/A'}`)
    .join('\n\n');

  return {
    content: [
      {
        type: "text", 
        text: `📚 **Your Presentations (${result.presentations.length}):**

${presentationList}`
      }
    ]
  };
}

/**
 * Export presentation
 */
async function exportPresentation(args) {
  const { presentation_id, format = "pdf" } = args;
  
  if (!presentation_id) {
    throw new McpError(ErrorCode.InvalidParams, "Presentation ID is required");
  }

  const result = await makeApiRequest(`/api/v1/presentations/${presentation_id}/export?format=${format}`, 'POST');
  
  return {
    content: [
      {
        type: "text",
        text: `📄 **Export initiated successfully!**

- **Presentation ID:** ${presentation_id}
- **Format:** ${format.toUpperCase()}
- **Download URL:** ${result.download_url || 'Will be available shortly'}

The export is being processed. The download link will be available once complete.`
      }
    ]
  };
}

/**
 * Get presentation status
 */
async function getPresentationStatus(args) {
  const { presentation_id } = args;
  
  if (!presentation_id) {
    throw new McpError(ErrorCode.InvalidParams, "Presentation ID is required");
  }

  const result = await makeApiRequest(`/api/v1/presentations/${presentation_id}`);
  
  const statusEmoji = {
    'completed': '✅',
    'processing': '🔄', 
    'failed': '❌',
    'pending': '⏳'
  };

  const emoji = statusEmoji[result.status?.toLowerCase()] || '❓';

  return {
    content: [
      {
        type: "text",
        text: `${emoji} **Presentation Status**

- **ID:** ${presentation_id}
- **Status:** ${result.status || 'Unknown'}
- **Title:** ${result.title || 'Untitled'}
- **Slides:** ${result.slide_count || 'N/A'}
- **Created:** ${result.created_at || 'Unknown'}
- **Updated:** ${result.updated_at || 'Unknown'}

${result.status === 'completed' ? '🎉 Your presentation is ready!' : 
  result.status === 'failed' ? '❌ Generation failed. Please try again.' :
  '⏳ Still processing...'}
  
${result.view_url ? `🔗 **View:** ${result.view_url}` : ''}`
      }
    ]
  };
}

/**
 * Create and start the MCP server
 */
async function main() {
  const server = new Server(
    {
      name: "darbot-presento",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      return await handleToolCall(name, args || {});
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error.message}`
      );
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("🚀 Darbot Presento MCP Server started successfully!");
  console.error(`📡 API Base URL: ${API_BASE_URL}`);
  console.error("🔧 Available tools:", TOOLS.map(t => t.name).join(', '));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error("\n👋 Darbot Presento MCP Server shutting down...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("💥 Failed to start Darbot Presento MCP Server:", error);
  process.exit(1);
});