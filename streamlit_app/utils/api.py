"""
API utilities for Streamlit app
"""
import os
import requests
import streamlit as st
from typing import Dict, Any, Optional
import json


def get_api_url():
    """Get API URL from environment or default"""
    return os.getenv("API_URL", "http://localhost:8000")


def get_tenant_id():
    """Get current tenant ID"""
    return os.getenv("TENANT", "demo")


def api_request(method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
    """
    Make API request with tenant context and auth token
    """
    api_url = get_api_url()
    url = f"{api_url}{endpoint}"
    
    # Set default headers
    headers = kwargs.pop('headers', {})
    headers.setdefault('Content-Type', 'application/json')
    
    # Add tenant header if available
    tenant_id = get_tenant_id()
    if tenant_id:
        headers['X-Tenant-ID'] = tenant_id
    
    # Add auth token from session state if available
    access_token = st.session_state.get("access_token", "")
    if access_token:
        headers['Authorization'] = f'Bearer {access_token}'
    
    kwargs['headers'] = headers
    
    try:
        response = requests.request(method, url, **kwargs)
        
        # Handle different response types
        if response.headers.get('content-type', '').startswith('application/json'):
            return response.json()
        else:
            return {
                'success': response.ok,
                'status_code': response.status_code,
                'data': response.text
            }
            
    except requests.exceptions.ConnectionError:
        return {
            'success': False,
            'message': 'Verbindung zum Server fehlgeschlagen. Stellen Sie sicher, dass der Backend-Server läuft.'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'API Fehler: {str(e)}'
        }


def get_api_client():
    """Get configured API client for Streamlit"""
    class APIClient:
        @staticmethod
        def get(endpoint: str, params: Optional[Dict] = None):
            return api_request("GET", endpoint, params=params)
        
        @staticmethod
        def post(endpoint: str, json: Optional[Dict] = None, files: Optional[Dict] = None):
            kwargs = {}
            if json:
                kwargs['json'] = json
            if files:
                kwargs['files'] = files
                # Remove Content-Type header for multipart
                if 'headers' not in kwargs:
                    kwargs['headers'] = {}
                kwargs['headers']['Content-Type'] = None
            return api_request("POST", endpoint, **kwargs)
        
        @staticmethod
        def put(endpoint: str, json: Optional[Dict] = None):
            kwargs = {'json': json} if json else {}
            return api_request("PUT", endpoint, **kwargs)
        
        @staticmethod
        def delete(endpoint: str):
            return api_request("DELETE", endpoint)
    
    return APIClient


# Convenience functions for common operations
def fetch_services():
    """Fetch all services"""
    return api_request("GET", "/api/services/", params={"limit": 1000})


def fetch_projects():
    """Fetch all projects"""
    return api_request("GET", "/api/projects/", params={"limit": 1000})


def fetch_materials():
    """Fetch all materials"""
    return api_request("GET", "/api/materials/", params={"limit": 1000})
