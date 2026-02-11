"""
AI Chatbot API Router
Enterprise tier feature for natural language queries
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from backend.core.database import get_db
from backend.core.auth import get_current_user, CurrentUser
from backend.core.features import require_feature, Feature
from backend.modules.chatbot.service import chatbot_service

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


# ============================================================================
# Pydantic Models
# ============================================================================

class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    conversation_history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str
    context_used: Optional[List[str]] = None
    error: Optional[str] = None


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/status")
async def get_chatbot_status(
    current_user: CurrentUser = Depends(require_feature(Feature.AI_CHATBOT))
):
    """
    Check if chatbot is available and configured.
    Enterprise tier only.
    """
    return {
        "available": chatbot_service.is_available(),
        "tier_required": "enterprise",
        "user_tier": current_user.tier
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: CurrentUser = Depends(require_feature(Feature.AI_CHATBOT)),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a chat message and get AI response.
    Enterprise tier only.
    
    The chatbot can answer questions about:
    - Projects and orders
    - Employees and team
    - Work hours and time tracking
    - Business statistics
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    if not chatbot_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Chatbot is not available. Please configure OpenAI API key."
        )
    
    # Convert history to dict format
    history = None
    if request.conversation_history:
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
    
    result = await chatbot_service.chat(
        db=db,
        tenant_id=current_user.tenant_id,
        message=request.message,
        conversation_history=history
    )
    
    return ChatResponse(
        response=result.get("response", ""),
        context_used=result.get("context_used"),
        error=result.get("error")
    )


@router.get("/insights")
async def get_insights(
    current_user: CurrentUser = Depends(require_feature(Feature.AI_CHATBOT)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get quick AI-generated insights about the business.
    Enterprise tier only.
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant context")
    
    insights = await chatbot_service.get_quick_insights(
        db=db,
        tenant_id=current_user.tenant_id
    )
    
    return {
        "insights": insights,
        "generated_at": "now"
    }


@router.get("/suggestions")
async def get_query_suggestions(
    current_user: CurrentUser = Depends(require_feature(Feature.AI_CHATBOT))
):
    """
    Get suggested questions for the chatbot.
    """
    return {
        "suggestions": [
            "Wie viele Projekte haben wir diesen Monat?",
            "Wer hat die meisten Arbeitsstunden diese Woche?",
            "Was ist unser profitabelstes Projekt?",
            "Zeige mir eine Übersicht der Mitarbeiter",
            "Wie viele Stunden wurden insgesamt gearbeitet?",
            "Welche Projekte sind noch offen?",
            "Gib mir eine Zusammenfassung der letzten 30 Tage"
        ]
    }
