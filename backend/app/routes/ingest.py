import hmac
import hashlib
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lead_source import LeadSourceIntegration
from app.services.universal_ingestion_service import UniversalIngestionService

router = APIRouter(prefix="/ingest", tags=["Universal Lead Ingestion"])

@router.get("/meta")
def verify_meta_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Standard Meta Webhook Verification Endpoint.
    Responds to Meta's hub.challenge verification handshake.
    """
    if hub_mode == "subscribe" and hub_challenge:
        return int(hub_challenge) if hub_challenge.isdigit() else hub_challenge
    return {"status": "Meta Webhook Listener Active"}

@router.post("/meta")
async def ingest_meta_lead(
    request: Request,
    db: Session = Depends(get_db),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256")
):
    """
    Meta Lead Ads Ingestion Webhook.
    Extracts customer info, verifies idempotency, assigns rep, and starts response SLA.
    """
    payload = await request.json()
    org_id = payload.get("organization_id", 1)

    ext_id = None
    if "entry" in payload and isinstance(payload["entry"], list) and len(payload["entry"]) > 0:
        ch = payload["entry"][0].get("changes", [])
        if ch and isinstance(ch, list) and len(ch) > 0:
            val = ch[0].get("value", {})
            ext_id = val.get("leadgen_id") or val.get("lead_id")
    if not ext_id:
        ext_id = payload.get("leadgen_id") or payload.get("id") or (payload.get("entry", [{}])[0].get("id") if payload.get("entry") else None)

    try:
        return UniversalIngestionService.ingest_lead(
            db=db,
            organization_id=org_id,
            source_type="Meta",
            raw_payload=payload,
            external_event_id=str(ext_id) if ext_id else None
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Ingestion error: {str(e)}")



@router.post("/housing")
async def ingest_housing_lead(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Housing.com Ingestion Webhook.
    Extracts customer requirement, project interest, checks duplicates, and starts SLA.
    """
    payload = await request.json()
    org_id = payload.get("organization_id", 1)
    ext_id = payload.get("lead_id") or payload.get("enquiry_id")

    try:
        return UniversalIngestionService.ingest_lead(
            db=db,
            organization_id=org_id,
            source_type="Housing",
            raw_payload=payload,
            external_event_id=str(ext_id) if ext_id else None
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/99acres")
async def ingest_99acres_lead(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    99acres Ingestion Webhook.
    Normalizes sender details, verified buyer flags, and dispatches to sales capacity.
    """
    payload = await request.json()
    org_id = payload.get("organization_id", 1)
    ext_id = payload.get("verification_id") or payload.get("lead_id")

    try:
        return UniversalIngestionService.ingest_lead(
            db=db,
            organization_id=org_id,
            source_type="99acres",
            raw_payload=payload,
            external_event_id=str(ext_id) if ext_id else None
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/website")
async def ingest_website_lead(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public Marketing Website Enquiry Ingestion Endpoint.
    Captures visitor form submissions, matches inventory, and alerts sales reps.
    """
    payload = await request.json()
    org_id = payload.get("organization_id", 1)

    try:
        return UniversalIngestionService.ingest_lead(
            db=db,
            organization_id=org_id,
            source_type="Website",
            raw_payload=payload
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook/{integration_id}")
async def ingest_custom_webhook(
    integration_id: int,
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature")
):
    """
    Dedicated Organization Source Webhook receiver.
    Verifies integration configuration and HMAC secret signature.
    """
    integration = db.query(LeadSourceIntegration).filter(
        LeadSourceIntegration.id == integration_id,
        LeadSourceIntegration.is_active == True
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Active integration endpoint not found.")

    body_bytes = await request.body()
    # Verify signature if secret configured
    if integration.webhook_secret and x_webhook_signature:
        expected = hmac.new(integration.webhook_secret.encode(), body_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, x_webhook_signature):
            raise HTTPException(status_code=401, detail="Invalid HMAC webhook signature.")

    payload = await request.json()
    ext_id = payload.get("event_id") or payload.get("id") or payload.get("lead_id")

    try:
        return UniversalIngestionService.ingest_lead(
            db=db,
            organization_id=integration.organization_id,
            source_type=integration.source_type,
            raw_payload=payload,
            external_event_id=str(ext_id) if ext_id else None,
            integration_id=integration.id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
