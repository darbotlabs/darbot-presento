# MCP Server Development Instructions

## Model Context Protocol (MCP) Server Guidelines

The MCP server allows AI assistants to interact with Darbot Presento to generate presentations. This provides instructions for maintaining and extending the MCP server implementation.

### Server Structure

```javascript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'darbot-presento-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);
```

### Tool Implementation Pattern

Each MCP tool should follow this structure:

```javascript
// Tool definition
{
  name: "generate_presentation",
  description: "Generate a presentation using Darbot Presento API",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Description of the presentation to generate"
      },
      template: {
        type: "string", 
        description: "Template style (professional, modern, classic, general)",
        enum: ["professional", "modern", "classic", "general"],
        default: "professional"
      },
      slides: {
        type: "integer",
        description: "Number of slides to generate",
        minimum: 3,
        maximum: 20,
        default: 8
      }
    },
    required: ["prompt"]
  }
}

// Tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "generate_presentation":
        return await handleGeneratePresentation(args);
      
      case "list_templates":
        return await handleListTemplates();
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`
        }
      ]
    };
  }
});
```

### API Integration Functions

#### Presentation Generation:
```javascript
async function handleGeneratePresentation(args) {
  const { prompt, template = "professional", slides = 8 } = args;
  
  try {
    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt is required and cannot be empty");
    }
    
    // Make API call to Darbot Presento
    const response = await fetch(`${API_BASE_URL}/api/v1/presentation/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        template_style: template,
        slide_count: slides,
        format: 'pptx'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Presentation generated successfully!
          
📊 **Presentation Details:**
- Title: ${result.title || "Untitled Presentation"}  
- Template: ${template}
- Slides: ${result.slide_count || slides}
- Format: PPTX
- Status: ${result.status}

📥 **Download:**
${result.download_url ? `[Download Presentation](${result.download_url})` : 'Download link will be available once processing completes.'}

🎨 **Template Features:**
${getTemplateFeatures(template)}

The presentation has been generated with your specified content and is ready for download.`
        }
      ]
    };
    
  } catch (error) {
    throw new Error(`Failed to generate presentation: ${error.message}`);
  }
}
```

#### Template Information:
```javascript
async function handleListTemplates() {
  const templates = [
    {
      name: "professional",
      description: "Clean, business-focused design with structured layouts",
      features: ["Corporate color scheme", "Data visualization support", "Professional typography"]
    },
    {
      name: "modern", 
      description: "Contemporary design with bold visuals and dynamic layouts",
      features: ["Gradient backgrounds", "Modern iconography", "Creative layouts"]
    },
    {
      name: "classic",
      description: "Traditional presentation style with timeless design elements", 
      features: ["Classic typography", "Formal layouts", "Academic styling"]
    },
    {
      name: "general",
      description: "Versatile template suitable for various presentation types",
      features: ["Flexible layouts", "Neutral colors", "Adaptable styling"]
    }
  ];
  
  const templateList = templates.map(t => 
    `**${t.name}**: ${t.description}\n- ${t.features.join('\n- ')}`
  ).join('\n\n');
  
  return {
    content: [
      {
        type: "text", 
        text: `🎨 **Available Presentation Templates:**

${templateList}

Use the template name (e.g., "professional") when generating presentations to apply the desired styling.`
      }
    ]
  };
}

function getTemplateFeatures(template) {
  const features = {
    professional: "• Corporate color palette\n• Clean layouts\n• Data charts and graphs\n• Professional typography",
    modern: "• Dynamic gradients\n• Bold visual elements\n• Contemporary design\n• Creative arrangements", 
    classic: "• Traditional styling\n• Formal layouts\n• Academic presentation style\n• Timeless design elements",
    general: "• Versatile layouts\n• Neutral color scheme\n• Flexible content arrangement\n• Universal applicability"
  };
  
  return features[template] || "• Standard presentation features";
}
```

### Error Handling Patterns

#### Robust Error Handling:
```javascript
async function safeApiCall(url, options) {
  try {
    const response = await fetch(url, {
      timeout: 30000, // 30 second timeout
      ...options
    });
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The server may be busy.');
    }
    throw error;
  }
}
```

#### Input Validation:
```javascript
function validatePresentationRequest(args) {
  const errors = [];
  
  if (!args.prompt || typeof args.prompt !== 'string' || args.prompt.trim().length === 0) {
    errors.push("Prompt is required and must be a non-empty string");
  }
  
  if (args.prompt && args.prompt.length > 500) {
    errors.push("Prompt must be 500 characters or less");
  }
  
  if (args.template && !['professional', 'modern', 'classic', 'general'].includes(args.template)) {
    errors.push("Template must be one of: professional, modern, classic, general");
  }
  
  if (args.slides && (typeof args.slides !== 'number' || args.slides < 3 || args.slides > 20)) {
    errors.push("Slide count must be a number between 3 and 20");
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }
}
```

### Resource Management

#### Health Check Resource:
```javascript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "darbot://health",
        mimeType: "text/plain",
        name: "Darbot Presento Health Status"
      },
      {
        uri: "darbot://templates",
        mimeType: "application/json", 
        name: "Available Presentation Templates"
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  switch (uri) {
    case "darbot://health":
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const isHealthy = response.ok;
        return {
          contents: [
            {
              uri: uri,
              mimeType: "text/plain",
              text: `Darbot Presento API Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`
            }
          ]
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri,
              mimeType: "text/plain", 
              text: `Darbot Presento API Status: ❌ Unreachable (${error.message})`
            }
          ]
        };
      }
      
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});
```

### Configuration Management

#### Environment Variables:
```javascript
const config = {
  apiBaseUrl: process.env.DARBOT_API_URL || 'http://localhost:8000',
  timeout: parseInt(process.env.API_TIMEOUT) || 30000,
  maxSlides: parseInt(process.env.MAX_SLIDES) || 20,
  enableDebug: process.env.DEBUG === 'true'
};

// Debug logging
function debugLog(message, data = null) {
  if (config.enableDebug) {
    console.error(`[MCP DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}
```

### Server Lifecycle

#### Proper Server Setup:
```javascript
async function runServer() {
  const transport = new StdioServerTransport();
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.close();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.close();
    process.exit(0);
  });
  
  try {
    await server.connect(transport);
    console.error('Darbot Presento MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
```

### Testing MCP Tools

#### Basic Testing Framework:
```javascript
// test-mcp.js
async function testGeneratePresentation() {
  const args = {
    prompt: "Create a presentation about artificial intelligence",
    template: "professional",
    slides: 5
  };
  
  try {
    const result = await handleGeneratePresentation(args);
    console.log('✅ Generate presentation test passed');
    console.log(result.content[0].text.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Generate presentation test failed:', error.message);
  }
}

async function testListTemplates() {
  try {
    const result = await handleListTemplates();
    console.log('✅ List templates test passed');
    console.log('Templates found:', result.content[0].text.includes('professional'));
  } catch (error) {
    console.log('❌ List templates test failed:', error.message);
  }
}
```

When developing MCP tools, always prioritize clear error messages, proper input validation, and robust API integration to ensure a smooth user experience for AI assistants.