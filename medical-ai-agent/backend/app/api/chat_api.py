import os
import shutil
import time
import traceback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse, Response, JSONResponse
from typing import Optional
from app.agent.agent_controller import run_agent
from pydantic import BaseModel
import subprocess
import uuid
from app.agent.agent_controller import run_agent, translate_text

router = APIRouter()

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============================
# Constants
# ============================
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {
    "image/png", "image/jpeg", "image/gif",
    "image/bmp", "image/webp", "image/tiff"
}


def validate_upload(file: UploadFile) -> tuple[bool, str]:
    """Validate an uploaded file for type and basic checks."""
    if not file.filename:
        return False, "No filename provided."
    
    # Check file extension
    _, ext = os.path.splitext(file.filename)
    allowed_exts = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tiff"}
    if ext.lower() not in allowed_exts:
        return False, f"File type '{ext}' is not supported. Please upload an image (PNG, JPG, GIF, BMP, WEBP)."
    
    # Check content type if available
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        return False, f"Content type '{file.content_type}' is not supported."
    
    return True, "OK"


def save_upload(file: UploadFile) -> str:
    """Save an uploaded file to the uploads directory. Returns file path."""
    # Generate unique filename to prevent collisions
    _, ext = os.path.splitext(file.filename)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Verify file size after save
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE_BYTES:
        os.remove(file_path)
        raise ValueError(f"File too large ({file_size / (1024*1024):.1f}MB). Maximum allowed is {MAX_FILE_SIZE_BYTES / (1024*1024):.0f}MB.")
    
    if file_size == 0:
        os.remove(file_path)
        raise ValueError("The uploaded file is empty.")
    
    return file_path


# -------------------------------
# NORMAL CHAT (NON-STREAMING)
# -------------------------------
@router.post("/chat")
async def chat(
    message: str = Form(...),
    session_id: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    file_path = None

    try:
        # Validate inputs
        if not message or not message.strip():
            return JSONResponse(
                status_code=400,
                content={"error": "Message cannot be empty.", "code": "EMPTY_MESSAGE"}
            )
        
        if not session_id or not session_id.strip():
            return JSONResponse(
                status_code=400,
                content={"error": "Session ID is required.", "code": "MISSING_SESSION"}
            )

        if file:
            is_valid, msg = validate_upload(file)
            if not is_valid:
                return JSONResponse(
                    status_code=400,
                    content={"error": msg, "code": "INVALID_FILE"}
                )
            try:
                file_path = save_upload(file)
            except ValueError as e:
                return JSONResponse(
                    status_code=400,
                    content={"error": str(e), "code": "FILE_ERROR"}
                )

        agent_response = run_agent(
            user_message=message,
            session_id=session_id,
            file_path=file_path
        )

        return {"response": agent_response}

    except Exception as e:
        print(f"Chat endpoint error: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "An unexpected error occurred while processing your request. Please try again.",
                "code": "INTERNAL_ERROR"
            }
        )
    finally:
        # Clean up uploaded file after processing
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass


# -------------------------------
# STREAMING CHAT (SSE)
# -------------------------------
@router.post("/chat-stream")
async def chat_stream(
    message: str = Form(...),
    session_id: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    file_path = None

    try:
        # Validate inputs
        if not message or not message.strip():
            def error_gen():
                yield "data: ⚠️ Message cannot be empty.\n\n"
                yield "data: [END]\n\n"
            return StreamingResponse(error_gen(), media_type="text/event-stream")
        
        if not session_id or not session_id.strip():
            def error_gen():
                yield "data: ⚠️ Session error. Please refresh the page.\n\n"
                yield "data: [END]\n\n"
            return StreamingResponse(error_gen(), media_type="text/event-stream")

        if file:
            is_valid, msg = validate_upload(file)
            if not is_valid:
                def error_gen():
                    yield f"data: ⚠️ {msg}\n\n"
                    yield "data: [END]\n\n"
                return StreamingResponse(error_gen(), media_type="text/event-stream")
            try:
                file_path = save_upload(file)
            except ValueError as e:
                def error_gen():
                    yield f"data: ⚠️ {str(e)}\n\n"
                    yield "data: [END]\n\n"
                return StreamingResponse(error_gen(), media_type="text/event-stream")

        print(f"[Stream] session={session_id[:8]}... | msg_len={len(message)} | file={'yes' if file_path else 'no'}")

    except Exception as e:
        print(f"Chat stream setup error: {traceback.format_exc()}")
        def error_gen():
            yield "data: ⚠️ An error occurred. Please try again.\n\n"
            yield "data: [END]\n\n"
        return StreamingResponse(error_gen(), media_type="text/event-stream")

    def event_generator():
        try:
            full_response = run_agent(
                user_message=message,
                session_id=session_id,
                file_path=file_path,
                use_vision_capabilities=True
            )

            if not full_response:
                yield "data: I couldn't generate a response. Please try again.\n\n"
                yield "data: [END]\n\n"
                return

            # Stream word-by-word for smooth UI effect
            words = full_response.split(" ")
            for word in words:
                yield f"data: {word} \n\n"
                time.sleep(0.03)

            yield "data: [END]\n\n"

        except Exception as e:
            print(f"Stream generation error: {traceback.format_exc()}")
            yield "data: ⚠️ An error occurred during response generation. Please try again.\n\n"
            yield "data: [END]\n\n"
        finally:
            # Clean up uploaded file
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


# -------------------------------
# TEXT-TO-SPEECH
# -------------------------------
class TTSRequest(BaseModel):
    text: str
    voice: str = "ryan"
    language: str = "en"


# -------------------------------
# TRANSLATION
# -------------------------------
class TranslateRequest(BaseModel):
    text: str
    target_lang: str  # 'hi', 'te', 'en'

@router.post("/translate")
async def translate(req: TranslateRequest):
    if not req.text or not req.text.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "No text provided for translation.", "code": "EMPTY_TEXT"}
        )
    
    lang_map = {
        "hi": "Hindi",
        "te": "Telugu",
        "en": "English"
    }
    
    target_lang_name = lang_map.get(req.target_lang.lower())
    if not target_lang_name:
        return JSONResponse(
            status_code=400,
            content={"error": f"Unsupported language: {req.target_lang}", "code": "INVALID_LANGUAGE"}
        )
    
    if req.target_lang.lower() == "en":
        # If already English, just return as is (assuming input is English)
        return {"translated_text": req.text}

    translated = translate_text(req.text, target_lang_name)
    return {"translated_text": translated}

@router.post("/tts")
async def generate_tts(req: TTSRequest):
    # Input validation
    if not req.text or not req.text.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "No text provided for speech synthesis.", "code": "EMPTY_TEXT"}
        )
    
    # Limit TTS text length to prevent abuse
    max_tts_chars = 5000
    text_to_speak = req.text.strip()[:max_tts_chars]
    
    # Validate voice and language selection
    allowed_voices = {"ryan", "lessac", "priyamvada", "maya"}
    voice = req.voice.lower() if req.voice else None
    language = req.language.lower() if req.language else "en"

    # Auto-select voice based on language if voice not explicitly provided or invalid for language
    if language == "hi":
        voice = "priyamvada"
    elif language == "te":
        voice = "maya"
    elif not voice or voice not in {"ryan", "lessac"}:
        voice = "ryan"

    piper_dir = os.path.join(BASE_DIR, "app", "piper")
    piper_exe = os.path.join(piper_dir, "piper.exe")
    
    # Check if Piper is available
    if not os.path.exists(piper_exe):
        return JSONResponse(
            status_code=503,
            content={
                "error": "Text-to-speech engine is not available. Please ensure Piper TTS is installed.",
                "code": "TTS_UNAVAILABLE"
            }
        )
    
    if voice == "lessac":
        model_filename = "en_US-lessac-high.onnx"
    elif voice == "priyamvada" or (language == "hi" and voice == "priyamvada"):
        model_filename = "hi_IN-priyamvada-medium.onnx"
    elif voice == "maya" or (language == "te" and voice == "maya"):
        model_filename = "te_IN-maya-medium.onnx"
    else:
        model_filename = "en_US-ryan-medium.onnx"
    
    model_path = os.path.join(piper_dir, model_filename)
    if not os.path.exists(model_path):
        return JSONResponse(
            status_code=503,
            content={
                "error": f"Voice model '{voice}' is not installed.",
                "code": "VOICE_UNAVAILABLE"
            }
        )
        
    temp_filename = f"piper_{uuid.uuid4().hex}.wav"
    temp_wav = os.path.join(piper_dir, temp_filename)
        
    try:
        process = subprocess.Popen(
            [piper_exe, "--model", model_filename, "--output_file", temp_filename],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=piper_dir
        )
        _, err = process.communicate(
            input=text_to_speak.encode('utf-8'),
            timeout=300  # 5 minutes timeout for longer text
        )
        
        if process.returncode != 0:
            error_msg = err.decode('utf-8', errors='ignore')
            print(f"Piper error: {error_msg}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Speech synthesis failed. Please try again.",
                    "code": "TTS_SYNTHESIS_FAILED"
                }
            )
        
        if not os.path.exists(temp_wav):
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Speech synthesis completed but no audio was generated.",
                    "code": "TTS_NO_OUTPUT"
                }
            )
            
        with open(temp_wav, "rb") as f:
            audio_data = f.read()
        
        if len(audio_data) == 0:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Generated audio file is empty.",
                    "code": "TTS_EMPTY_OUTPUT"
                }
            )
            
        return Response(content=audio_data, media_type="audio/wav")
    
    except subprocess.TimeoutExpired:
        process.kill()
        print("Piper TTS timed out")
        return JSONResponse(
            status_code=504,
            content={
                "error": "Speech synthesis timed out. The text may be too long.",
                "code": "TTS_TIMEOUT"
            }
        )
    except Exception as e:
        print(f"TTS exception: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "An unexpected error occurred during speech synthesis.",
                "code": "TTS_ERROR"
            }
        )
    finally:
        if os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except Exception:
                pass
