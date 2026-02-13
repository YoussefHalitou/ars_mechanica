"""
Main FastAPI application v2.0 - Enhanced with modern features
"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List
import time

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.gzip import GZipMiddleware

from backend.core.database import init_db, close_db, metrics
from backend.core.tenant import get_current_tenant_sync, load_tenant_config_sync
from backend.core.schemas import ConfigResponse, ResponseBase
# Industries module loaded dynamically via module discovery


# Global variable to store discovered modules
MODULE_ROUTERS = []


def discover_modules() -> List[str]:
    """
    Auto-discover modules in backend/modules/ directory.
    Returns list of module names that have router.py
    """
    modules_path = Path(__file__).parent / "modules"
    discovered_modules = []
    
    if not modules_path.exists():
        print(f"Modules directory not found: {modules_path}")
        return discovered_modules
    
    for module_dir in modules_path.iterdir():
        if module_dir.is_dir():
            router_file = module_dir / "router.py"
            if router_file.exists():
                module_name = module_dir.name
                discovered_modules.append(module_name)
                print(f"✅ Discovered module: {module_name}")
    
    return discovered_modules


def import_module_routers(module_names: List[str]) -> List[dict]:
    """
    Import and collect routers from discovered modules.
    """
    routers = []
    
    for module_name in module_names:
        try:
            # Dynamic import
            module_path = f"backend.modules.{module_name}.router"
            router_module = __import__(module_path, fromlist=["router"])
            
            if hasattr(router_module, "router"):
                routers.append({
                    "name": module_name,
                    "router": router_module.router,
                    "enabled": True  # Will be filtered by tenant config later
                })
                print(f"✅ Loaded router for module: {module_name}")
            else:
                print(f"⚠️  Module {module_name} has no 'router' attribute")
                
        except ImportError as e:
            print(f"❌ Failed to import router for {module_name}: {e}")
        except Exception as e:
            print(f"❌ Error loading {module_name}: {e}")
    
    return routers


# Modules that should always be mounted regardless of tenant config
ALWAYS_ENABLED_MODULES = {"auth", "billing", "industries", "statistics", "chatbot", "feedback", "analytics"}


def mount_module_routers_at_startup(app: FastAPI, tenant, module_routers: List[dict]) -> int:
    """
    Mount routers from discovered modules with tenant filtering.
    Some core modules (auth, billing, etc.) are always enabled.
    Returns the number of routers mounted.
    """
    mounted_count = 0
    
    for module_info in module_routers:
        module_name = module_info["name"]
        router = module_info["router"]
        
        # Always mount core SaaS modules + check tenant config for the rest
        if module_name in ALWAYS_ENABLED_MODULES or tenant.is_module_enabled(module_name):
            app.include_router(router)
            mounted_count += 1
            print(f"✅ Mounted router for module: {module_name}")
        else:
            print(f"⏭️  Module {module_name} disabled for tenant {tenant.tenant_id}")
    
    return mounted_count


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager v2.0
    Handles startup and shutdown events with enhanced error handling.
    """
    # Startup
    print("🚀 Starting Ars Mechanica Application v2.0...")
    start_time = time.time()
    
    try:
        # Initialize database with enhanced configuration
        print("📊 Initializing database...")
        await init_db()
        
        # Pre-load all models to ensure SQLAlchemy relationships resolve
        print("📦 Pre-loading all models...")
        try:
            from backend.modules.abnahmen.models import Abnahme  # noqa: F401
            from backend.modules.morningplan.models import MorningPlan, MorningPlanStaff  # noqa: F401
            from backend.modules.projects.models import Project  # noqa: F401
            from backend.modules.users.models import Employee  # noqa: F401
            from backend.modules.time_pairs.models import TimePair  # noqa: F401
            print("✅ All models pre-loaded")
        except Exception as e:
            print(f"⚠️  Some models failed to pre-load: {e}")
        
        # Discover and load modules
        print("📦 Discovering modules...")
        discovered_modules = discover_modules()
        global MODULE_ROUTERS
        MODULE_ROUTERS = import_module_routers(discovered_modules)
        
        # Mount routers during startup (moved from @app.on_event)
        tenant = get_current_tenant_sync()
        mounted_count = mount_module_routers_at_startup(app, tenant, MODULE_ROUTERS)
        
        # Load industry templates
        print("🏭 Loading industry templates...")
        try:
            from backend.core.industries import IndustryService
            IndustryService.load_templates()
        except Exception as e:
            print(f"⚠️  Could not load industry templates: {e}")
        
        startup_time = time.time() - start_time
        print(f"✅ Application started successfully in {startup_time:.2f}s")
        print(f"📈 Loaded {len(MODULE_ROUTERS)} modules, mounted {mounted_count} routers")
        
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    print("🔄 Shutting down application...")
    try:
        await close_db()
        print("✅ Database connections closed")
        
        # Print performance metrics
        stats = metrics.get_stats()
        print(f"📊 Performance Stats: {stats}")
        
    except Exception as e:
        print(f"❌ Shutdown error: {e}")


# Get CORS origins from environment
def get_cors_origins() -> List[str]:
    """Get CORS origins from environment variable or use defaults."""
    cors_origins_env = os.getenv("CORS_ORIGINS", "")
    if cors_origins_env:
        return [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    
    # Default origins for development
    if os.getenv("DEBUG", "false").lower() == "true":
        return ["http://localhost:3000", "http://localhost:8501", "http://localhost:8000"]
    
    # Production: return empty list (should be configured via environment)
    return []


# Create FastAPI app v2.0
app = FastAPI(
    title="Ars Mechanica API v2.0",
    description="Multi-tenant SaaS API for German/Austrian/Swiss craftsmanship companies",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enhanced middleware stack
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware with environment-based configuration
cors_origins = get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],  # Fallback to wildcard only if not configured
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page", "X-Process-Time"],
)


# Rate limiting middleware using slowapi
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    RATE_LIMITING_ENABLED = True
except ImportError:
    RATE_LIMITING_ENABLED = False
    limiter = None
    print("⚠️  slowapi not installed, rate limiting disabled")


@app.get("/")
async def root():
    """Enhanced root endpoint"""
    return {
        "message": "Ars Mechanica API v2.0",
        "version": "2.0.0",
        "modules": len(MODULE_ROUTERS),
        "features": [
            "Multi-tenant architecture",
            "Draftbit integration",
            "Real-time capabilities",
            "Enhanced caching",
            "Performance monitoring",
            "Advanced search & filtering"
        ],
        "rate_limiting": RATE_LIMITING_ENABLED
    }


@app.get("/health")
async def health_check():
    """Enhanced health check with metrics"""
    stats = metrics.get_stats()
    return {
        "status": "healthy",
        "service": "lis-api-v2",
        "version": "2.0.0",
        "uptime": "running",
        "metrics": stats,
        "modules": len(MODULE_ROUTERS)
    }


@app.get("/metrics")
async def get_metrics():
    """Get detailed performance metrics"""
    stats = metrics.get_stats()
    return ResponseBase(success=True, data=stats)


@app.get("/config", response_model=ResponseBase)
async def get_config():
    """Get tenant configuration with enhanced data"""
    tenant = get_current_tenant_sync()
    config = tenant.to_dict()
    
    # Add system info
    config.update({
        "api_version": "2.0.0",
        "features": {
            "real_time": True,
            "caching": True,
            "advanced_search": True,
            "export_formats": ["csv", "xlsx", "pdf"],
            "notifications": True
        }
    })
    
    return ResponseBase(success=True, data=config)


@app.get("/modules")
async def list_modules():
    """List all available modules with detailed info"""
    tenant = get_current_tenant_sync()
    
    modules_info = []
    for module_info in MODULE_ROUTERS:
        module_name = module_info["name"]
        modules_info.append({
            "name": module_name,
            "enabled": tenant.is_module_enabled(module_name),
            "version": "2.0.0"
        })
    
    return ResponseBase(success=True, data=modules_info)


# Global exception handler with enhanced logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with detailed logging"""
    import traceback
    
    error_details = {
        "error": str(exc),
        "type": type(exc).__name__,
        "path": str(request.url.path),
        "method": request.method
    }
    
    if os.getenv("DEBUG", "false").lower() == "true":
        error_details["traceback"] = traceback.format_exc()
    
    print(f"❌ Unexpected error: {error_details}")
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": error_details if os.getenv("DEBUG", "false").lower() == "true" else None
        }
    )


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 3))
    return response


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
