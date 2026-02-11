"""
Export utilities for Streamlit application
"""
import pandas as pd
import io
from typing import Any, Dict, List


def export_to_csv(df: pd.DataFrame) -> str:
    """Export DataFrame to CSV format"""
    output = io.StringIO()
    df.to_csv(output, index=False, encoding='utf-8-sig')
    return output.getvalue()


def export_to_excel(df: pd.DataFrame) -> bytes:
    """Export DataFrame to Excel format"""
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Leistungen')
    return output.getvalue()


def export_to_pdf(data: List[Dict[str, Any]], title: str = "Export") -> bytes:
    """Export data to PDF format (placeholder)"""
    # This would integrate with a PDF library like reportlab
    # For now, return empty bytes
    return b""


def format_currency(value: float, currency: str = "EUR") -> str:
    """Format currency value"""
    if currency == "EUR":
        return f"€ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{currency} {value:,.2f}"


def format_date(date_value, format_str: str = "%d.%m.%Y") -> str:
    """Format date value"""
    if hasattr(date_value, 'strftime'):
        return date_value.strftime(format_str)
    return str(date_value)


def prepare_export_data(data: List[Dict[str, Any]], columns: List[str] = None) -> pd.DataFrame:
    """Prepare data for export"""
    df = pd.DataFrame(data)
    
    if columns:
        # Select and rename columns
        df = df[columns]
    
    # Clean up data for export
    for col in df.columns:
        if df[col].dtype == 'object':
            # Convert boolean values to readable format
            if df[col].dtype == 'bool' or (df[col].dropna().apply(lambda x: isinstance(x, bool)).all()):
                df[col] = df[col].apply(lambda x: 'Ja' if x else 'Nein' if pd.notna(x) else '')
    
    return df


class ExportFormatter:
    """Helper class for formatting export data"""
    
    def __init__(self, locale: str = "de_DE"):
        self.locale = locale
    
    def format_number(self, value: float, decimals: int = 2) -> str:
        """Format number according to locale"""
        if self.locale == "de_DE":
            return f"{value:,.{decimals}f}".replace(",", "X").replace(".", ",").replace("X", ".")
        return f"{value:,.{decimals}f}"
    
    def format_percentage(self, value: float) -> str:
        """Format percentage"""
        return f"{value:.1f}%"
    
    def format_boolean(self, value: bool) -> str:
        """Format boolean value"""
        if self.locale == "de_DE":
            return "Ja" if value else "Nein"
        return "Yes" if value else "No"


# Export formatter instance
export_formatter = ExportFormatter()
