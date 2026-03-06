import os
import traceback
from google import genai
from app.tools.symptom_diagnosis import diagnose_symptoms
from app.tools.prediction_tool import run_prediction
from app.agent.session_store import SESSION_MEMORY
from app.safety.medical_guard import sanitize_input, is_emergency
from dotenv import load_dotenv
load_dotenv()

import PIL.Image

# ============================
# Constants
# ============================
MAX_MESSAGE_LENGTH = 5000
MAX_HISTORY_WINDOW = 12
MAX_FILE_SIZE_MB = 10
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tiff"}
MODEL_NAME = "gemini-2.0-flash"

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key == "TODO_ENTER_YOUR_API_KEY":
        raise ValueError("GEMINI_API_KEY not configured. Please set a valid API key.")
    return genai.Client(api_key=api_key)

# Load prompts
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, "system_prompt.txt"), encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

with open(os.path.join(BASE_DIR, "developer_prompt.txt"), encoding="utf-8") as f:
    DEVELOPER_PROMPT = f.read()

# ============================
# Expanded symptom vocabulary
# ============================
KNOWN_SYMPTOMS = [
    "fever", "cough", "fatigue", "chest pain", "thirst",
    "headache", "sore throat", "shortness of breath", "nausea",
    "dizziness", "back pain", "joint pain", "muscle aches",
    "rash", "blurred vision", "loss of appetite", "insomnia",
    "frequent urination", "weight loss", "weight gain",
    "abdominal pain", "diarrhea", "constipation", "vomiting",
    "palpitations", "swelling", "numbness", "tingling",
    "difficulty swallowing", "blood in urine", "blood in stool",
    "excessive sweating", "chills", "anxiety", "depression",
    "memory loss", "confusion", "seizures", "wheezing",
    "dry mouth", "excessive thirst", "bruising easily"
]


def validate_file(file_path: str) -> tuple[bool, str]:
    """Validate uploaded file exists, is within size limits, and is an allowed type."""
    if not os.path.exists(file_path):
        return False, "The uploaded file could not be found."
    
    # Check file size
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        return False, f"File size ({file_size_mb:.1f}MB) exceeds the {MAX_FILE_SIZE_MB}MB limit."
    
    # Check extension
    _, ext = os.path.splitext(file_path)
    if ext.lower() not in ALLOWED_IMAGE_EXTENSIONS:
        return False, f"File type '{ext}' is not supported. Please upload an image file (PNG, JPG, etc.)."
    
    return True, "OK"


def extract_symptoms(message: str) -> list[str]:
    """Extract known symptoms from user message using keyword matching."""
    lower_msg = message.lower()
    found = []
    for symptom in KNOWN_SYMPTOMS:
        if symptom in lower_msg:
            found.append(symptom)
    return found


def build_conversation_context(history: list[dict], max_turns: int = MAX_HISTORY_WINDOW) -> str:
    """Build a clean conversation context string from session history."""
    if not history:
        return "No previous conversation."
    
    recent = history[-max_turns:]
    lines = []
    for turn in recent:
        role = "Patient" if turn["role"] == "user" else "Diagnos AI"
        content = turn["content"]
        # Truncate very long messages in context
        if len(content) > 500:
            content = content[:500] + "..."
        lines.append(f"{role}: {content}")
    
    return "\n".join(lines)


def build_prompt(
    user_message: str,
    conversation_context: str,
    symptoms: list[str],
    symptom_result: list[dict] | None,
    prediction_result: dict | None
) -> str:
    """
    Build a clean, structured prompt with conditional sections.
    Only includes sections that have meaningful data — no raw Python objects.
    """
    sections = [SYSTEM_PROMPT, "", DEVELOPER_PROMPT, ""]
    
    # Conversation context
    sections.append("## Conversation History")
    sections.append(conversation_context)
    sections.append("")
    
    # Current message
    sections.append("## Current Patient Message")
    sections.append(user_message)
    sections.append("")
    
    # Symptom analysis (only if symptoms were detected)
    if symptoms:
        sections.append("## Detected Symptoms")
        sections.append(", ".join(symptoms))
        
        if symptom_result:
            sections.append("")
            sections.append("## Preliminary Symptom Analysis (Rule-Based)")
            for result in symptom_result:
                confidence_pct = int(result["confidence"] * 100)
                sections.append(f"- {result['condition']}: {confidence_pct}% confidence")
            sections.append("")
            sections.append("Note: This is a preliminary rule-based analysis. Use it as supporting context, not as a definitive assessment.")
        sections.append("")
    
    # Prediction results (only if a prediction was run)
    if prediction_result:
        sections.append("## AI Image Analysis Results")
        sections.append(f"Image Type Detected: {prediction_result.get('input_type', 'Unknown')}")
        sections.append(f"Model Used: {prediction_result.get('model_used', 'Unknown')}")
        preds = prediction_result.get("predictions", [])
        if preds:
            sections.append("Findings:")
            for pred in preds:
                confidence_pct = int(pred["confidence"] * 100)
                sections.append(f"- {pred['condition']}: {confidence_pct}% confidence")
        else:
            sections.append("No significant findings from the AI image analysis.")
        sections.append("")
        sections.append("Note: Present these as 'AI-assisted analysis findings' and recommend professional confirmation.")
        sections.append("")
    
    return "\n".join(sections)
    

def translate_text(text: str, target_language: str) -> str:
    """Translate text to the target language using Gemini."""
    try:
        client = get_client()
        # Clean text for translation (optional, but good to keep it simple)
        prompt = f"Translate the following medical AI response to {target_language}. Keep the medical terminology accurate and maintain the professional tone. Respond ONLY with the translated text.\n\nText:\n{text}"
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt]
        )
        return response.text
    except Exception as e:
        print(f"Translation error: {traceback.format_exc()}")
        return f"Error: {str(e)}"


def run_agent(
    user_message: str,
    session_id: str,
    file_path: str | None = None,
    use_vision_capabilities: bool = False
) -> str:
    """
    Core AI agent with:
    - session memory
    - input validation & sanitization  
    - symptom diagnosis
    - medical image prediction
    - emergency detection
    - structured error handling
    """

    # ----------------------------
    # 0. Input Validation
    # ----------------------------
    if not user_message or not user_message.strip():
        return "I didn't receive a message. Could you please try again?"
    
    if len(user_message) > MAX_MESSAGE_LENGTH:
        return f"Your message is too long ({len(user_message)} characters). Please keep it under {MAX_MESSAGE_LENGTH} characters."
    
    # Sanitize input
    user_message = sanitize_input(user_message)

    # ----------------------------
    # 1. Emergency Detection
    # ----------------------------
    emergency_msg = is_emergency(user_message)
    if emergency_msg:
        # Still save to history but prepend emergency response
        SESSION_MEMORY[session_id].append({"role": "user", "content": user_message})
        SESSION_MEMORY[session_id].append({"role": "assistant", "content": emergency_msg})
        return emergency_msg

    # ----------------------------
    # 2. Init Client
    # ----------------------------
    try:
        client = get_client()
    except ValueError as e:
        return f"⚠️ Configuration Error: {str(e)}"
    except Exception as e:
        print(f"Client init error: {traceback.format_exc()}")
        return "⚠️ I'm having trouble connecting to the AI service. Please check your API key configuration."

    # ----------------------------
    # 3. Load conversation history
    # ----------------------------
    history = SESSION_MEMORY[session_id]
    
    # Enforce session memory limit (prevent unbounded growth)
    if len(history) > 50:
        # Keep the first message + last 40 for context
        SESSION_MEMORY[session_id] = history[:1] + history[-40:]
        history = SESSION_MEMORY[session_id]

    history.append({
        "role": "user",
        "content": user_message
    })

    # ----------------------------
    # 4. Symptom extraction
    # ----------------------------
    symptoms = extract_symptoms(user_message)
    symptom_result = None
    if symptoms:
        try:
            symptom_result = diagnose_symptoms(symptoms)
        except Exception as e:
            print(f"Symptom diagnosis error: {e}")
            # Non-fatal — continue without symptom analysis

    # ----------------------------
    # 5. File processing (Prediction OR Vision)
    # ----------------------------
    prediction_result = None
    vision_image = None
    
    if file_path:
        # Validate file first
        is_valid, validation_msg = validate_file(file_path)
        if not is_valid:
            error_response = f"⚠️ **File Error**: {validation_msg}"
            history.append({"role": "assistant", "content": error_response})
            return error_response
        
        if use_vision_capabilities:
            try:
                vision_image = PIL.Image.open(file_path)
            except Exception as e:
                print(f"Error loading image for vision: {e}")
                error_response = "⚠️ I couldn't process the uploaded image. Please ensure it's a valid image file and try again."
                history.append({"role": "assistant", "content": error_response})
                return error_response
        else:
            try:
                prediction_result = run_prediction(file_path)
            except Exception as e:
                print(f"Prediction error: {traceback.format_exc()}")
                prediction_result = {
                    "input_type": "unknown",
                    "model_used": "error",
                    "predictions": [{"condition": "Analysis could not be completed", "confidence": 0.0}]
                }

    # ----------------------------
    # 6. Build structured prompt
    # ----------------------------
    conversation_context = build_conversation_context(history[:-1])  # Exclude current message
    
    prompt_text = build_prompt(
        user_message=user_message,
        conversation_context=conversation_context,
        symptoms=symptoms,
        symptom_result=symptom_result,
        prediction_result=prediction_result
    )

    # ----------------------------
    # 7. Gemini API call
    # ----------------------------
    try:
        contents = [prompt_text]
        if vision_image:
            contents.append(vision_image)

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents
        )

        assistant_text = response.text
        
        if not assistant_text or not assistant_text.strip():
            assistant_text = "I apologize, but I wasn't able to generate a response. Could you please rephrase your question?"

    except Exception as e:
        print(f"Gemini API error: {traceback.format_exc()}")
        error_type = type(e).__name__
        
        if "quota" in str(e).lower() or "rate" in str(e).lower():
            assistant_text = "⚠️ The AI service is currently rate-limited. Please wait a moment and try again."
        elif "invalid" in str(e).lower() and "key" in str(e).lower():
            assistant_text = "⚠️ The API key appears to be invalid. Please update your API key in the settings."
        elif "safety" in str(e).lower():
            assistant_text = "⚠️ The AI service flagged this request for safety reasons. Please rephrase your question."
        else:
            assistant_text = "⚠️ I encountered an issue processing your request. Please try again in a moment."

    # ----------------------------
    # 8. Save assistant reply
    # ----------------------------
    history.append({
        "role": "assistant",
        "content": assistant_text
    })

    return assistant_text
