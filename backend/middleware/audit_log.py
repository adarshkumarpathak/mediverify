from fastapi import Request
from supabase_client import get_supabase_client
from middleware.auth_check import get_current_user
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
supabase = get_supabase_client()

async def log_action(request: Request, action: str, details: dict = None):
    """
    Helper function to log user actions to the audit_logs table.
    Can be called manually within route handlers.
    """
    try:
        user = None
        try:
            user = get_current_user(request)
        except Exception:
            pass # Unauthenticated action
            
        user_id = user.id if getattr(user, 'id', None) else user.get('id') if isinstance(user, dict) else None

        # Get IP address
        ip_address = request.client.host if request.client else "unknown"
        
        log_entry = {
            "user_id": user_id,
            "action": action,
            "ip_address": ip_address,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if supabase:
            supabase.table("audit_logs").insert(log_entry).execute()
        else:
            # Mock logging if supabase isn't configured
            logger.info(f"AUDIT LOG (Mocked): {log_entry}")
            
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
