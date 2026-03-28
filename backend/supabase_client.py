from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)

supabase: Client = None

if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
else:
    logger.warning("Supabase configuration missing. DB & Auth will fail unless configured.")

def get_supabase_client() -> Client:
    return supabase
