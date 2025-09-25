# Next.js Frontend Development Instructions

## Component Development

### React Component Patterns
- Use functional components with TypeScript interfaces
- Prefer `const` declarations for components
- Use proper TypeScript typing for props and state
- Implement proper error boundaries where needed

### Example Component Structure:
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ComponentProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

const MyComponent: React.FC<ComponentProps> = ({ 
  title, 
  onAction, 
  className 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction?.();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Loading..." : "Action"}
      </Button>
    </div>
  );
};

export default MyComponent;
```

### Styling Guidelines

#### Tailwind CSS Classes
- Use semantic spacing classes (e.g., `space-y-4`, `gap-6`)
- Implement responsive design with breakpoint prefixes (`sm:`, `md:`, `lg:`)
- Use consistent color schemes from the design system
- Prefer utility classes over custom CSS when possible

#### Common Patterns:
```typescript
// Layout containers
className="w-full max-w-[1280px] mx-auto px-8 sm:px-12 lg:px-20 py-8"

// Card components
className="rounded-lg border border-gray-200 p-6 shadow-sm"

// Button variants
className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"

// Text hierarchy
className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900"
className="text-lg text-gray-700 leading-relaxed"
```

### Form Components

#### Using Radix UI Components:
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// Form validation with Zod
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;
```

### API Integration

#### API Call Patterns:
```typescript
const handleApiCall = async () => {
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};
```

### State Management

#### Local State:
```typescript
const [data, setData] = useState<DataType | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

#### Redux Store Usage:
```typescript
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectConfig, updateConfig } from "@/store/slices/configSlice";

const dispatch = useAppDispatch();
const config = useAppSelector(selectConfig);

const handleUpdate = (newValue: string) => {
  dispatch(updateConfig({ key: "value", value: newValue }));
};
```

### Error Handling

#### Toast Notifications:
```typescript
import { toast } from "sonner";

// Success notification
toast.success("Operation completed successfully");

// Error notification
toast.error("Something went wrong");

// Loading with promise
toast.promise(apiCall(), {
  loading: "Processing...",
  success: "Done!",
  error: "Failed to process",
});
```

### Performance Optimization

#### Code Splitting:
```typescript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <div>Loading...</div>,
  ssr: false, // if component doesn't need SSR
});
```

#### Image Optimization:
```typescript
import Image from "next/image";

<Image
  src={imageUrl}
  alt={altText}
  width={400}
  height={300}
  className="object-cover rounded-lg"
  priority // for above-the-fold images
/>
```

### Accessibility Guidelines

- Always provide `alt` text for images
- Use semantic HTML elements
- Include proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

### Testing Patterns

#### Component Testing:
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("renders component with title", () => {
  render(<MyComponent title="Test Title" />);
  expect(screen.getByText("Test Title")).toBeInTheDocument();
});

test("handles click events", async () => {
  const mockOnAction = jest.fn();
  render(<MyComponent title="Test" onAction={mockOnAction} />);
  
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => {
    expect(mockOnAction).toHaveBeenCalled();
  });
});
```

Always prioritize user experience, accessibility, and code maintainability when developing frontend components.