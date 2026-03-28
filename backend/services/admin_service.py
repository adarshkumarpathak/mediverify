from supabase_client import get_supabase_client
from typing import List, Dict

supabase = get_supabase_client()


def get_stats() -> Dict:
    """Return system statistics. Uses Supabase if configured, otherwise returns mock data."""
    if not supabase:
        return {
            "total_verifications": 156,
            "manipulated_detected": 24,
            "active_doctors": 12,
            "avg_accuracy": 94.5,
        }
    # Example: assuming a table 'stats' with a single row
    try:
        resp = supabase.table("stats").select("*").single().execute()
        return resp.data if resp.data else {}
    except Exception:
        # Fallback to mock if query fails
        return {
            "total_verifications": 0,
            "manipulated_detected": 0,
            "active_doctors": 0,
            "avg_accuracy": 0,
        }


def list_users() -> List[Dict]:
    """Return a list of user records. Uses Supabase if configured, otherwise mock data."""
    if not supabase:
        return [{"id": "test-user-1", "email": "doctor@example.com", "role": "doctor"}]
    try:
        resp = supabase.table("users").select("*").execute()
        return resp.data if resp.data else []
    except Exception:
        return []


def get_audit_logs(limit: int = 50, offset: int = 0) -> List[Dict]:
    """Retrieve audit log entries with pagination. Returns mock data when Supabase is unavailable."""
    if not supabase:
        return [{"action": "upload", "timestamp": "2023-10-30T12:00:00"}]
    try:
        resp = (
            supabase.table("audit_logs")
            .select("*")
            .order("timestamp", desc=True)
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return resp.data if resp.data else []
    except Exception:
        return []

def create_user(user_data: Dict) -> Dict:
    """Create a new user in the database."""
    if not supabase:
        return {"id": "mock-id", **user_data}
    try:
        resp = supabase.table("users").insert(user_data).execute()
        return resp.data[0] if resp.data else {}
    except Exception:
        return {}


def update_user(user_id: str, updates: Dict) -> Dict:
    """Update an existing user's information."""
    if not supabase:
        return {"id": user_id, **updates}
    try:
        resp = supabase.table("users").update(updates).eq("id", user_id).execute()
        return resp.data[0] if resp.data else {}
    except Exception:
        return {}


def delete_user(user_id: str) -> bool:
    """Delete a user from the database."""
    if not supabase:
        return True
    try:
        supabase.table("users").delete().eq("id", user_id).execute()
        return True
    except Exception:
        return False
