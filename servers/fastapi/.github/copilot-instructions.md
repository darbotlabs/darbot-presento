# FastAPI Backend Development Instructions

## API Development Guidelines

### FastAPI Patterns
- Use async/await for all route handlers
- Implement proper type hints for all functions
- Use Pydantic models for request/response validation
- Follow RESTful API conventions
- Implement proper error handling with custom exceptions

### Route Handler Structure:
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/v1", tags=["example"])

class ExampleRequest(BaseModel):
    name: str
    description: Optional[str] = None
    items: List[str] = []

class ExampleResponse(BaseModel):
    id: int
    name: str
    status: str

@router.post("/example", response_model=ExampleResponse)
async def create_example(
    request: ExampleRequest,
    current_user = Depends(get_current_user)
) -> ExampleResponse:
    """
    Create a new example resource.
    
    Args:
        request: The example data to create
        current_user: The authenticated user
        
    Returns:
        ExampleResponse: The created example resource
        
    Raises:
        HTTPException: 400 if validation fails
        HTTPException: 404 if resource not found
    """
    try:
        # Validate input
        if not request.name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        
        # Business logic
        result = await example_service.create(request)
        
        return ExampleResponse(
            id=result.id,
            name=result.name,
            status="created"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create example: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Pydantic Models

#### Request/Response Models:
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class StatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class PresentationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    template_id: str = Field(..., min_length=1)
    slides: List[Dict[str, Any]] = Field(default_factory=list)
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class PresentationResponse(BaseModel):
    id: str
    title: str
    status: StatusEnum
    created_at: datetime
    download_url: Optional[str] = None
    
    class Config:
        use_enum_values = True
```

### Service Layer Pattern

#### Business Logic Services:
```python
from abc import ABC, abstractmethod
from typing import List, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class PresentationService:
    """Service for handling presentation operations."""
    
    def __init__(self, ai_client, storage_client):
        self.ai_client = ai_client
        self.storage_client = storage_client
    
    async def create_presentation(
        self, 
        request: PresentationRequest
    ) -> PresentationResponse:
        """Create a new presentation using AI."""
        try:
            # Generate slides using AI
            slides = await self.ai_client.generate_slides(
                title=request.title,
                description=request.description,
                template_id=request.template_id
            )
            
            # Save presentation
            presentation_id = await self.storage_client.save_presentation({
                "title": request.title,
                "slides": slides,
                "status": "completed"
            })
            
            return PresentationResponse(
                id=presentation_id,
                title=request.title,
                status=StatusEnum.COMPLETED,
                created_at=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Failed to create presentation: {e}")
            raise
    
    async def get_presentation(self, presentation_id: str) -> Optional[PresentationResponse]:
        """Retrieve a presentation by ID."""
        data = await self.storage_client.get_presentation(presentation_id)
        if not data:
            return None
            
        return PresentationResponse(**data)
```

### AI Integration Patterns

#### AI Client Implementation:
```python
from openai import AsyncOpenAI
from google.generativeai import GenerativeModel
import anthropic
from typing import Dict, Any, List

class AIProvider:
    """Multi-provider AI client."""
    
    def __init__(self, provider: str, api_key: str, model: str):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self._client = self._initialize_client()
    
    def _initialize_client(self):
        if self.provider == "openai":
            return AsyncOpenAI(api_key=self.api_key)
        elif self.provider == "google":
            return GenerativeModel(self.model)
        elif self.provider == "anthropic":
            return anthropic.AsyncAnthropic(api_key=self.api_key)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    async def generate_structured_output(
        self, 
        prompt: str, 
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate structured output using the configured AI provider."""
        try:
            if self.provider == "openai":
                response = await self._client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.7
                )
                return json.loads(response.choices[0].message.content)
                
            # Add implementations for other providers
            
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            raise
```

### Error Handling

#### Custom Exceptions:
```python
class PresentoException(Exception):
    """Base exception for Presento application."""
    pass

class ValidationError(PresentoException):
    """Raised when input validation fails."""
    pass

class AIServiceError(PresentoException):
    """Raised when AI service operations fail."""
    pass

class StorageError(PresentoException):
    """Raised when storage operations fail."""
    pass

# Exception handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "validation_error", "message": str(exc)}
    )

@app.exception_handler(AIServiceError)
async def ai_service_exception_handler(request, exc):
    logger.error(f"AI service error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"error": "ai_service_unavailable", "message": "AI service temporarily unavailable"}
    )
```

### Environment Configuration

#### Configuration Management:
```python
from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # AI provider settings
    llm_provider: str = "openai"
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    google_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # Feature flags
    web_grounding: bool = False
    tool_calls: bool = True
    disable_thinking: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### Testing Patterns

#### API Testing:
```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

@pytest.fixture
def client():
    from api.main import app
    return TestClient(app)

@pytest.fixture
def mock_ai_service():
    return AsyncMock()

def test_create_presentation(client, mock_ai_service):
    """Test presentation creation endpoint."""
    request_data = {
        "title": "Test Presentation",
        "description": "Test description",
        "template_id": "professional-template"
    }
    
    with patch('api.services.presentation.AIProvider') as mock_provider:
        mock_provider.return_value = mock_ai_service
        mock_ai_service.generate_slides.return_value = [
            {"type": "title", "content": {"title": "Test Slide"}}
        ]
        
        response = client.post("/api/v1/presentations", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Presentation"
        assert data["status"] == "completed"

@pytest.mark.asyncio
async def test_presentation_service():
    """Test presentation service logic."""
    service = PresentationService(
        ai_client=AsyncMock(),
        storage_client=AsyncMock()
    )
    
    service.ai_client.generate_slides.return_value = []
    service.storage_client.save_presentation.return_value = "test-id"
    
    request = PresentationRequest(
        title="Test",
        template_id="template-1"
    )
    
    result = await service.create_presentation(request)
    assert result.title == "Test"
    assert result.status == StatusEnum.COMPLETED
```

### Logging and Monitoring

#### Structured Logging:
```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
            
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
            
        return json.dumps(log_entry)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
```

### Security Best Practices

- Always validate and sanitize input data
- Use environment variables for sensitive configuration
- Implement proper authentication and authorization
- Log security-related events
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Sanitize data before logging to prevent log injection

Always prioritize security, performance, and maintainability when developing backend services.