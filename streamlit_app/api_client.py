"""
HTTP API Client for Streamlit application.
Provides both real HTTP client and mock API for development/standalone mode.
"""
import os
import httpx
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
import json


@dataclass
class APIResponse:
    """Standardized API response wrapper"""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    errors: Optional[List[str]] = None
    status_code: int = 200


class RealAPIClient:
    """Real HTTP client for communicating with the FastAPI backend"""
    
    def __init__(self, base_url: Optional[str] = None, timeout: float = 30.0) -> None:
        self.base_url = base_url or os.getenv("API_URL", "http://localhost:8000")
        self.timeout = timeout
        self._client: Optional[httpx.Client] = None
    
    @property
    def client(self) -> httpx.Client:
        """Lazy-initialize the HTTP client"""
        if self._client is None:
            self._client = httpx.Client(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={"Content-Type": "application/json"}
            )
        return self._client
    
    def close(self) -> None:
        """Close the HTTP client"""
        if self._client is not None:
            self._client.close()
            self._client = None
    
    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a GET request to the API"""
        try:
            response = self.client.get(endpoint, params=params)
            data = response.json()
            return APIResponse(
                success=data.get("success", response.is_success),
                data=data.get("data", data),
                message=data.get("message"),
                errors=data.get("errors"),
                status_code=response.status_code
            )
        except httpx.ConnectError:
            return APIResponse(
                success=False,
                message="Unable to connect to API server",
                errors=["Connection error: API server is not reachable"],
                status_code=503
            )
        except httpx.TimeoutException:
            return APIResponse(
                success=False,
                message="Request timed out",
                errors=["Timeout error: API request timed out"],
                status_code=504
            )
        except Exception as e:
            return APIResponse(
                success=False,
                message=f"Request failed: {str(e)}",
                errors=[str(e)],
                status_code=500
            )
    
    def post(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a POST request to the API"""
        try:
            response = self.client.post(endpoint, json=json_data)
            data = response.json()
            return APIResponse(
                success=data.get("success", response.is_success),
                data=data.get("data", data),
                message=data.get("message"),
                errors=data.get("errors"),
                status_code=response.status_code
            )
        except httpx.ConnectError:
            return APIResponse(
                success=False,
                message="Unable to connect to API server",
                errors=["Connection error"],
                status_code=503
            )
        except httpx.TimeoutException:
            return APIResponse(
                success=False,
                message="Request timed out",
                errors=["Timeout error"],
                status_code=504
            )
        except Exception as e:
            return APIResponse(
                success=False,
                message=f"Request failed: {str(e)}",
                errors=[str(e)],
                status_code=500
            )
    
    def put(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a PUT request to the API"""
        try:
            response = self.client.put(endpoint, json=json_data)
            data = response.json()
            return APIResponse(
                success=data.get("success", response.is_success),
                data=data.get("data", data),
                message=data.get("message"),
                errors=data.get("errors"),
                status_code=response.status_code
            )
        except Exception as e:
            return APIResponse(
                success=False,
                message=f"Request failed: {str(e)}",
                errors=[str(e)],
                status_code=500
            )
    
    def delete(self, endpoint: str) -> APIResponse:
        """Make a DELETE request to the API"""
        try:
            response = self.client.delete(endpoint)
            data = response.json()
            return APIResponse(
                success=data.get("success", response.is_success),
                data=data.get("data", data),
                message=data.get("message"),
                errors=data.get("errors"),
                status_code=response.status_code
            )
        except Exception as e:
            return APIResponse(
                success=False,
                message=f"Request failed: {str(e)}",
                errors=[str(e)],
                status_code=500
            )
    
    def health_check(self) -> bool:
        """Check if the API is healthy"""
        try:
            response = self.get("/health")
            return response.success and response.status_code == 200
        except Exception:
            return False


class MockAPIClient:
    """Mock API client for standalone/demo mode"""
    
    def __init__(self) -> None:
        # Load demo data
        from streamlit_app.demo_data import DEMO_DATA
        self.data = DEMO_DATA
    
    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Mock GET request"""
        # Parse endpoint to determine data to return
        endpoint_lower = endpoint.lower()
        
        if "/services" in endpoint_lower:
            return APIResponse(success=True, data=self.data["services"])
        elif "/materials" in endpoint_lower:
            return APIResponse(success=True, data=self.data["materials"])
        elif "/projects" in endpoint_lower:
            return APIResponse(success=True, data=self.data["projects"])
        elif "/inspections" in endpoint_lower:
            return APIResponse(success=True, data=self.data["inspections"])
        elif "/time_pairs" in endpoint_lower:
            return APIResponse(success=True, data=self.data["time_pairs"])
        elif "/employees" in endpoint_lower:
            return APIResponse(success=True, data=self.data["employees"])
        elif "/users" in endpoint_lower:
            return APIResponse(success=True, data=self.data["users"])
        elif "/health" in endpoint_lower:
            return APIResponse(success=True, data={"status": "healthy", "mode": "mock"})
        
        return APIResponse(success=True, data=[])
    
    def post(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Mock POST request"""
        return APIResponse(success=True, message="Created successfully (mock mode)")
    
    def put(self, endpoint: str, json_data: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Mock PUT request"""
        return APIResponse(success=True, message="Updated successfully (mock mode)")
    
    def delete(self, endpoint: str) -> APIResponse:
        """Mock DELETE request"""
        return APIResponse(success=True, message="Deleted successfully (mock mode)")
    
    def health_check(self) -> bool:
        """Always return True for mock client"""
        return True
    
    def close(self) -> None:
        """No-op for mock client"""
        pass


def get_api_client() -> Union[RealAPIClient, MockAPIClient]:
    """
    Get the appropriate API client based on environment.
    Returns RealAPIClient if API_URL is set and reachable, otherwise MockAPIClient.
    """
    api_url = os.getenv("API_URL", "")
    use_mock = os.getenv("USE_MOCK_API", "").lower() == "true"
    
    if use_mock:
        return MockAPIClient()
    
    if api_url:
        client = RealAPIClient(api_url)
        if client.health_check():
            return client
        else:
            print("⚠️  API server not reachable, falling back to mock mode")
            client.close()
    
    return MockAPIClient()


# Export
__all__ = [
    "APIResponse",
    "RealAPIClient", 
    "MockAPIClient",
    "get_api_client"
]
