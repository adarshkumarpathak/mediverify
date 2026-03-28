from fastapi import Request, HTTPException
from supabase_client import get_supabase_client

supabase = get_supabase_client()

def get_current_user(request: Request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = auth_header.split(' ')[1] if len(auth_header.split(' ')) > 1 else auth_header
    
    # 1. Dev/Local Override
    if token == "mock-token" or (supabase and "placeholder" in str(supabase.table_url)):
        return {"id": "test-doctor-id", "role": "doctor", "name": "Dr. Test User"}

    if not supabase:
        return {"id": "test-user-id", "role": "doctor"}
        
    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_resp.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
