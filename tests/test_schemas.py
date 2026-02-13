"""
Tests for Pydantic schemas.
"""
import pytest
from datetime import datetime
from pydantic import ValidationError

from backend.core.schemas import (
    ResponseBase,
    ResponseStatus,
    PaginatedResponse,
    SearchParams,
    BulkOperationRequest,
    NotificationData
)


class TestResponseBase:
    """Tests for ResponseBase schema."""
    
    def test_default_values(self):
        """Test that default values are correctly set."""
        response = ResponseBase()
        assert response.success is True
        assert response.status == ResponseStatus.SUCCESS
        assert response.message is None
        assert response.data is None
    
    def test_success_with_data(self):
        """Test successful response with data."""
        response = ResponseBase(success=True, data={"key": "value"})
        assert response.success is True
        assert response.data == {"key": "value"}
    
    def test_error_response_auto_corrects_status(self):
        """Test that error response auto-corrects status."""
        response = ResponseBase(success=False, status=ResponseStatus.SUCCESS)
        assert response.status == ResponseStatus.ERROR
    
    def test_success_response_auto_corrects_status(self):
        """Test that success response auto-corrects status."""
        response = ResponseBase(success=True, status=ResponseStatus.ERROR)
        assert response.status == ResponseStatus.SUCCESS


class TestPaginatedResponse:
    """Tests for PaginatedResponse schema."""
    
    def test_pagination_calculation(self):
        """Test pagination fields are calculated correctly."""
        response = PaginatedResponse(
            items=[1, 2, 3],
            total=10,
            page=1,
            per_page=3
        )
        assert response.total_pages == 4
        assert response.has_next is True
        assert response.has_prev is False
    
    def test_last_page(self):
        """Test pagination on last page."""
        response = PaginatedResponse(
            items=[10],
            total=10,
            page=4,
            per_page=3
        )
        assert response.has_next is False
        assert response.has_prev is True
    
    def test_single_page(self):
        """Test pagination with single page."""
        response = PaginatedResponse(
            items=[1, 2],
            total=2,
            page=1,
            per_page=10
        )
        assert response.total_pages == 1
        assert response.has_next is False
        assert response.has_prev is False


class TestSearchParams:
    """Tests for SearchParams schema."""
    
    def test_default_values(self):
        """Test default search parameters."""
        params = SearchParams()
        assert params.page == 1
        assert params.per_page == 25
        assert params.sort_order == "asc"
    
    def test_invalid_sort_order(self):
        """Test that invalid sort order raises validation error."""
        with pytest.raises(ValidationError):
            SearchParams(sort_order="invalid")
    
    def test_valid_sort_orders(self):
        """Test valid sort orders."""
        params_asc = SearchParams(sort_order="asc")
        params_desc = SearchParams(sort_order="desc")
        assert params_asc.sort_order == "asc"
        assert params_desc.sort_order == "desc"


class TestBulkOperationRequest:
    """Tests for BulkOperationRequest schema."""
    
    def test_valid_operations(self):
        """Test valid bulk operations."""
        for op in ['delete', 'update', 'export', 'duplicate', 'archive']:
            request = BulkOperationRequest(operation=op, ids=['1', '2'])
            assert request.operation == op
    
    def test_invalid_operation(self):
        """Test that invalid operation raises validation error."""
        with pytest.raises(ValidationError):
            BulkOperationRequest(operation="invalid", ids=['1'])
    
    def test_empty_ids_rejected(self):
        """Test that empty ids list is rejected."""
        with pytest.raises(ValidationError):
            BulkOperationRequest(operation="delete", ids=[])


class TestNotificationData:
    """Tests for NotificationData schema."""
    
    def test_default_priority(self):
        """Test default priority is normal."""
        notification = NotificationData(
            type="test",
            title="Test",
            message="Test message"
        )
        assert notification.priority == "normal"
    
    def test_valid_priorities(self):
        """Test valid priorities."""
        for priority in ['low', 'normal', 'high', 'urgent']:
            notification = NotificationData(
                type="test",
                title="Test",
                message="Test message",
                priority=priority
            )
            assert notification.priority == priority
    
    def test_invalid_priority(self):
        """Test that invalid priority raises validation error."""
        with pytest.raises(ValidationError):
            NotificationData(
                type="test",
                title="Test",
                message="Test message",
                priority="invalid"
            )
