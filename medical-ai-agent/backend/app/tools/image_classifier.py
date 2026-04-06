import os
import PIL.Image
from google import genai
from dotenv import load_dotenv

load_dotenv()

# IMPORTANT: must match training order for the rest of pipeline mapping
CLASS_NAMES = ["ecgs", "mris", "xrays", "none"]

def classify_image(file_path: str) -> str:
    """
    Classify medical image as ecgs, mris, xrays, or none using Gemini Vision.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key == "TODO_ENTER_YOUR_API_KEY":
        print("Warning: GEMINI_API_KEY not configured. Falling back to 'none' classification.")
        return "none"

    try:
        client = genai.Client(api_key=api_key)
        image = PIL.Image.open(file_path)
        
        prompt = (
            "You are a medical image classification assistant. "
            "Examine this image and classify it strictly into one of the following four categories: "
            "'ecgs', 'mris', 'xrays', or 'none'. "
            "Reply with exactly one word from the list."
        )
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt, image]
        )
        
        result = response.text.strip().lower()
        
        # Strip out any markdown or punctuation that might have been included
        import re
        result = re.sub(r'[^a-z]', '', result)

        if result in CLASS_NAMES:
            return result
        else:
            # Fallback mapping if model generates slightly different words
            if "xray" in result: return "xrays"
            if "ecg" in result or "ekg" in result: return "ecgs"
            if "mri" in result: return "mris"
            
            return "none"
            
    except Exception as e:
        print(f"Vision API error during image classification: {e}")
        return "none"
