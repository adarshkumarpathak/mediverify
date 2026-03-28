from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict
from services.admin_service import get_stats, list_users, get_audit_logs, create_user, update_user, delete_user
from middleware.auth_check import get_current_user
from middleware.audit_log import log_action
from supabase_client import get_supabase_client

router = APIRouter()
supabase = get_supabase_client()

# Admin check dependency
def require_admin(current_user = Depends(get_current_user)):
    # Check if user role is admin. 
    # For mock data returning a dictionary:
    role = current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, 'user_metadata', {}).get("role")
    
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/users")
async def get_users(request: Request, current_user = Depends(require_admin)):
    await log_action(request, "view_users")
    users = list_users()
    return {"success": True, "data": users}

@router.get("/stats")
async def get_admin_stats(request: Request, current_user = Depends(require_admin)):
    await log_action(request, "view_stats")
    stats = get_stats()
    return {"success": True, "data": stats}

@router.get("/logs")
async def get_audit_logs(request: Request, current_user = Depends(require_admin), limit: int = 50, offset: int = 0):
    await log_action(request, "view_audit_logs")
    logs = get_audit_logs(limit=limit, offset=offset)
    return {"success": True, "data": logs}

@router.post("/users")
async def admin_create_user(request: Request, user_data: Dict, current_user = Depends(require_admin)):
    await log_action(request, "admin_create_user", details={"email": user_data.get("email")})
    new_user = create_user(user_data)
    if not new_user:
        return {"success": False, "message": "Failed to create user"}
    return {"success": True, "data": new_user}

@router.put("/users/{user_id}")
async def admin_update_user(request: Request, user_id: str, updates: Dict, current_user = Depends(require_admin)):
    await log_action(request, "admin_update_user", details={"user_id": user_id, "updates": list(updates.keys())})
    updated_user = update_user(user_id, updates)
    if not updated_user:
        return {"success": False, "message": "Failed to update user"}
    return {"success": True, "data": updated_user}

@router.delete("/users/{user_id}")
async def admin_delete_user(request: Request, user_id: str, current_user = Depends(require_admin)):
    await log_action(request, "admin_delete_user", details={"user_id": user_id})
    success = delete_user(user_id)
    if not success:
        return {"success": False, "message": "Failed to delete user"}
    return {"success": True, "message": "User deleted"}
