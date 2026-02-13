"""
Billing module for LIS SaaS Platform
Handles Stripe integration, subscriptions, and invoices
"""
from backend.modules.billing.router import router

__all__ = ["router"]
