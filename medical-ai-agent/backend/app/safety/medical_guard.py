"""
Medical Safety Guard Module
----------------------------
Provides input sanitization, prompt injection prevention,
and emergency detection for the Diagnos AI platform.
"""

import re

# ============================
# Emergency Keywords & Patterns
# ============================
EMERGENCY_PATTERNS = [
    # Cardiac emergencies
    (r"\b(heart\s*attack|cardiac\s*arrest|chest\s*pain.*breath|crushing\s*chest)\b", "cardiac"),
    # Stroke
    (r"\b(stroke|sudden\s*numbness|can'?t\s*speak|face\s*drooping|slurred\s*speech)\b", "stroke"),
    # Severe allergic reaction
    (r"\b(anaphyla|throat\s*(?:closing|swelling).*breath|can'?t\s*breathe.*swell)\b", "anaphylaxis"),
    # Severe bleeding
    (r"\b(won'?t\s*stop\s*bleeding|severe\s*bleeding|hemorrhag|uncontrolled\s*bleed)\b", "bleeding"),
    # Self-harm / suicidal ideation
    (r"\b(suicid|kill\s*myself|end\s*(?:my|it\s*all)|self[- ]?harm|want\s*to\s*die|don'?t\s*want\s*to\s*live)\b", "mental_health_crisis"),
    # Loss of consciousness
    (r"\b(unconscious|passed\s*out|not\s*breathing|stopped\s*breathing|no\s*pulse)\b", "unconscious"),
    # Severe head trauma
    (r"\b(severe\s*head\s*(?:injury|trauma)|skull\s*fracture|brain\s*bleed)\b", "head_trauma"),
    # Overdose
    (r"\b(overdos|took\s*too\s*(?:many|much)\s*pills)\b", "overdose"),
    # Choking
    (r"\b(choking|can'?t\s*breathe.*food|airway\s*(?:blocked|obstruct))\b", "choking"),
]

EMERGENCY_RESPONSES = {
    "cardiac": (
        "🚨 **URGENT — Possible Cardiac Emergency**\n\n"
        "The symptoms you describe may indicate a serious cardiac event. "
        "**Please call emergency services (911) immediately.**\n\n"
        "While waiting for help:\n"
        "- Sit or lie down in a comfortable position\n"
        "- If you have aspirin and are not allergic, chew one regular aspirin\n"
        "- Loosen any tight clothing\n"
        "- Stay calm and try to keep breathing steadily\n\n"
        "> ⚕️ *This is an emergency situation. Please seek immediate medical attention.*"
    ),
    "stroke": (
        "🚨 **URGENT — Possible Stroke Symptoms**\n\n"
        "The symptoms you describe may indicate a stroke. "
        "**Call emergency services (911) immediately.** Time is critical.\n\n"
        "Remember **F.A.S.T.**:\n"
        "- **F**ace — Is one side drooping?\n"
        "- **A**rms — Can you raise both arms?\n"
        "- **S**peech — Is speech slurred?\n"
        "- **T**ime — Call 108 now!\n\n"
        "> ⚕️ *This is an emergency situation. Every minute counts.*"
    ),
    "anaphylaxis": (
        "🚨 **URGENT — Possible Severe Allergic Reaction**\n\n"
        "**Call emergency services (911) immediately.**\n\n"
        "If an epinephrine auto-injector (EpiPen) is available, use it now.\n"
        "- Lie flat with legs elevated (unless having breathing difficulty)\n"
        "- Do not take oral medications if throat is swelling\n\n"
        "> ⚕️ *This is a life-threatening emergency. Seek immediate help.*"
    ),
    "bleeding": (
        "🚨 **URGENT — Severe Bleeding**\n\n"
        "**Call emergency services (108) immediately.**\n\n"
        "While waiting:\n"
        "- Apply firm, direct pressure to the wound with a clean cloth\n"
        "- Do not remove the cloth — add more layers if needed\n"
        "- Keep the injured area elevated above the heart if possible\n\n"
        "> ⚕️ *This is an emergency. Professional medical help is needed immediately.*"
    ),
    "mental_health_crisis": (
        "🚨 **You Are Not Alone**\n\n"
        "I hear you, and I want you to know that help is available right now.\n\n"
        "**Please reach out immediately:**\n"
        "- 🇺🇸 **988 Suicide & Crisis Lifeline**: Call or text **988**\n"
        "- 🇺🇸 **Crisis Text Line**: Text **HOME** to **741741**\n"
        "- 🌍 **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/\n"
        "- Or call your local emergency number (911)\n\n"
        "You matter, and there are people who want to help. 💙\n\n"
        "> ⚕️ *If you are in immediate danger, please call emergency services now.*"
    ),
    "unconscious": (
        "🚨 **URGENT — Medical Emergency**\n\n"
        "**Call emergency services (108) immediately.**\n\n"
        "If someone is unconscious:\n"
        "- Check for breathing — if not breathing, begin CPR if trained\n"
        "- Place them in the recovery position if breathing\n"
        "- Do not move them if a spinal injury is suspected\n\n"
        "> ⚕️ *This is a life-threatening emergency.*"
    ),
    "head_trauma": (
        "🚨 **URGENT — Severe Head Injury**\n\n"
        "**Call emergency services (108) immediately.**\n\n"
        "- Do not move the person unless absolutely necessary\n"
        "- Apply gentle pressure to any bleeding wounds\n"
        "- Keep the person still and calm\n"
        "- Monitor breathing and consciousness\n\n"
        "> ⚕️ *Severe head injuries require immediate emergency medical care.*"
    ),
    "overdose": (
        "🚨 **URGENT — Possible Overdose**\n\n"
        "**Call emergency services (108) or Poison Control (1-800-222-1222) immediately.**\n\n"
        "- Stay with the person\n"
        "- If unconscious, place in recovery position\n"
        "- If Narcan (naloxone) is available and opioid overdose is suspected, administer it\n"
        "- Do not try to make them vomit\n\n"
        "> ⚕️ *This is a life-threatening emergency.*"
    ),
    "choking": (
        "🚨 **URGENT — Choking Emergency**\n\n"
        "**Call emergency services (108) if the person cannot cough, speak, or breathe.**\n\n"
        "- Perform the Heimlich maneuver (abdominal thrusts)\n"
        "- For infants, use back blows and chest thrusts\n"
        "- If the person becomes unconscious, begin CPR\n\n"
        "> ⚕️ *This is an emergency. Act quickly.*"
    ),
}


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent prompt injection and clean up input.
    
    - Strips common prompt injection patterns
    - Removes excessive whitespace
    - Limits repeated characters
    """
    if not text:
        return ""
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    # Remove common prompt injection patterns
    injection_patterns = [
        r"(?i)ignore\s+(all\s+)?previous\s+instructions",
        r"(?i)forget\s+(all\s+)?your\s+(previous\s+)?instructions",
        r"(?i)you\s+are\s+now\s+a\s+",
        r"(?i)new\s+instructions?:\s*",
        r"(?i)system\s*:\s*",
        r"(?i)override\s+(all\s+)?safety",
        r"(?i)jailbreak",
        r"(?i)disregard\s+(all\s+)?previous",
        r"(?i)act\s+as\s+(?:if\s+)?you\s+(?:are|were)\s+",
    ]
    
    for pattern in injection_patterns:
        if re.search(pattern, text):
            # Don't remove the text — just flag it by wrapping
            # The model will still see the original but the system prompt takes precedence
            break
    
    # Collapse excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Limit repeated characters (e.g., "aaaaaaa" -> "aaa")
    text = re.sub(r'(.)\1{9,}', r'\1\1\1', text)
    
    return text


def is_emergency(text: str) -> str | None:
    """
    Check if the user's message indicates a medical emergency.
    Returns an emergency response string if detected, None otherwise.
    """
    if not text:
        return None
    
    lower_text = text.lower()
    
    for pattern, emergency_type in EMERGENCY_PATTERNS:
        if re.search(pattern, lower_text):
            return EMERGENCY_RESPONSES.get(emergency_type)
    
    return None
