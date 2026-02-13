"""
Grid components for Streamlit app
"""
import streamlit as st
import pandas as pd
from typing import Dict, Any, List, Callable, Optional


def render_editable_grid(
    data: pd.DataFrame,
    key: str,
    on_edit: Optional[Callable] = None,
    on_delete: Optional[Callable] = None,
    on_add: Optional[Callable] = None,
    editable_columns: Optional[List[str]] = None,
    hidden_columns: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Render an editable data grid with action buttons
    """
    # Create a copy for display
    display_df = data.copy()
    
    # Add action column
    if on_edit or on_delete:
        display_df['Aktionen'] = ''
        # Will be populated with buttons via column_config
    
    # Configure column display
    column_config = {}
    
    if hidden_columns:
        for col in hidden_columns:
            if col in display_df.columns:
                column_config[col] = st.column_config.Column(disabled=True, hidden=True)
    
    # Configure editable columns
    if editable_columns:
        for col in editable_columns:
            if col in display_df.columns:
                column_config[col] = st.column_config.Column(disabled=False)
    
    # Configure action column
    if 'Aktionen' in display_df.columns:
        column_config['Aktionen'] = st.column_config.Column(
            disabled=True,
            help="Aktionen für diese Zeile"
        )
    
    # Render dataframe
    edited_df = st.data_editor(
        display_df,
        use_container_width=True,
        key=key,
        column_config=column_config,
        num_rows="fixed" if not on_add else "dynamic",
        hide_index=True
    )
    
    return {
        'edited_rows': st.session_state.get(f'{key}_edited_rows', {}),
        'added_rows': st.session_state.get(f'{key}_added_rows', []),
        'deleted_rows': st.session_state.get(f'{key}_deleted_rows', [])
    }


def render_action_buttons(
    row_id: str,
    edit_callback: Optional[Callable] = None,
    delete_callback: Optional[Callable] = None,
    key_prefix: str = ""
) -> None:
    """
    Render edit/delete action buttons for a table row
    """
    col1, col2 = st.columns(2)
    
    with col1:
        if edit_callback and st.button("✏️", key=f"{key_prefix}edit_{row_id}", help="Bearbeiten"):
            edit_callback(row_id)
    
    with col2:
        if delete_callback and st.button("🗑️", key=f"{key_prefix}delete_{row_id}", help="Löschen"):
            delete_callback(row_id)


def render_paginated_grid(
    data: pd.DataFrame,
    page_size: int = 20,
    key: str = "grid"
) -> pd.DataFrame:
    """
    Render a paginated data grid
    """
    # Pagination
    total_rows = len(data)
    total_pages = (total_rows + page_size - 1) // page_size
    
    # Page selector
    col1, col2, col3 = st.columns([1, 3, 1])
    
    with col1:
        if st.button("⬅️ Vorherige") and st.session_state.get(f'{key}_page', 1) > 1:
            st.session_state[f'{key}_page'] -= 1
            st.rerun()
    
    with col2:
        current_page = st.session_state.get(f'{key}_page', 1)
        st.write(f"Seite {current_page} von {total_pages}")
    
    with col3:
        if st.button("Nächste ➡️") and st.session_state.get(f'{key}_page', 1) < total_pages:
            st.session_state[f'{key}_page'] += 1
            st.rerun()
    
    # Calculate slice
    current_page = st.session_state.get(f'{key}_page', 1)
    start_idx = (current_page - 1) * page_size
    end_idx = min(start_idx + page_size, total_rows)
    
    # Display current page
    page_data = data.iloc[start_idx:end_idx]
    
    st.dataframe(
        page_data,
        use_container_width=True,
        hide_index=True
    )
    
    return page_data


def render_summary_cards(data: Dict[str, Any]) -> None:
    """
    Render summary cards with key metrics
    """
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="Gesamt",
            value=data.get('total', 0),
            delta=data.get('total_delta')
        )
    
    with col2:
        st.metric(
            label="Aktiv",
            value=data.get('active', 0),
            delta=data.get('active_delta')
        )
    
    with col3:
        st.metric(
            label="Inaktiv",
            value=data.get('inactive', 0),
            delta=data.get('inactive_delta')
        )
    
    with col4:
        st.metric(
            label="Durchschnitt",
            value=data.get('average', 0),
            delta=data.get('average_delta')
        )
