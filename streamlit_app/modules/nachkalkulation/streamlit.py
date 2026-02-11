"""
Nachkalkulation Streamlit module
Optimized UI for post-calculation management
"""
import streamlit as st
import asyncio
import sys
from pathlib import Path
from datetime import datetime, date, timedelta

async def render_nachkalkulation_page():
    """Render the Nachkalkulation management page"""
    
    # Import the actual UI from backend modules
    sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
    
    from backend.modules.nachkalkulation.streamlit import run_nachkalkulation_ui
    
    await run_nachkalkulation_ui()


if __name__ == "__main__":
    asyncio.run(render_nachkalkulation_page())
