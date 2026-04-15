from fastapi import APIRouter, Depends, HTTPException
from app.models.session import Session
from app.services.session_service import SessionService
from app.dependencies import get_session_service, require_api_key

router = APIRouter(dependencies=[Depends(require_api_key)])


@router.post("")
async def create_session(
    provider: str = "openai",
    model: str = "gpt-4o",
    mode: str = "readonly",
    session_service: SessionService = Depends(get_session_service),
):
    session = session_service.create_session(provider=provider, model=model, mode=mode)
    return session.model_dump()


@router.get("")
async def list_sessions(
    session_service: SessionService = Depends(get_session_service),
):
    return [s.model_dump() for s in session_service.list_sessions()]


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    session_service: SessionService = Depends(get_session_service),
):
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.model_dump()


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    session_service: SessionService = Depends(get_session_service),
):
    deleted = session_service.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}


@router.get("/{session_id}/messages")
async def get_messages(
    session_id: str,
    session_service: SessionService = Depends(get_session_service),
):
    messages = session_service.get_messages(session_id)
    return [m.model_dump() for m in messages]
