"""
Authentication module for Streamlit frontend
Handles login, token management, and session state
"""
import os
import httpx
import streamlit as st
from datetime import datetime, timezone
from typing import Optional, Dict, Any


API_URL = os.getenv("API_URL", "http://localhost:8000")


def _api_post(endpoint: str, json_data: Dict[str, Any]) -> Dict[str, Any]:
    """Make a POST request to the auth API"""
    try:
        response = httpx.post(
            f"{API_URL}{endpoint}",
            json=json_data,
            timeout=10.0,
        )
        return {"status_code": response.status_code, **response.json()}
    except httpx.ConnectError:
        return {"status_code": 503, "detail": "Backend-Server nicht erreichbar. Bitte prüfen Sie, ob der Server läuft."}
    except Exception as e:
        return {"status_code": 500, "detail": f"Verbindungsfehler: {str(e)}"}


def _api_get(endpoint: str, token: str) -> Dict[str, Any]:
    """Make an authenticated GET request"""
    try:
        response = httpx.get(
            f"{API_URL}{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
        return {"status_code": response.status_code, **response.json()}
    except Exception as e:
        return {"status_code": 500, "detail": str(e)}


def check_auth() -> bool:
    """Check if the user is authenticated"""
    return bool(st.session_state.get("access_token"))


def get_auth_headers() -> Dict[str, str]:
    """Get authorization headers for API requests"""
    token = st.session_state.get("access_token", "")
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}


def do_login(email: str, password: str) -> bool:
    """Attempt to log in and store tokens in session state"""
    result = _api_post("/api/auth/login", {"email": email, "password": password})
    
    if result.get("status_code") == 200 and result.get("access_token"):
        # Store tokens
        st.session_state["access_token"] = result["access_token"]
        st.session_state["refresh_token"] = result.get("refresh_token", "")
        st.session_state["token_type"] = result.get("token_type", "bearer")
        
        # Fetch user profile
        user_info = _api_get("/api/auth/me", result["access_token"])
        if user_info.get("status_code") == 200:
            st.session_state["user"] = {
                "user_id": user_info.get("user_id", ""),
                "email": user_info.get("email", email),
                "role": user_info.get("role", "User"),
                "tenant_id": user_info.get("tenant_id", ""),
                "full_name": user_info.get("full_name", ""),
            }
        else:
            # Use email as fallback
            st.session_state["user"] = {"email": email, "role": "User"}
        
        return True
    else:
        error_msg = result.get("detail", "Anmeldung fehlgeschlagen")
        if isinstance(error_msg, list):
            error_msg = "; ".join(str(e.get("msg", e)) if isinstance(e, dict) else str(e) for e in error_msg)
        st.session_state["login_error"] = error_msg
        return False


def logout():
    """Clear session state and log out"""
    for key in ["access_token", "refresh_token", "token_type", "user", "login_error"]:
        st.session_state.pop(key, None)


def login_page():
    """Render the login page"""
    
    # Center the login form
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("""
        <div style="text-align: center; padding: 2rem 0;">
            <h1 style="font-size: 2.5rem; margin-bottom: 0.2rem;">⚙️ Ars Mechanica</h1>
            <p style="color: #666; font-size: 1.1rem;">Betriebsmanagement-Plattform</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Login form
        with st.form("login_form", clear_on_submit=False):
            st.markdown("### Anmelden")
            
            email = st.text_input(
                "E-Mail",
                placeholder="ihre@email.com",
                key="login_email",
            )
            password = st.text_input(
                "Passwort",
                type="password",
                placeholder="Passwort eingeben",
                key="login_password",
            )
            
            submitted = st.form_submit_button("Anmelden", use_container_width=True, type="primary")
            
            if submitted:
                if not email or not password:
                    st.error("Bitte E-Mail und Passwort eingeben.")
                else:
                    with st.spinner("Wird angemeldet..."):
                        success = do_login(email, password)
                    if success:
                        st.rerun()
                    else:
                        error = st.session_state.pop("login_error", "Anmeldung fehlgeschlagen")
                        st.error(error)
        
        # Demo credentials hint
        st.markdown("---")
        st.caption("Demo-Zugangsdaten:")
        st.code("E-Mail: ella.hoffmann.2@lis-demo.local\nPasswort: demo123", language=None)
        
        # API status
        api_url = os.getenv("API_URL", "http://localhost:8000")
        try:
            resp = httpx.get(f"{api_url}/health", timeout=3.0)
            if resp.status_code == 200:
                st.success(f"API-Server verbunden ({api_url})")
            else:
                st.warning(f"API-Server antwortet mit Status {resp.status_code}")
        except Exception:
            st.error(f"API-Server nicht erreichbar ({api_url})")
