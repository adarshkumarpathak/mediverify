from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login():
    return {"message": "Use Supabase client on frontend for login"}
