"""
Form components for Streamlit app
"""
import streamlit as st
from typing import Dict, Any, Optional


def render_service_form(
    service_data: Optional[Dict[str, Any]] = None,
    key_prefix: str = ""
) -> Dict[str, Any]:
    """
    Render a service form for create/edit operations
    """
    is_edit = service_data is not None
    
    with st.form(f"{key_prefix}service_form"):
        # Name (required)
        name = st.text_input(
            "Bezeichnung *",
            value=service_data.get('name', '') if is_edit else '',
            key=f"{key_prefix}_name"
        )
        
        # Description
        description = st.text_area(
            "Beschreibung",
            value=service_data.get('description', '') if is_edit else '',
            key=f"{key_prefix}_description"
        )
        
        # Category
        category = st.text_input(
            "Kategorie",
            value=service_data.get('category', '') if is_edit else '',
            key=f"{key_prefix}_category"
        )
        
        # Unit selection
        unit_options = ["Stunde", "m²", "Pauschal", "Stück", "lfdm", "kg"]
        unit_default = service_data.get('unit', 'Stunde') if is_edit else 'Stunde'
        unit = st.selectbox(
            "Einheit",
            options=unit_options,
            index=unit_options.index(unit_default) if unit_default in unit_options else 0,
            key=f"{key_prefix}_unit"
        )
        
        # Pricing
        col1, col2 = st.columns(2)
        
        with col1:
            price_per_unit = st.number_input(
                "Preis pro Einheit *",
                min_value=0.0,
                step=0.01,
                value=float(service_data.get('price_per_unit', 0)) if is_edit else 0.0,
                key=f"{key_prefix}_price"
            )
        
        with col2:
            cost_per_unit = st.number_input(
                "Kosten pro Einheit",
                min_value=0.0,
                step=0.01,
                value=float(service_data.get('cost_per_unit', 0)) if is_edit and service_data.get('cost_per_unit') else 0.0,
                key=f"{key_prefix}_cost"
            )
        
        # Active status
        active = st.checkbox(
            "Aktiv",
            value=service_data.get('active', True) if is_edit else True,
            key=f"{key_prefix}_active"
        )
        
        # Submit buttons
        col1, col2 = st.columns(2)
        
        with col1:
            submit = st.form_submit_button("💾 Speichern", use_container_width=True)
        
        with col2:
            cancel = st.form_submit_button("❌ Abbrechen", use_container_width=True)
        
        if submit:
            return {
                'submitted': True,
                'data': {
                    'name': name,
                    'description': description or None,
                    'category': category or None,
                    'unit': unit,
                    'price_per_unit': price_per_unit,
                    'cost_per_unit': cost_per_unit if cost_per_unit > 0 else None,
                    'active': active
                }
            }
        
        if cancel:
            return {'cancelled': True}
    
    return {'submitted': False}


def render_project_form(
    project_data: Optional[Dict[str, Any]] = None,
    key_prefix: str = ""
) -> Dict[str, Any]:
    """
    Render a project form
    """
    # TODO: Implement project form
    st.write("Project form not implemented yet")
    return {'submitted': False}


def render_material_form(
    material_data: Optional[Dict[str, Any]] = None,
    key_prefix: str = ""
) -> Dict[str, Any]:
    """
    Render a material form
    """
    # TODO: Implement material form
    st.write("Material form not implemented yet")
    return {'submitted': False}


def render_search_filter(
    columns: list,
    key_prefix: str = ""
) -> Dict[str, Any]:
    """
    Render a search and filter bar
    """
    with st.expander("🔍 Suche & Filter"):
        search_term = st.text_input("Suche", key=f"{key_prefix}_search")
        
        filters = {}
        for col in columns:
            filter_value = st.text_input(f"Filter {col}", key=f"{key_prefix}_filter_{col}")
            if filter_value:
                filters[col] = filter_value
        
        return {
            'search': search_term,
            'filters': filters
        }
