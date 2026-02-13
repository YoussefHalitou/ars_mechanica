"""
Stripe billing service for LIS SaaS Platform
Handles subscription management, checkout, and webhooks
"""
import os
import stripe
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uuid

from backend.modules.users.models import Tenant, Subscription
from backend.modules.billing.models import PaymentMethod, Invoice, WebhookEvent

# Stripe configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Price IDs for each tier (set in Stripe Dashboard)
STRIPE_PRICES = {
    "starter": {
        "monthly": os.getenv("STRIPE_PRICE_STARTER_MONTHLY", "price_starter_monthly"),
        "yearly": os.getenv("STRIPE_PRICE_STARTER_YEARLY", "price_starter_yearly")
    },
    "professional": {
        "monthly": os.getenv("STRIPE_PRICE_PROFESSIONAL_MONTHLY", "price_professional_monthly"),
        "yearly": os.getenv("STRIPE_PRICE_PROFESSIONAL_YEARLY", "price_professional_yearly")
    },
    "enterprise": {
        "monthly": os.getenv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "price_enterprise_monthly"),
        "yearly": os.getenv("STRIPE_PRICE_ENTERPRISE_YEARLY", "price_enterprise_yearly")
    }
}

# Initialize Stripe
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


class StripeService:
    """
    Service for Stripe operations
    """
    
    @staticmethod
    def is_configured() -> bool:
        """Check if Stripe is properly configured"""
        return bool(STRIPE_SECRET_KEY)
    
    # =========================================================================
    # Customer Management
    # =========================================================================
    
    @staticmethod
    async def create_customer(
        email: str,
        name: str,
        metadata: Optional[Dict[str, str]] = None
    ) -> Optional[stripe.Customer]:
        """Create a Stripe customer"""
        if not StripeService.is_configured():
            return None
        
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer
        except stripe.error.StripeError as e:
            print(f"Stripe error creating customer: {e}")
            return None
    
    @staticmethod
    async def get_customer(customer_id: str) -> Optional[stripe.Customer]:
        """Get a Stripe customer by ID"""
        if not StripeService.is_configured():
            return None
        
        try:
            return stripe.Customer.retrieve(customer_id)
        except stripe.error.StripeError:
            return None
    
    # =========================================================================
    # Subscription Management
    # =========================================================================
    
    @staticmethod
    async def create_subscription(
        customer_id: str,
        price_id: str,
        trial_days: int = 7
    ) -> Optional[stripe.Subscription]:
        """Create a new subscription with trial"""
        if not StripeService.is_configured():
            return None
        
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                trial_period_days=trial_days,
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )
            return subscription
        except stripe.error.StripeError as e:
            print(f"Stripe error creating subscription: {e}")
            return None
    
    @staticmethod
    async def update_subscription(
        subscription_id: str,
        new_price_id: str
    ) -> Optional[stripe.Subscription]:
        """Update subscription to new price (upgrade/downgrade)"""
        if not StripeService.is_configured():
            return None
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Update the subscription item
            stripe.Subscription.modify(
                subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0].id,
                    "price": new_price_id
                }],
                proration_behavior="create_prorations"
            )
            
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            print(f"Stripe error updating subscription: {e}")
            return None
    
    @staticmethod
    async def cancel_subscription(
        subscription_id: str,
        at_period_end: bool = True
    ) -> Optional[stripe.Subscription]:
        """Cancel a subscription"""
        if not StripeService.is_configured():
            return None
        
        try:
            if at_period_end:
                return stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                return stripe.Subscription.delete(subscription_id)
        except stripe.error.StripeError as e:
            print(f"Stripe error canceling subscription: {e}")
            return None
    
    @staticmethod
    async def reactivate_subscription(subscription_id: str) -> Optional[stripe.Subscription]:
        """Reactivate a canceled subscription"""
        if not StripeService.is_configured():
            return None
        
        try:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
        except stripe.error.StripeError as e:
            print(f"Stripe error reactivating subscription: {e}")
            return None
    
    # =========================================================================
    # Checkout Sessions
    # =========================================================================
    
    @staticmethod
    async def create_checkout_session(
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        mode: str = "subscription",
        trial_days: Optional[int] = None
    ) -> Optional[stripe.checkout.Session]:
        """Create a Stripe Checkout session"""
        if not StripeService.is_configured():
            return None
        
        try:
            params = {
                "customer": customer_id,
                "line_items": [{"price": price_id, "quantity": 1}],
                "mode": mode,
                "success_url": success_url,
                "cancel_url": cancel_url,
                "allow_promotion_codes": True
            }
            
            if trial_days and mode == "subscription":
                params["subscription_data"] = {
                    "trial_period_days": trial_days
                }
            
            session = stripe.checkout.Session.create(**params)
            return session
        except stripe.error.StripeError as e:
            print(f"Stripe error creating checkout session: {e}")
            return None
    
    # =========================================================================
    # Customer Portal
    # =========================================================================
    
    @staticmethod
    async def create_portal_session(
        customer_id: str,
        return_url: str
    ) -> Optional[stripe.billing_portal.Session]:
        """Create a customer portal session for self-service billing"""
        if not StripeService.is_configured():
            return None
        
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            return session
        except stripe.error.StripeError as e:
            print(f"Stripe error creating portal session: {e}")
            return None
    
    # =========================================================================
    # Webhook Handling
    # =========================================================================
    
    @staticmethod
    def construct_webhook_event(
        payload: bytes,
        sig_header: str
    ) -> Optional[stripe.Event]:
        """Verify and construct webhook event"""
        if not STRIPE_WEBHOOK_SECRET:
            return None
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError:
            # Invalid payload
            return None
        except stripe.error.SignatureVerificationError:
            # Invalid signature
            return None


class BillingService:
    """
    Database operations for billing
    """
    
    # =========================================================================
    # Subscription Database Operations
    # =========================================================================
    
    @staticmethod
    async def get_subscription_by_tenant(
        db: AsyncSession,
        tenant_id: uuid.UUID
    ) -> Optional[Subscription]:
        """Get subscription for a tenant"""
        result = await db.execute(
            select(Subscription).where(Subscription.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_subscription_from_stripe(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        stripe_subscription: stripe.Subscription
    ) -> Subscription:
        """Update local subscription from Stripe data"""
        sub = await BillingService.get_subscription_by_tenant(db, tenant_id)
        
        if not sub:
            raise ValueError(f"Subscription not found for tenant {tenant_id}")
        
        # Map Stripe status to our status
        status_map = {
            "trialing": "trialing",
            "active": "active",
            "past_due": "past_due",
            "canceled": "canceled",
            "unpaid": "past_due",
            "incomplete": "trialing",
            "incomplete_expired": "canceled"
        }
        
        sub.stripe_subscription_id = stripe_subscription.id
        sub.status = status_map.get(stripe_subscription.status, stripe_subscription.status)
        sub.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
        sub.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
        
        if stripe_subscription.trial_end:
            sub.trial_ends_at = datetime.fromtimestamp(stripe_subscription.trial_end)
        
        if stripe_subscription.cancel_at:
            sub.cancel_at = datetime.fromtimestamp(stripe_subscription.cancel_at)
        
        if stripe_subscription.canceled_at:
            sub.canceled_at = datetime.fromtimestamp(stripe_subscription.canceled_at)
        
        return sub
    
    @staticmethod
    async def change_tier(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        new_tier: str
    ) -> Subscription:
        """Change subscription tier"""
        sub = await BillingService.get_subscription_by_tenant(db, tenant_id)
        
        if not sub:
            raise ValueError(f"Subscription not found for tenant {tenant_id}")
        
        # Update tier and limits
        tier_limits = {
            "starter": {"max_users": 3, "max_projects": 50},
            "professional": {"max_users": 10, "max_projects": 200},
            "enterprise": {"max_users": 9999, "max_projects": 99999}
        }
        
        limits = tier_limits.get(new_tier, tier_limits["starter"])
        sub.tier = new_tier
        sub.max_users = limits["max_users"]
        sub.max_projects = limits["max_projects"]
        
        return sub
    
    # =========================================================================
    # Invoice Operations
    # =========================================================================
    
    @staticmethod
    async def create_invoice_from_stripe(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        stripe_invoice: stripe.Invoice
    ) -> Invoice:
        """Create or update invoice from Stripe data"""
        # Check if invoice already exists
        result = await db.execute(
            select(Invoice).where(Invoice.stripe_invoice_id == stripe_invoice.id)
        )
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            invoice = Invoice(
                invoice_id=uuid.uuid4(),
                tenant_id=tenant_id,
                stripe_invoice_id=stripe_invoice.id
            )
            db.add(invoice)
        
        # Update invoice details
        invoice.invoice_number = stripe_invoice.number
        invoice.status = stripe_invoice.status
        invoice.subtotal = stripe_invoice.subtotal
        invoice.tax = stripe_invoice.tax or 0
        invoice.total = stripe_invoice.total
        invoice.amount_paid = stripe_invoice.amount_paid
        invoice.amount_due = stripe_invoice.amount_due
        invoice.currency = stripe_invoice.currency.upper()
        
        if stripe_invoice.period_start:
            invoice.period_start = datetime.fromtimestamp(stripe_invoice.period_start)
        if stripe_invoice.period_end:
            invoice.period_end = datetime.fromtimestamp(stripe_invoice.period_end)
        
        invoice.invoice_pdf = stripe_invoice.invoice_pdf
        invoice.hosted_invoice_url = stripe_invoice.hosted_invoice_url
        
        if stripe_invoice.due_date:
            invoice.due_date = datetime.fromtimestamp(stripe_invoice.due_date).date()
        
        if stripe_invoice.status == "paid" and not invoice.paid_at:
            invoice.paid_at = datetime.utcnow()
        
        return invoice
    
    @staticmethod
    async def get_invoices_for_tenant(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        limit: int = 10
    ) -> List[Invoice]:
        """Get invoices for a tenant"""
        result = await db.execute(
            select(Invoice)
            .where(Invoice.tenant_id == tenant_id)
            .order_by(Invoice.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
    
    # =========================================================================
    # Webhook Event Logging
    # =========================================================================
    
    @staticmethod
    async def log_webhook_event(
        db: AsyncSession,
        event_id: str,
        event_type: str,
        payload: dict
    ) -> WebhookEvent:
        """Log a webhook event"""
        webhook_event = WebhookEvent(
            event_id=event_id,
            event_type=event_type,
            payload=payload,
            status="pending"
        )
        db.add(webhook_event)
        return webhook_event
    
    @staticmethod
    async def mark_webhook_processed(
        db: AsyncSession,
        event_id: str,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> None:
        """Mark a webhook event as processed"""
        await db.execute(
            update(WebhookEvent)
            .where(WebhookEvent.event_id == event_id)
            .values(
                status="processed" if success else "failed",
                error_message=error_message,
                processed_at=datetime.utcnow()
            )
        )
    
    @staticmethod
    async def is_webhook_processed(
        db: AsyncSession,
        event_id: str
    ) -> bool:
        """Check if a webhook event has already been processed"""
        result = await db.execute(
            select(WebhookEvent).where(
                WebhookEvent.event_id == event_id,
                WebhookEvent.status == "processed"
            )
        )
        return result.scalar_one_or_none() is not None


# Utility functions
def get_price_id(tier: str, interval: str = "monthly") -> str:
    """Get Stripe price ID for a tier and billing interval"""
    return STRIPE_PRICES.get(tier, {}).get(interval, "")
