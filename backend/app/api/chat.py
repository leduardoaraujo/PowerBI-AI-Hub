from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from app.models.chat import ChatRequest
from app.services.chat_service import ChatService
from app.services.session_service import SessionService
from app.dependencies import get_chat_service, get_session_service

router = APIRouter()


@router.post("")
async def send_message(
    session_id: str,
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
    session_service: SessionService = Depends(get_session_service),
):
    session = session_service.get_session(session_id)
    if not session:
        return {"error": "Session not found"}, 404

    message_id = None
    events = []
    async for event in chat_service.process_message(
        session_id=session_id,
        user_message=request.content,
        history=session_service.get_history(session_id),
        provider=request.provider or session.provider,
        model=request.model or session.model,
    ):
        events.append(event)
        if event.get("type") == "message":
            message_id = message_id or event.get("message_id", session_id)

    return {"session_id": session_id, "events": events}


@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    chat_service: ChatService = Depends(get_chat_service),
    session_service: SessionService = Depends(get_session_service),
):
    await websocket.accept()
    session_id = websocket.query_params.get("session_id", "")
    if not session_id:
        await websocket.send_json({"type": "error", "error": "session_id query parameter required"})
        await websocket.close()
        return
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "")
            provider = data.get("provider", "openai")
            model = data.get("model", "gpt-4o")

            session = session_service.get_session(session_id)
            if not session:
                await websocket.send_json({"type": "error", "error": "Session not found"})
                continue

            async for event in chat_service.process_message(
                session_id=session_id,
                user_message=content,
                history=session_service.get_history(session_id),
                provider=provider,
                model=model,
            ):
                await websocket.send_json(event)

            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass
