"""
AI Chatbot Service for LIS SaaS Platform
Uses OpenAI GPT to answer questions about business data
"""
import os
import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
import uuid

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4-turbo-preview")

# Try to import OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = bool(OPENAI_API_KEY)
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


# System prompt for the chatbot
SYSTEM_PROMPT = """Du bist ein hilfreicher Assistent für ein Handwerksunternehmen. 
Du hast Zugriff auf folgende Geschäftsdaten:

- Projekte: Kundenaufträge mit Status, Datum und Details
- Mitarbeiter: Informationen über das Team
- Zeiterfassung: Arbeitszeiten der Mitarbeiter
- Materialien: Verwendete Materialien und Kosten

Du kannst Fragen über diese Daten beantworten, Statistiken erstellen und Empfehlungen geben.

Wichtig:
- Antworte immer auf Deutsch
- Sei präzise und hilfreich
- Wenn du nicht genug Daten hast, sage das ehrlich
- Formatiere Zahlen mit deutschem Format (Komma als Dezimaltrennzeichen)
- Gib bei Geldbeträgen immer € an

Der Benutzer ist vom Unternehmen und darf alle Daten sehen."""


class ChatbotService:
    """
    AI Chatbot service for querying business data
    """
    
    def __init__(self):
        if OPENAI_AVAILABLE and OPENAI_API_KEY:
            self.client = OpenAI(api_key=OPENAI_API_KEY)
        else:
            self.client = None
    
    def is_available(self) -> bool:
        """Check if chatbot is available"""
        return self.client is not None
    
    async def get_context_data(
        self,
        db: AsyncSession,
        tenant_id: str,
        query: str
    ) -> Dict[str, Any]:
        """
        Fetch relevant context data based on the query.
        This is a simplified version - production would use embeddings/RAG.
        """
        context = {}
        query_lower = query.lower()
        
        # Get project data if query mentions projects
        if any(word in query_lower for word in ['projekt', 'auftrag', 'umzug', 'arbeit', 'kund']):
            context['projects'] = await self._get_project_summary(db, tenant_id)
        
        # Get employee data if query mentions employees
        if any(word in query_lower for word in ['mitarbeiter', 'team', 'personal', 'arbeiter']):
            context['employees'] = await self._get_employee_summary(db, tenant_id)
        
        # Get time tracking data if query mentions hours/time
        if any(word in query_lower for word in ['stunde', 'zeit', 'arbeitszeit', 'dauer']):
            context['time_tracking'] = await self._get_time_summary(db, tenant_id)
        
        # Get general summary if no specific context
        if not context:
            context['summary'] = await self._get_general_summary(db, tenant_id)
        
        return context
    
    async def _get_project_summary(
        self,
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Get project summary for context"""
        from backend.modules.projects.models import Project
        
        # Get recent projects
        query = (
            select(Project)
            .where(Project.tenant_id == uuid.UUID(tenant_id))
            .order_by(Project.project_date.desc())
            .limit(20)
        )
        result = await db.execute(query)
        projects = result.scalars().all()
        
        # Aggregate by status
        status_counts = {}
        for p in projects:
            status = p.status or "Unbekannt"
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "total_count": len(projects),
            "by_status": status_counts,
            "recent": [
                {
                    "code": p.project_code,
                    "name": p.name,
                    "status": p.status,
                    "date": p.project_date.isoformat() if p.project_date else None
                }
                for p in projects[:5]
            ]
        }
    
    async def _get_employee_summary(
        self,
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Get employee summary for context"""
        from backend.modules.users.models import User, Employee
        
        # Get employees
        query = (
            select(Employee)
            .join(User, User.user_id == Employee.user_id)
            .where(User.tenant_id == uuid.UUID(tenant_id))
        )
        result = await db.execute(query)
        employees = result.scalars().all()
        
        return {
            "total_count": len(employees),
            "employees": [
                {
                    "name": f"{e.first_name} {e.last_name}",
                    "department": e.department,
                    "position": e.position
                }
                for e in employees[:10]
            ]
        }
    
    async def _get_time_summary(
        self,
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Get time tracking summary for context"""
        from backend.modules.time_pairs.models import TimePair
        
        # Get recent time entries
        thirty_days_ago = date.today() - timedelta(days=30)
        
        query = (
            select(TimePair)
            .where(TimePair.tenant_id == uuid.UUID(tenant_id))
            .where(TimePair.datum >= thirty_days_ago)
        )
        result = await db.execute(query)
        time_pairs = result.scalars().all()
        
        # Aggregate
        total_hours = sum(float(tp.ges_lis_h or 0) for tp in time_pairs)
        by_employee = {}
        
        for tp in time_pairs:
            emp = tp.mitarbeiter or tp.employee_name or "Unbekannt"
            by_employee[emp] = by_employee.get(emp, 0) + float(tp.ges_lis_h or 0)
        
        return {
            "period": "Letzte 30 Tage",
            "total_hours": round(total_hours, 2),
            "by_employee": {k: round(v, 2) for k, v in by_employee.items()},
            "entry_count": len(time_pairs)
        }
    
    async def _get_general_summary(
        self,
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """Get general business summary"""
        return {
            "note": "Allgemeine Geschäftsübersicht",
            "projects": await self._get_project_summary(db, tenant_id),
            "time": await self._get_time_summary(db, tenant_id)
        }
    
    async def chat(
        self,
        db: AsyncSession,
        tenant_id: str,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Process a chat message and return AI response.
        """
        if not self.is_available():
            return {
                "response": "Der KI-Assistent ist momentan nicht verfügbar. "
                           "Bitte stellen Sie sicher, dass der OpenAI API-Schlüssel konfiguriert ist.",
                "error": "OpenAI not configured"
            }
        
        try:
            # Get relevant context data
            context_data = await self.get_context_data(db, tenant_id, message)
            
            # Build messages
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT}
            ]
            
            # Add context as system message
            context_message = f"Aktuelle Geschäftsdaten:\n{json.dumps(context_data, indent=2, ensure_ascii=False)}"
            messages.append({
                "role": "system",
                "content": context_message
            })
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-6:]:  # Last 6 messages
                    messages.append(msg)
            
            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })
            
            # Call OpenAI
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content
            
            return {
                "response": ai_response,
                "context_used": list(context_data.keys()),
                "model": OPENAI_MODEL,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as e:
            return {
                "response": f"Es ist ein Fehler aufgetreten: {str(e)}",
                "error": str(e)
            }
    
    async def get_quick_insights(
        self,
        db: AsyncSession,
        tenant_id: str
    ) -> List[str]:
        """
        Generate quick insights about the business.
        """
        if not self.is_available():
            return ["KI-Assistent nicht verfügbar"]
        
        try:
            context = await self._get_general_summary(db, tenant_id)
            
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "system", "content": f"Daten: {json.dumps(context, ensure_ascii=False)}"},
                {
                    "role": "user",
                    "content": "Gib mir 3 kurze, wichtige Erkenntnisse aus den Geschäftsdaten. "
                              "Jede Erkenntnis sollte maximal ein Satz sein. "
                              "Formatiere als nummerierte Liste."
                }
            ]
            
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.7,
                max_tokens=300
            )
            
            insights_text = response.choices[0].message.content
            
            # Parse into list
            insights = []
            for line in insights_text.split('\n'):
                line = line.strip()
                if line and (line[0].isdigit() or line.startswith('-')):
                    # Remove numbering
                    clean = line.lstrip('0123456789.-) ').strip()
                    if clean:
                        insights.append(clean)
            
            return insights[:3] if insights else ["Keine Erkenntnisse verfügbar"]
            
        except Exception as e:
            return [f"Fehler: {str(e)}"]


# Global service instance
chatbot_service = ChatbotService()
