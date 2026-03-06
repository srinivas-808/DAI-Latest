"""
Diagnos AI — Standalone Test Runner
======================================
Tests pure Python modules that don't require heavy dependencies.
Run with: python tests/test_standalone.py
"""

import sys
import os
import tempfile

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PASSED = 0
FAILED = 0

def test(name):
    """Decorator to register and run a test."""
    def decorator(func):
        global PASSED, FAILED
        try:
            func()
            print(f"  ✅ {name}")
            PASSED += 1
        except Exception as e:
            print(f"  ❌ {name}: {e}")
            FAILED += 1
        return func
    return decorator


# ============================
# Safety Guard Tests
# ============================
print("\n🛡️  Safety Guard Tests")
print("-" * 40)

from app.safety.medical_guard import sanitize_input, is_emergency

@test("sanitize strips whitespace")
def _():
    assert sanitize_input("  hello  ") == "hello"

@test("sanitize collapses whitespace")
def _():
    assert sanitize_input("hello    world") == "hello world"

@test("sanitize limits repeated chars")
def _():
    assert sanitize_input("a" * 20) == "aaa"

@test("sanitize handles empty string")
def _():
    assert sanitize_input("") == ""

@test("sanitize handles None")
def _():
    assert sanitize_input(None) == ""

@test("sanitize preserves normal text")
def _():
    text = "I have a headache and fever since yesterday"
    assert sanitize_input(text) == text

@test("emergency: cardiac detected")
def _():
    result = is_emergency("I am having a heart attack and cant breathe")
    assert result is not None
    assert "URGENT" in result

@test("emergency: stroke detected")
def _():
    result = is_emergency("I think I'm having a stroke")
    assert result is not None

@test("emergency: mental health detected")
def _():
    result = is_emergency("I want to kill myself")
    assert result is not None
    assert "988" in result

@test("emergency: choking detected")
def _():
    result = is_emergency("my child is choking and can't breathe")
    assert result is not None

@test("emergency: overdose detected")
def _():
    result = is_emergency("I took too many pills")
    assert result is not None

@test("emergency: unconscious detected")
def _():
    result = is_emergency("someone is unconscious and not breathing")
    assert result is not None

@test("no emergency: normal headache")
def _():
    assert is_emergency("I have a mild headache") is None

@test("no emergency: empty string")
def _():
    assert is_emergency("") is None
    assert is_emergency(None) is None


# ============================
# Symptom Diagnosis Tests
# ============================
print("\n🩺 Symptom Diagnosis Tests")
print("-" * 40)

from app.tools.symptom_diagnosis import diagnose_symptoms

@test("empty symptoms returns no-data result")
def _():
    result = diagnose_symptoms([])
    assert len(result) >= 1
    assert result[0]["confidence"] == 0.0

@test("fever + cough matches viral infection")
def _():
    result = diagnose_symptoms(["fever", "cough"])
    conditions = [r["condition"] for r in result]
    assert any("Viral" in c for c in conditions)

@test("fever + cough + chest pain matches pneumonia")
def _():
    result = diagnose_symptoms(["fever", "cough", "chest pain"])
    conditions = [r["condition"] for r in result]
    assert any("Pneumonia" in c for c in conditions)

@test("fatigue + thirst + urination matches diabetes")
def _():
    result = diagnose_symptoms(["fatigue", "thirst", "frequent urination"])
    conditions = [r["condition"] for r in result]
    assert any("Diabetes" in c for c in conditions)

@test("headache + nausea matches migraine")
def _():
    result = diagnose_symptoms(["headache", "nausea"])
    conditions = [r["condition"] for r in result]
    assert any("Headache" in c or "Migraine" in c for c in conditions)

@test("cardiac symptoms detected")
def _():
    result = diagnose_symptoms(["chest pain", "shortness of breath", "palpitations"])
    conditions = [r["condition"] for r in result]
    assert any("Cardiac" in c for c in conditions)

@test("unknown symptom returns low confidence")
def _():
    result = diagnose_symptoms(["xyz_unknown_symptom"])
    assert result[0]["confidence"] <= 0.3

@test("results sorted by confidence (descending)")
def _():
    result = diagnose_symptoms(["fever", "cough", "chest pain", "fatigue"])
    for i in range(len(result) - 1):
        assert result[i]["confidence"] >= result[i + 1]["confidence"]

@test("max 5 results returned")
def _():
    result = diagnose_symptoms([
        "fever", "cough", "fatigue", "chest pain", "thirst",
        "headache", "sore throat", "shortness of breath", "nausea",
        "dizziness", "back pain", "joint pain"
    ])
    assert len(result) <= 5

@test("result structure is correct")
def _():
    result = diagnose_symptoms(["fever", "cough"])
    for item in result:
        assert "condition" in item
        assert "confidence" in item
        assert isinstance(item["condition"], str)
        assert isinstance(item["confidence"], (int, float))
        assert 0 <= item["confidence"] <= 1

@test("gastro symptoms detected")
def _():
    result = diagnose_symptoms(["nausea", "vomiting", "diarrhea"])
    conditions = [r["condition"] for r in result]
    assert any("Gastro" in c for c in conditions)

@test("anxiety symptoms detected")
def _():
    result = diagnose_symptoms(["anxiety", "palpitations", "insomnia"])
    conditions = [r["condition"] for r in result]
    assert any("Anxiety" in c for c in conditions)


# ============================
# Model Router Tests
# ============================
print("\n🔀 Model Router Tests")
print("-" * 40)

from app.tools.model_router import route_model

@test("xrays route to chest_xray_model")
def _():
    assert route_model("xrays") == "chest_xray_model"

@test("ecgs route to ecg_model")
def _():
    assert route_model("ecgs") == "ecg_model"

@test("mris route to mri_model")
def _():
    assert route_model("mris") == "mri_model"

@test("unknown type returns None")
def _():
    assert route_model("unknown") is None

@test("empty string returns None")
def _():
    assert route_model("") is None


# ============================
# Results Summary
# ============================
print("\n" + "=" * 40)
print(f"📊 Results: {PASSED} passed, {FAILED} failed, {PASSED + FAILED} total")
print("=" * 40)

if FAILED > 0:
    print("❌ Some tests failed!")
    sys.exit(1)
else:
    print("✅ All tests passed!")
    sys.exit(0)
