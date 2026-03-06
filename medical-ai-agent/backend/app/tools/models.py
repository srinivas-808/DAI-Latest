def chest_xray_model(file_path: str):
    # Later replace with real ML model
    return [
        {"condition": "Pneumonia", "confidence": 0.82},
        {"condition": "Normal", "confidence": 0.11}
    ]
def ecg_model(file_path: str):
    return [
        {"condition": "Arrhythmia", "confidence": 0.78},
        {"condition": "Normal Rhythm", "confidence": 0.15}
    ]
def mri_model(file_path: str):
    # Placeholder — replace with real MRI model later
    return [
        {"condition": "Possible Tumor", "confidence": 0.76},
        {"condition": "Normal", "confidence": 0.14}
    ]
