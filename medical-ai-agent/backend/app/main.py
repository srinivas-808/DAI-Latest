from dotenv import load_dotenv
load_dotenv()
import warnings
import os
import traceback

# Silence TensorFlow GPU & oneDNN logs before any TF imports
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
warnings.filterwarnings("ignore", category=FutureWarning)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.chat_api import router as chat_router
from pydantic import BaseModel
from google import genai
from dotenv import set_key, find_dotenv


app = FastAPI(
    title="Diagnos AI - Medical Assistant Backend",
    description="Backend API for the Diagnos AI medical intelligence platform.",
    version="2.0"
)

# ============================
# Global Exception Handler
# ============================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler to prevent raw stack traces reaching clients."""
    print(f"Unhandled exception: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "An internal server error occurred. Please try again later.",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

# ============================
# CORS Configuration
# ============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# API Routes
# ============================
app.include_router(chat_router, prefix="/api")

class ApiKeyRequest(BaseModel):
    api_key: str

@app.get("/api/check-key")
def check_api_key():
    """Check if a valid Gemini API key is configured."""
    try:
        key = os.getenv("GEMINI_API_KEY")
        if key and key.strip() and key != "TODO_ENTER_YOUR_API_KEY":
            return {"has_key": True}
        return {"has_key": False}
    except Exception:
        return {"has_key": False}

@app.post("/api/set-key")
def set_api_key(request: ApiKeyRequest):
    """Validate and save a new Gemini API key."""
    new_key = request.api_key.strip()
    
    if not new_key:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "API Key cannot be empty."}
        )
    
    if len(new_key) < 10:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "API Key appears to be too short. Please check and try again."}
        )

    # Validate the key with a lightweight API call
    try:
        client = genai.Client(api_key=new_key)
        client.models.generate_content(
            model="gemini-2.0-flash", 
            contents="Test"
        )
    except Exception as e:
        error_str = str(e).lower()
        if "invalid" in error_str or "api key" in error_str:
            message = "Invalid API Key. Please verify your key and try again."
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": message}
            )
        elif "quota" in error_str or "rate" in error_str:
            # Key is valid but rate-limited — still accept it
            pass
        else:
            message = f"Could not validate API Key: {str(e)[:100]}"
            print(f"API Key validation failed: {e}")
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": message}
            )

    # Save to .env
    try:
        dotenv_file = find_dotenv()
        if not dotenv_file:
            env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
            with open(env_path, "w") as f:
                f.write("")
            dotenv_file = env_path
        
        set_key(dotenv_file, "GEMINI_API_KEY", new_key)
        os.environ["GEMINI_API_KEY"] = new_key
    except Exception as e:
        print(f"Error saving API key: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Failed to save the API key. Please try again."}
        )
    
    return {"status": "success", "message": "API Key validated and saved successfully."}

@app.get("/")
def health_check():
    """Backend health check endpoint."""
    return {
        "status": "healthy",
        "service": "Diagnos AI Backend",
        "version": "2.0"
    }

@app.get("/api/health")
def api_health():
    """Detailed health check for frontend connection verification."""
    has_key = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {
        "status": "healthy",
        "api_key_configured": has_key,
        "service": "Diagnos AI Backend",
        "version": "2.0"
    }
