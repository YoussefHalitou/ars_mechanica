"""
Morningplan Streamlit module
Optimized UI for Prä, Inter, and Post Morningplan management
"""
import streamlit as st
import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, timedelta

async def render_morningplan_page():
    """Render the Morningplan management page"""
    
    # Import the actual UI from backend modules
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
    
    from backend.modules.morningplan.streamlit import run_morningplan_ui
    
    await run_morningplan_ui()


if __name__ == "__main__":
    asyncio.run(render_morningplan_page())
