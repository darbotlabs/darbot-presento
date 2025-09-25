# Presentation Template Development Instructions

## Template Structure Overview

Presentation templates are React components with structured Zod schemas that define the data structure for AI-generated slides. Each template represents a specific slide layout type with customizable content.

### Required Exports

Every presentation template must export these constants and types:

```typescript
export const layoutId = "unique-kebab-case-id";
export const layoutName = "Human Readable Name";
export const layoutDescription = "Clear description of when to use this template";
export const Schema = z.object({ /* schema definition */ });
export type LayoutData = z.infer<typeof Schema>;
```

### Template Component Pattern

```typescript
import React from 'react';
import * as z from "zod";
import { ImageSchema, IconSchema } from "../defaultSchemes";

// Template metadata
export const layoutId = "example-slide-layout";
export const layoutName = "Example Slide Layout";
export const layoutDescription = "A template for demonstrating slide structure with title and content";

// Zod schema definition
const exampleSchema = z.object({
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(60, "Title cannot exceed 60 characters")
        .default("Default Title")
        .meta({
            description: "Main slide title - should be concise and descriptive"
        }),
    
    subtitle: z.string()
        .min(10, "Subtitle must be at least 10 characters")
        .max(120, "Subtitle cannot exceed 120 characters")
        .optional()
        .meta({
            description: "Optional subtitle providing additional context"
        }),
    
    content: z.array(
        z.object({
            heading: z.string().min(2).max(50).meta({
                description: "Content section heading"
            }),
            text: z.string().min(10).max(200).meta({
                description: "Content section body text"
            }),
            icon: IconSchema.optional().meta({
                description: "Optional icon to accompany content"
            })
        })
    )
    .min(2, "At least 2 content items required")
    .max(6, "Maximum 6 content items allowed")
    .default([
        {
            heading: "First Point",
            text: "Description of the first key point with relevant details"
        },
        {
            heading: "Second Point", 
            text: "Description of the second key point with supporting information"
        }
    ])
    .meta({
        description: "List of content items to display on the slide"
    }),
    
    backgroundImage: ImageSchema.optional().meta({
        description: "Optional background image for the slide"
    })
});

export const Schema = exampleSchema;
export type ExampleLayoutData = z.infer<typeof exampleSchema>;

// Component interface
interface ExampleLayoutProps {
    data: ExampleLayoutData;
}

// Component implementation
const ExampleLayout: React.FC<ExampleLayoutProps> = ({ data }) => {
    const { title, subtitle, content, backgroundImage } = data;

    return (
        <div className="w-full max-w-[1280px] max-h-[720px] aspect-video bg-white relative mx-auto rounded-sm shadow-lg overflow-hidden">
            {/* Background Image */}
            {backgroundImage && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={backgroundImage.__image_url__}
                        alt={backgroundImage.__image_prompt__}
                        className="w-full h-full object-cover opacity-20"
                    />
                </div>
            )}
            
            {/* Content Container */}
            <div className="relative z-10 h-full p-8 sm:p-12 lg:p-16">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-lg sm:text-xl text-gray-700">
                            {subtitle}
                        </p>
                    )}
                </div>
                
                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {content.map((item, index) => (
                        <div key={index} className="flex items-start space-x-4">
                            {/* Icon */}
                            {item.icon && (
                                <div className="flex-shrink-0 w-12 h-12">
                                    <img
                                        src={item.icon.__icon_url__}
                                        alt={item.icon.__icon_query__}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            
                            {/* Text Content */}
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {item.heading}
                                </h3>
                                <p className="text-base text-gray-700 leading-relaxed">
                                    {item.text}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExampleLayout;
```

## Schema Design Guidelines

### Field Validation Rules
- Always provide `.min()` and `.max()` constraints for strings and arrays
- Include meaningful default values using `.default()`
- Add descriptive metadata with `.meta({ description: "..." })`
- Use appropriate data types (string, number, boolean, array, object)
- Make optional fields truly optional with `.optional()`

### Common Field Patterns

#### Text Fields:
```typescript
// Short titles
title: z.string().min(3).max(60).default("Default Title").meta({
    description: "Concise, descriptive title for the slide"
}),

// Longer descriptions
description: z.string().min(10).max(300).default("Default description").meta({
    description: "Detailed description providing context and information"
}),

// List items
items: z.array(z.string().min(5).max(100)).min(2).max(8).default([
    "First item", "Second item", "Third item"
]).meta({
    description: "List of key points or items to display"
}),
```

#### Media Fields:
```typescript
// Images using the standard schema
mainImage: ImageSchema.meta({
    description: "Primary image for the slide content"
}),

// Icons for decoration or categorization
icon: IconSchema.optional().meta({
    description: "Optional icon to represent the concept"
}),

// Multiple images
gallery: z.array(ImageSchema).min(2).max(6).default([]).meta({
    description: "Collection of images for gallery display"
}),
```

#### Structured Content:
```typescript
// Content sections with multiple fields
sections: z.array(
    z.object({
        title: z.string().min(3).max(50),
        content: z.string().min(10).max(200),
        number: z.string().min(1).max(3),
        isHighlighted: z.boolean().default(false)
    })
).min(3).max(8).default([
    { title: "Section 1", content: "Content for section 1", number: "01", isHighlighted: false },
    { title: "Section 2", content: "Content for section 2", number: "02", isHighlighted: true }
]).meta({
    description: "Structured content sections with numbering and emphasis"
}),
```

### Responsive Design Patterns

#### Container Structure:
```typescript
// Main slide container - always use these dimensions
<div className="w-full max-w-[1280px] max-h-[720px] aspect-video bg-white relative mx-auto rounded-sm shadow-lg">

// Content padding with responsive breakpoints
<div className="p-8 sm:p-12 lg:p-16">

// Grid layouts that adapt to screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

#### Typography Hierarchy:
```typescript
// Main titles
className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900"

// Subtitles
className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800"

// Body text
className="text-base sm:text-lg lg:text-xl text-gray-700"

// Small text
className="text-sm sm:text-base text-gray-600"
```

### Layout Patterns

#### Two-Column Layouts:
```typescript
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
    <div className="flex flex-col justify-center">
        {/* Left content */}
    </div>
    <div className="flex items-center justify-center">
        {/* Right content */}
    </div>
</div>
```

#### Hero Sections:
```typescript
<div className="text-center mb-12">
    <h1 className="text-6xl font-bold mb-6">{title}</h1>
    <p className="text-xl text-gray-700 max-w-2xl mx-auto">{subtitle}</p>
</div>
```

#### Card Grids:
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((item, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">{item.title}</h3>
            <p className="text-gray-700">{item.content}</p>
        </div>
    ))}
</div>
```

## Image and Icon Handling

### Using ImageSchema:
```typescript
// Always check for image existence
{data.heroImage && (
    <div className="w-full h-64 rounded-lg overflow-hidden">
        <img
            src={data.heroImage.__image_url__}
            alt={data.heroImage.__image_prompt__}
            className="w-full h-full object-cover"
        />
    </div>
)}
```

### Using IconSchema:
```typescript
// Icon with fallback handling
{item.icon ? (
    <img
        src={item.icon.__icon_url__}
        alt={item.icon.__icon_query__}
        className="w-8 h-8 object-contain"
    />
) : (
    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
)}
```

## Testing Template Components

### Basic Component Test:
```typescript
import { render, screen } from "@testing-library/react";
import ExampleLayout from "./ExampleLayout";

const mockData = {
    title: "Test Title",
    content: [
        { heading: "Test Heading", text: "Test content" }
    ]
};

test("renders template with provided data", () => {
    render(<ExampleLayout data={mockData} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
});

test("handles optional fields gracefully", () => {
    const minimalData = { title: "Minimal Title", content: [] };
    render(<ExampleLayout data={minimalData} />);
    expect(screen.getByText("Minimal Title")).toBeInTheDocument();
});
```

## Performance Considerations

- Use semantic HTML elements for better accessibility
- Implement proper image loading with alt text
- Avoid inline styles, use Tailwind classes
- Keep component rendering efficient with proper key props
- Handle large datasets with virtualization if needed

## Accessibility Guidelines

- Provide meaningful alt text for all images
- Use proper heading hierarchy (h1, h2, h3)
- Ensure sufficient color contrast
- Support keyboard navigation
- Use semantic HTML elements (nav, section, article)

Always ensure your templates are flexible, accessible, and provide meaningful default content that demonstrates the template's purpose.