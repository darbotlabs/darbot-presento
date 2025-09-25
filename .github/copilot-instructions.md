# GitHub Copilot Instructions for Darbot Presento

## Project Overview

Darbot Presento is an open-source AI presentation generator that runs locally. It provides a complete platform for creating professional presentations using various AI models while keeping data private and secure.

### Architecture

- **Frontend**: Next.js 14 with TypeScript, App Router, Tailwind CSS, and Radix UI components
- **Backend**: FastAPI with Python 3.11+ for AI processing and presentation generation
- **AI Integration**: Multi-provider support (OpenAI, Google Gemini, Anthropic Claude, Ollama, custom OpenAI-compatible APIs)
- **Templates**: Structured presentation templates with Zod schema validation
- **MCP**: Model Context Protocol server for AI assistant integration

## Code Style and Conventions

### TypeScript/React (Next.js)
- Use functional components with TypeScript interfaces
- Prefer `const` for component declarations
- Use Tailwind CSS for styling with semantic class names
- Follow Radix UI patterns for component composition
- Use Zod schemas for all data validation and type inference
- Export component interfaces and types explicitly
- Use async/await for API calls with proper error handling

### Python (FastAPI)
- Use FastAPI with async/await patterns
- Follow PEP 8 style guidelines
- Use type hints for all function parameters and return types
- Use Pydantic models for request/response validation
- Implement proper error handling with custom exceptions
- Use dependency injection for shared services

### File Structure Conventions

```
servers/nextjs/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── presentation-templates/ # Slide layout templates
├── store/                 # Redux state management
├── utils/                 # Utility functions
└── types/                 # TypeScript type definitions

servers/fastapi/
├── api/                   # API route handlers
├── models/               # Pydantic models
├── services/             # Business logic services
├── utils/                # Utility functions
└── tests/                # Test files
```

## Presentation Template Development

### Schema Structure
All presentation templates must include:
- `layoutId`: Unique string identifier 
- `layoutName`: Human-readable name
- `layoutDescription`: Description of the layout purpose
- `Schema`: Zod schema with validation rules and metadata

### Schema Best Practices
- Use `.min()` and `.max()` constraints for strings and arrays
- Provide meaningful `.default()` values for all fields
- Add `.meta({ description: "..." })` for AI context
- Use semantic field names that describe content purpose
- Include image and icon schemas using `ImageSchema` and `IconSchema`

### Component Structure
```typescript
import * as z from "zod";
import { ImageSchema, IconSchema } from "../defaultSchemes";

export const layoutId = "unique-layout-id";
export const layoutName = "Layout Display Name";
export const layoutDescription = "Purpose and usage description";

export const Schema = z.object({
  // Schema definition with validation and defaults
});

export type LayoutData = z.infer<typeof Schema>;

interface LayoutProps {
  data: LayoutData;
}

const Layout: React.FC<LayoutProps> = ({ data }) => {
  // Component implementation with responsive design
  // Use Tailwind classes for styling
  // Handle optional fields gracefully
};

export default Layout;
```

## AI Integration Patterns

### Environment Variables
- Use standardized env var names (e.g., `OPENAI_API_KEY`, `GOOGLE_API_KEY`)
- Support multiple providers with fallback mechanisms
- Implement feature flags for optional capabilities (e.g., `WEB_GROUNDING`, `TOOL_CALLS`)

### API Configuration
- Always validate API keys before making requests
- Implement proper error handling for API failures
- Use structured outputs with schema validation
- Support both tool calling and JSON schema modes

## Component Development Guidelines

### UI Components
- Use Radix UI primitives as the foundation
- Implement proper accessibility attributes
- Support both light and dark themes
- Include loading and error states
- Make components responsive using Tailwind breakpoints

### State Management
- Use Redux Toolkit for global state
- Keep local state for component-specific data
- Use React Query/SWR for server state management
- Implement optimistic updates where appropriate

## Testing Patterns

### Frontend Testing
- Test component rendering and user interactions
- Mock API calls and external dependencies
- Use React Testing Library patterns
- Test accessibility and keyboard navigation

### Backend Testing
- Test API endpoints with FastAPI test client
- Mock external AI service calls
- Test error scenarios and edge cases
- Validate request/response schemas

## Error Handling

### Frontend
- Use try-catch blocks for async operations
- Implement toast notifications for user feedback
- Log errors to console with context
- Provide fallback UI for error states

### Backend
- Use FastAPI exception handlers
- Return meaningful error messages
- Log errors with appropriate log levels
- Validate input data thoroughly

## Performance Considerations

- Implement lazy loading for heavy components
- Optimize images and assets
- Use Next.js caching strategies
- Minimize bundle sizes
- Implement pagination for large datasets

## Security Best Practices

- Validate all user inputs
- Sanitize data before rendering
- Use environment variables for sensitive data
- Implement proper CORS policies
- Never expose API keys in client-side code

When contributing to this project, always consider the user's privacy and data security, maintain code quality standards, and ensure compatibility across different AI providers.