from fastapi import APIRouter, UploadFile, Depends, Request, HTTPException
from services.ml_service import predict, get_models, _preprocess_tf
from services.gradcam_service import generate_and_upload_heatmap
from middleware.auth_check import get_current_user
from services.report_service import generate_verification_report
from services.hash_service import calculate_image_hash
from fastapi.responses import StreamingResponse
import io
from middleware.audit_log import log_action
from supabase_client import get_supabase_client
import uuid
import os
import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
supabase = get_supabase_client()

# Allowed file types
ALLOWED_EXTENSIONS = {"image/jpeg", "image/png", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/verify")
async def verify_image(
    request: Request,
    file: UploadFile,
    current_user = Depends(get_current_user)
):
    try:
        # 1. Validate File
        if file.content_type not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG/PNG allowed.")
        
        # 1. Validate File Size & Content
        image_bytes = await file.read()
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (Max 10MB).")

        # 2. Calculate Hash for Deduplication
        img_hash = calculate_image_hash(image_bytes)
        
        # Optional: Check for existing prediction (Cache Hit)
        if supabase:
            try:
                existing = supabase.table("image_records")\
                    .select("*")\
                    .eq("image_hash", img_hash)\
                    .limit(1)\
                    .execute()
                
                if existing.data:
                    logger.info(f"🚀 Cache Hit for image hash: {img_hash[:10]}...")
                    match = existing.data[0]
                    return {
                        "success": True,
                        "data": {
                            "id": match['id'],
                            "result": match['result'],
                            "confidence": match['confidence'],
                            "heatmap_url": match['heatmap_url'],
                            "cached": True
                        },
                        "message": f"Verification (Cached): {match['result'].upper()}"
                    }
            except Exception as e:
                logger.debug(f"Cache miss or hash column missing: {e}")

        # 3. Call ML Service (Cache Miss)
        prediction = predict(image_bytes)
        if prediction.get("result") == "error":
            raise HTTPException(status_code=500, detail="ML prediction failed.")

        # 3. Call Grad-CAM Service
        # Preprocess for Grad-CAM (matching ml_service logic)
        tf_model, _ = get_models()
        img_array = _preprocess_tf(image_bytes)
        
        heatmap_url = generate_and_upload_heatmap(
            model=tf_model,
            img_array=img_array,
            original_image_bytes=image_bytes,
            supabase_client=supabase
        )

        # 4. Handle Local vs Remote URL
        if heatmap_url and heatmap_url.startswith("/static"):
            base_url = str(request.base_url).rstrip("/")
            heatmap_url = f"{base_url}{heatmap_url}"

        # 5. Save to Database (image_records) - Optional for local test
        record_id = str(uuid.uuid4())
        doctor_id = getattr(current_user, 'id', current_user.get('id')) if isinstance(current_user, dict) else current_user.id
        
        if supabase:
            try:
                record_data = {
                    "id": record_id,
                    "doctor_id": doctor_id,
                    "original_filename": file.filename,
                    "result": prediction['result'],
                    "confidence": prediction['combined_score'],
                    "heatmap_url": heatmap_url,
                    "image_hash": img_hash,
                    "created_at": "now()"
                }
                supabase.table("image_records").insert(record_data).execute()
            except Exception as db_err:
                logger.warning(f"⚠️ image_records insert failed (likely offline): {db_err}")

        # 5. Log to Audit Logs
        try:
            await log_action(
                request, 
                "IMAGE_VERIFICATION", 
                details={
                    "filename": file.filename, 
                    "result": prediction['result'], 
                    "record_id": record_id,
                    "doctor_id": doctor_id
                }
            )
        except Exception as log_err:
            logger.error(f"❌ Audit log failed: {log_err}")

        # 6. Return Result
        return {
            "success": True,
            "data": {
                "id": record_id,
                "result": prediction['result'],
                "tf_confidence": prediction['tf_confidence'],
                "fft_confidence": prediction['fft_confidence'],
                "combined_score": prediction['combined_score'],
                "heatmap_url": heatmap_url,
                "processing_time_ms": prediction['processing_time_ms']
            },
            "message": f"Verification complete: {prediction['result'].upper()}"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ Verification endpoint error: {e}")
        return {
            "success": False,
            "message": "Internal server error during verification",
            "error": str(e)
        }

@router.get("/history")
async def get_history(
    current_user = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0
):
    if not supabase:
        return {"success": False, "message": "Supabase not configured"}
    
    try:
        user_id = getattr(current_user, 'id', current_user.get('id')) if isinstance(current_user, dict) else current_user.id
        resp = supabase.table("image_records")\
            .select("*")\
            .eq("doctor_id", user_id)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/history/{record_id}")
async def get_record(record_id: str, current_user = Depends(get_current_user)):
    if not supabase:
        return {"success": False, "message": "Supabase not configured"}
    
    try:
        resp = supabase.table("image_records").select("*").eq("id", record_id).single().execute()
        return {"success": True, "data": resp.data}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.get("/report/{record_id}")
async def download_report(record_id: str, current_user = Depends(get_current_user)):
    if not supabase:
        return {"success": False, "message": "Supabase not configured"}

    try:
        resp = supabase.table("image_records").select("*").eq("id", record_id).single().execute()
        if not resp.data:
            return {"success": False, "message": "Record not found"}
        
        record = resp.data
        doctor_name = getattr(current_user, 'full_name', 'Doctor')
        
        pdf_buffer = generate_verification_report({
            "id": record['id'],
            "filename": record['original_filename'],
            "result": record['result'],
            "confidence": record['confidence'],
            "heatmap_url": record['heatmap_url'],
            "timestamp": record['created_at'],
            "doctor_name": doctor_name
        })
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename=Verification_Report_{record_id}.pdf"}
        )
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        return {"success": False, "message": "Could not generate report"}
