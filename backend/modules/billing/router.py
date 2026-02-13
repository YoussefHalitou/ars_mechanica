"""
Billing API Router
Handles subscription management, checkout, and Stripe webhooks
"""
import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from backend.core.database import get_db
from backend.core.auth import get_current_user, CurrentUser, require_role
from backend.modules.users.models import Tenant, Subscription
from backend.modules.billing.service import StripeService, BillingService, get_price_id
from backend.modules.billing.models import Invoice

router = APIRouter(prefix="/api/billing", tags=["billing"])


# ============================================================================
# Pydantic Models
# ============================================================================

class CreateCheckoutRequest(BaseModel):
    """Request to create a checkout session"""
    tier: str  # starter, professional, enterprise
    interval: str = "monthly"  # monthly, yearly
    success_url: str
    cancel_url: str


class CreatePortalRequest(BaseModel):
    """Request to create a customer portal session"""
    return_url: str


class ChangeTierRequest(BaseModel):
    """Request to change subscription tier"""
    new_tier: str
    interval: str = "monthly"


class SubscriptionResponse(BaseModel):
    """Subscription response"""
    subscription_id: str
    tenant_id: str
    tier: str
    status: str
    trial_ends_at: Optional[str]
    current_period_start: Optional[str]
    current_period_end: Optional[str]
    cancel_at: Optional[str]
    max_users: int
    max_projects: int


class InvoiceResponse(BaseModel):
    """Invoice response"""
    invoice_id: str
    invoice_number: Optional[str]
    status: str
    total: int
    currency: str
    period_start: Optional[str]
    period_end: Optional[str]
    invoice_pdf: Optional[str]
    paid_at: Optional[str]


# ============================================================================
# Subscription Endpoints
# ============================================================================

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current tenant's subscription"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=404, detail="No tenant associated with user")
    
    sub = await BillingService.get_subscription_by_tenant(
        db, uuid.UUID(current_user.tenant_id)
    )
    
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return SubscriptionResponse(
        subscription_id=str(sub.subscription_id),
        tenant_id=str(sub.tenant_id),
        tier=sub.tier,
        status=sub.status,
        trial_ends_at=sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
        current_period_start=sub.current_period_start.isoformat() if sub.current_period_start else None,
        current_period_end=sub.current_period_end.isoformat() if sub.current_period_end else None,
        cancel_at=sub.cancel_at.isoformat() if sub.cancel_at else None,
        max_users=sub.max_users,
        max_projects=sub.max_projects
    )


@router.post("/checkout")
async def create_checkout(
    request: CreateCheckoutRequest,
    current_user: CurrentUser = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Checkout session for subscription"""
    if not StripeService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is not configured"
        )
    
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with user")
    
    # Get tenant
    result = await db.execute(
        select(Tenant).where(Tenant.tenant_id == uuid.UUID(current_user.tenant_id))
    )
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get or create Stripe customer
    sub = await BillingService.get_subscription_by_tenant(
        db, uuid.UUID(current_user.tenant_id)
    )
    
    customer_id = sub.stripe_customer_id if sub else None
    
    if not customer_id:
        # Create Stripe customer
        customer = await StripeService.create_customer(
            email=tenant.email,
            name=tenant.name,
            metadata={"tenant_id": str(tenant.tenant_id)}
        )
        
        if not customer:
            raise HTTPException(status_code=500, detail="Failed to create Stripe customer")
        
        customer_id = customer.id
        
        # Save customer ID to subscription
        if sub:
            sub.stripe_customer_id = customer_id
    
    # Get price ID
    price_id = get_price_id(request.tier, request.interval)
    
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid tier or interval")
    
    # Create checkout session
    session = await StripeService.create_checkout_session(
        customer_id=customer_id,
        price_id=price_id,
        success_url=request.success_url,
        cancel_url=request.cancel_url,
        trial_days=7 if sub and sub.status == "trialing" else None
    )
    
    if not session:
        raise HTTPException(status_code=500, detail="Failed to create checkout session")
    
    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/portal")
async def create_portal(
    request: CreatePortalRequest,
    current_user: CurrentUser = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Customer Portal session for self-service billing"""
    if not StripeService.is_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe is not configured"
        )
    
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with user")
    
    sub = await BillingService.get_subscription_by_tenant(
        db, uuid.UUID(current_user.tenant_id)
    )
    
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found")
    
    session = await StripeService.create_portal_session(
        customer_id=sub.stripe_customer_id,
        return_url=request.return_url
    )
    
    if not session:
        raise HTTPException(status_code=500, detail="Failed to create portal session")
    
    return {"portal_url": session.url}


@router.post("/change-tier")
async def change_tier(
    request: ChangeTierRequest,
    current_user: CurrentUser = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db)
):
    """Change subscription tier (upgrade/downgrade)"""
    if request.new_tier not in ["starter", "professional", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with user")
    
    sub = await BillingService.get_subscription_by_tenant(
        db, uuid.UUID(current_user.tenant_id)
    )
    
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # If Stripe is configured and subscription is active, update in Stripe
    if StripeService.is_configured() and sub.stripe_subscription_id and sub.status == "active":
        price_id = get_price_id(request.new_tier, request.interval)
        
        stripe_sub = await StripeService.update_subscription(
            subscription_id=sub.stripe_subscription_id,
            new_price_id=price_id
        )
        
        if stripe_sub:
            await BillingService.update_subscription_from_stripe(
                db, uuid.UUID(current_user.tenant_id), stripe_sub
            )
    
    # Update local tier regardless
    await BillingService.change_tier(db, uuid.UUID(current_user.tenant_id), request.new_tier)
    
    return {"message": f"Tier changed to {request.new_tier}"}


@router.post("/cancel")
async def cancel_subscription(
    at_period_end: bool = True,
    current_user: CurrentUser = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db)
):
    """Cancel subscription"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with user")
    
    sub = await BillingService.get_subscription_by_tenant(
        db, uuid.UUID(current_user.tenant_id)
    )
    
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Cancel in Stripe if configured
    if StripeService.is_configured() and sub.stripe_subscription_id:
        stripe_sub = await StripeService.cancel_subscription(
            subscription_id=sub.stripe_subscription_id,
            at_period_end=at_period_end
        )
        
        if stripe_sub:
            await BillingService.update_subscription_from_stripe(
                db, uuid.UUID(current_user.tenant_id), stripe_sub
            )
    else:
        # Update local status
        sub.status = "canceled"
        sub.canceled_at = datetime.utcnow()
    
    return {"message": "Subscription canceled"}


@router.post("/reactivate")
async def reactivate_subscription(
    current_user: CurrentUser = Depends(require_role("Admin")),
    db: AsyncSession = Depends(get_db)
):
    """Reactivate a canceled subscription"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with user")
    
    sub = await BillingService.get_subscription_by_tenant(
        db, uuid.UUID(current_user.tenant_id)
    )
    
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if sub.status != "canceled":
        raise HTTPException(status_code=400, detail="Subscription is not canceled")
    
    # Reactivate in Stripe if configured
    if StripeService.is_configured() and sub.stripe_subscription_id:
        stripe_sub = await StripeService.reactivate_subscription(
            subscription_id=sub.stripe_subscription_id
        )
        
        if stripe_sub:
            await BillingService.update_subscription_from_stripe(
                db, uuid.UUID(current_user.tenant_id), stripe_sub
            )
    else:
        # Update local status
        sub.status = "active"
        sub.cancel_at = None
        sub.canceled_at = None
    
    return {"message": "Subscription reactivated"}


# ============================================================================
# Invoice Endpoints
# ============================================================================

@router.get("/invoices")
async def get_invoices(
    limit: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get invoices for current tenant"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="No tenant associated with user")
    
    invoices = await BillingService.get_invoices_for_tenant(
        db, uuid.UUID(current_user.tenant_id), limit
    )
    
    return [
        InvoiceResponse(
            invoice_id=str(inv.invoice_id),
            invoice_number=inv.invoice_number,
            status=inv.status,
            total=inv.total,
            currency=inv.currency,
            period_start=inv.period_start.isoformat() if inv.period_start else None,
            period_end=inv.period_end.isoformat() if inv.period_end else None,
            invoice_pdf=inv.invoice_pdf,
            paid_at=inv.paid_at.isoformat() if inv.paid_at else None
        )
        for inv in invoices
    ]


# ============================================================================
# Stripe Webhooks
# ============================================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events"""
    if not StripeService.is_configured():
        raise HTTPException(status_code=501, detail="Stripe not configured")
    
    # Get raw body
    payload = await request.body()
    
    # Verify webhook signature
    event = StripeService.construct_webhook_event(payload, stripe_signature)
    
    if not event:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    
    # Check for idempotency
    if await BillingService.is_webhook_processed(db, event.id):
        return {"status": "already_processed"}
    
    # Log event
    await BillingService.log_webhook_event(db, event.id, event.type, event.data)
    
    try:
        # Handle different event types
        if event.type == "customer.subscription.created":
            await handle_subscription_created(db, event.data.object)
        
        elif event.type == "customer.subscription.updated":
            await handle_subscription_updated(db, event.data.object)
        
        elif event.type == "customer.subscription.deleted":
            await handle_subscription_deleted(db, event.data.object)
        
        elif event.type == "invoice.paid":
            await handle_invoice_paid(db, event.data.object)
        
        elif event.type == "invoice.payment_failed":
            await handle_invoice_payment_failed(db, event.data.object)
        
        elif event.type == "customer.subscription.trial_will_end":
            await handle_trial_ending(db, event.data.object)
        
        # Mark as processed
        await BillingService.mark_webhook_processed(db, event.id, success=True)
        
    except Exception as e:
        await BillingService.mark_webhook_processed(db, event.id, success=False, error_message=str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"status": "processed"}


# ============================================================================
# Webhook Handlers
# ============================================================================

async def handle_subscription_created(db: AsyncSession, subscription):
    """Handle subscription created event"""
    customer_id = subscription.customer
    
    # Find tenant by Stripe customer ID
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()
    
    if sub:
        await BillingService.update_subscription_from_stripe(db, sub.tenant_id, subscription)


async def handle_subscription_updated(db: AsyncSession, subscription):
    """Handle subscription updated event"""
    customer_id = subscription.customer
    
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()
    
    if sub:
        await BillingService.update_subscription_from_stripe(db, sub.tenant_id, subscription)


async def handle_subscription_deleted(db: AsyncSession, subscription):
    """Handle subscription deleted event"""
    customer_id = subscription.customer
    
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()
    
    if sub:
        sub.status = "canceled"
        sub.canceled_at = datetime.utcnow()


async def handle_invoice_paid(db: AsyncSession, invoice):
    """Handle invoice paid event"""
    customer_id = invoice.customer
    
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()
    
    if sub:
        await BillingService.create_invoice_from_stripe(db, sub.tenant_id, invoice)


async def handle_invoice_payment_failed(db: AsyncSession, invoice):
    """Handle invoice payment failed event"""
    customer_id = invoice.customer
    
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_customer_id == customer_id)
    )
    sub = result.scalar_one_or_none()
    
    if sub:
        sub.status = "past_due"
        await BillingService.create_invoice_from_stripe(db, sub.tenant_id, invoice)


async def handle_trial_ending(db: AsyncSession, subscription):
    """Handle trial ending event (3 days before trial ends)"""
    # This could trigger an email notification
    # For now, just log it
    print(f"Trial ending soon for subscription: {subscription.id}")
