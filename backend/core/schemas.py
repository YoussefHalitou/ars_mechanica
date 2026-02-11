"""
Enhanced base Pydantic schemas with modern features
"""
from typing import Optional, Any, Dict, List, Generic, TypeVar, Union
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime
from enum import Enum


# Generic type for pagination
T = TypeVar('T')


class TenantAwareBase(BaseModel):
    """Base schema with tenant_id for multi-tenancy"""
    tenant_id: str = Field(..., description="Tenant identifier")


class TimestampBase(BaseModel):
    """Base schema with timestamp fields"""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ResponseStatus(str, Enum):
    """Response status enumeration"""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ResponseBase(BaseModel, Generic[T]):
    """Enhanced base response schema with generic typing"""
    success: bool = True
    status: ResponseStatus = Field(default=ResponseStatus.SUCCESS)
    message: Optional[str] = None
    data: Optional[T] = None
    errors: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    @model_validator(mode='after')
    def validate_status_consistency(self) -> 'ResponseBase':
        """Validate that status matches success flag"""
        if self.success and self.status == ResponseStatus.ERROR:
            # Auto-correct: if success=True but status=ERROR, set status to SUCCESS
            self.status = ResponseStatus.SUCCESS
        elif not self.success and self.status == ResponseStatus.SUCCESS:
            # Auto-correct: if success=False but status=SUCCESS, set status to ERROR
            self.status = ResponseStatus.ERROR
        return self

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Enhanced paginated response schema"""
    items: List[T]
    total: int
    page: int = Field(ge=1)
    per_page: int = Field(ge=1, le=1000)
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False
    
    @model_validator(mode='after')
    def calculate_pagination_fields(self) -> 'PaginatedResponse':
        """Calculate pagination fields from total, per_page, and page"""
        if self.per_page > 0:
            self.total_pages = (self.total + self.per_page - 1) // self.per_page
        else:
            self.total_pages = 0
        self.has_next = self.page < self.total_pages
        self.has_prev = self.page > 1
        return self


class ConfigResponse(BaseModel):
    """Enhanced tenant configuration response"""
    name: str
    logo_url: str
    primary_color: str
    secondary_color: str
    accent_color: str
    enabled_modules: List[str]
    extra_menu: List[Dict[str, str]] = []
    tenant_id: str
    features: Dict[str, Any] = {}
    settings: Dict[str, Any] = {}
    ui_preferences: Dict[str, Any] = {}
    notifications: Dict[str, Any] = {}
    integrations: Dict[str, Any] = {}
    api_version: str = "2.0.0"


class ErrorResponse(ResponseBase):
    """Error response schema"""
    success: bool = False
    status: ResponseStatus = ResponseStatus.ERROR
    errors: List[str] = []
    error_code: Optional[str] = None
    trace_id: Optional[str] = None


class ValidationError(BaseModel):
    """Validation error details"""
    field: str
    message: str
    value: Optional[Any] = None


class ValidationErrorResponse(ErrorResponse):
    """Validation error response"""
    validation_errors: List[ValidationError] = []


class FileUploadResponse(BaseModel):
    """File upload response"""
    filename: str
    size: int
    content_type: str
    url: str
    download_url: str
    uploaded_at: datetime


class ExportResponse(BaseModel):
    """Export response"""
    format: str = Field(..., description="Export format: csv, xlsx, pdf")
    filename: str
    size: int
    url: str
    expires_at: datetime


class SearchParams(BaseModel):
    """Common search parameters"""
    q: Optional[str] = Field(None, description="Search query")
    filters: Optional[Dict[str, Any]] = Field(None, description="Search filters")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: Optional[str] = Field("asc", description="Sort order: asc, desc")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(25, ge=1, le=1000, description="Items per page")
    date_from: Optional[datetime] = Field(None, description="Date from filter")
    date_to: Optional[datetime] = Field(None, description="Date to filter")
    
    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ['asc', 'desc']:
            raise ValueError('Sort order must be either "asc" or "desc"')
        return v


class BulkOperationRequest(BaseModel):
    """Bulk operation request"""
    operation: str = Field(..., description="Operation: delete, update, export")
    ids: List[str] = Field(..., min_length=1, description="List of IDs to operate on")
    data: Optional[Dict[str, Any]] = Field(None, description="Data for update operation")
    
    @field_validator('operation')
    @classmethod
    def validate_operation(cls, v: str) -> str:
        allowed_ops = ['delete', 'update', 'export', 'duplicate', 'archive']
        if v not in allowed_ops:
            raise ValueError(f'Operation must be one of: {allowed_ops}')
        return v


class BulkOperationResponse(BaseModel):
    """Bulk operation response"""
    operation: str
    processed: int
    succeeded: int
    failed: int
    errors: List[str]
    result: Dict[str, Any]


class NotificationData(BaseModel):
    """Notification data"""
    type: str = Field(..., description="Notification type")
    title: str
    message: str
    action_url: Optional[str] = None
    priority: str = Field("normal", description="Priority: low, normal, high, urgent")
    
    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = ['low', 'normal', 'high', 'urgent']
        if v not in allowed:
            raise ValueError(f'Priority must be one of: {allowed}')
        return v


class WebSocketMessage(BaseModel):
    """WebSocket message"""
    type: str = Field(..., description="Message type")
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None


class RealTimeUpdate(BaseModel):
    """Real-time update message"""
    update_type: str = Field(..., description="Type of update")
    resource_type: str = Field(..., description="Type of resource being updated")
    resource_id: str
    changes: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None


# Export commonly used types
__all__ = [
    "TenantAwareBase",
    "TimestampBase",
    "ResponseBase",
    "PaginatedResponse",
    "ConfigResponse",
    "ErrorResponse",
    "ValidationError",
    "ValidationErrorResponse",
    "FileUploadResponse",
    "ExportResponse",
    "SearchParams",
    "BulkOperationRequest",
    "BulkOperationResponse",
    "NotificationData",
    "WebSocketMessage",
    "RealTimeUpdate",
    "ResponseStatus"
]
