"""
Rule-Based Symptom Diagnosis Engine
-------------------------------------
Provides preliminary symptom-to-condition mapping using
a curated rule set. This serves as supplementary context
for the AI agent, NOT as a standalone diagnostic tool.
"""


def diagnose_symptoms(symptoms: list[str]) -> list[dict]:
    """
    Match user-reported symptoms against a rule-based knowledge base.
    Returns a list of possible conditions with confidence scores.
    
    Args:
        symptoms: List of symptom strings (lowercase)
    
    Returns:
        List of dicts with 'condition' and 'confidence' keys
    """
    if not symptoms:
        return [{"condition": "No symptoms provided", "confidence": 0.0}]
    
    rules = [
        # Respiratory conditions
        {
            "conditions": ["Common Cold / Viral Upper Respiratory Infection"],
            "match": {"cough", "sore throat"},
            "weight": 0.5
        },
        {
            "conditions": ["Influenza (Flu)"],
            "match": {"fever", "cough", "fatigue", "muscle aches"},
            "weight": 0.7
        },
        {
            "conditions": ["Viral Infection"],
            "match": {"fever", "cough"},
            "weight": 0.55
        },
        {
            "conditions": ["Pneumonia"],
            "match": {"fever", "cough", "chest pain"},
            "weight": 0.75
        },
        {
            "conditions": ["Bronchitis"],
            "match": {"cough", "chest pain", "fatigue"},
            "weight": 0.6
        },
        {
            "conditions": ["Asthma Exacerbation"],
            "match": {"shortness of breath", "wheezing", "cough"},
            "weight": 0.7
        },
        
        # Metabolic conditions
        {
            "conditions": ["Diabetes Mellitus (Type 2)"],
            "match": {"fatigue", "thirst", "frequent urination"},
            "weight": 0.7
        },
        {
            "conditions": ["Diabetes-Related Symptoms"],
            "match": {"excessive thirst", "frequent urination", "weight loss"},
            "weight": 0.75
        },
        {
            "conditions": ["Thyroid Dysfunction"],
            "match": {"fatigue", "weight gain", "depression"},
            "weight": 0.55
        },
        
        # Neurological conditions
        {
            "conditions": ["Tension Headache / Migraine"],
            "match": {"headache", "nausea"},
            "weight": 0.5
        },
        {
            "conditions": ["Migraine with Aura"],
            "match": {"headache", "blurred vision", "nausea"},
            "weight": 0.65
        },
        
        # Cardiovascular
        {
            "conditions": ["Cardiac Concern"],
            "match": {"chest pain", "shortness of breath", "palpitations"},
            "weight": 0.8
        },
        {
            "conditions": ["Hypertension-Related Symptoms"],
            "match": {"headache", "dizziness", "blurred vision"},
            "weight": 0.55
        },
        
        # Gastrointestinal
        {
            "conditions": ["Gastroenteritis"],
            "match": {"nausea", "vomiting", "diarrhea"},
            "weight": 0.65
        },
        {
            "conditions": ["Gastric/Abdominal Concern"],
            "match": {"abdominal pain", "nausea", "loss of appetite"},
            "weight": 0.55
        },
        
        # Musculoskeletal
        {
            "conditions": ["Arthritis / Joint Disorder"],
            "match": {"joint pain", "swelling", "fatigue"},
            "weight": 0.6
        },
        {
            "conditions": ["Musculoskeletal Strain"],
            "match": {"back pain", "muscle aches"},
            "weight": 0.45
        },
        
        # Infectious
        {
            "conditions": ["Strep Throat / Pharyngitis"],
            "match": {"sore throat", "fever", "difficulty swallowing"},
            "weight": 0.65
        },
        {
            "conditions": ["Upper Respiratory Infection"],
            "match": {"cough", "sore throat", "fatigue"},
            "weight": 0.55
        },
        
        # General / Systemic
        {
            "conditions": ["Iron Deficiency / Anemia"],
            "match": {"fatigue", "dizziness", "shortness of breath"},
            "weight": 0.5
        },
        {
            "conditions": ["Dehydration"],
            "match": {"thirst", "dizziness", "dry mouth"},
            "weight": 0.5
        },
        {
            "conditions": ["Anxiety Disorder"],
            "match": {"anxiety", "palpitations", "insomnia"},
            "weight": 0.55
        },
        {
            "conditions": ["Sleep Disorder"],
            "match": {"insomnia", "fatigue"},
            "weight": 0.45
        },
        
        # Allergic
        {
            "conditions": ["Allergic Reaction"],
            "match": {"rash", "swelling"},
            "weight": 0.5
        },
        {
            "conditions": ["Dermatitis / Skin Condition"],
            "match": {"rash", "fatigue"},
            "weight": 0.4
        },
        
        # Urological
        {
            "conditions": ["Urinary Tract Concern"],
            "match": {"frequent urination", "abdominal pain"},
            "weight": 0.5
        },
        {
            "conditions": ["Kidney Concern"],
            "match": {"back pain", "blood in urine", "fatigue"},
            "weight": 0.6
        },
    ]

    results = []
    symptom_set = set(s.lower() for s in symptoms)

    for rule in rules:
        if rule["match"].issubset(symptom_set):
            results.append({
                "condition": rule["conditions"][0],
                "confidence": rule["weight"]
            })

    if not results:
        results.append({
            "condition": "No specific pattern matched — further evaluation recommended",
            "confidence": 0.2
        })

    # Sort by confidence descending
    results.sort(key=lambda x: x["confidence"], reverse=True)
    
    # Limit to top 5 results to avoid overwhelming the model
    return results[:5]
