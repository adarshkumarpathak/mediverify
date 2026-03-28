import os
import sentry_sdk
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from routes import auth, doctor, admin

# Initialize Sentry
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.5
    )

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="MediVerify API",
    description="""
    MediVerify is an AI-powered medical image authenticity verification system.
    
    ## Features
    * **Image Verification**: Submit X-rays/MRIs to detect manipulations.
    * **Grad-CAM Visualization**: Highlight regions of suspicion.
    * **Audit Logging**: Comprehensive action tracking for compliance.
    * **Role-Based Access**: Specialized interfaces for Doctors and Admins.
    """,
    version="1.0.0",
    contact={
        "name": "MediVerify Support",
        "email": "support@mediverify.ai",
    },
    license_info={
        "name": "Academic Use Only",
    }
)

# Serve static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import logging
    logging.error(f"Unhandled exception: {exc}")
    return {
        "success": False,
        "message": "An unexpected error occurred on the server.",
        "error": str(exc)
    }

# Allowed Origins parsing
origins = settings.ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(doctor.router, prefix="/api", tags=["Doctor Operations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Administration"])

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}
