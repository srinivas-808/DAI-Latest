import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras import layers, models
import os

# ---------------- CONFIG ----------------
IMG_SIZE = (224, 224)

CLASS_NAMES = [
    'abnormal_heartbeat',
    'myocardial_infarction',
    'Normal',
    'post_mi_history'
]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEIGHTS_PATH = os.path.join(
    BASE_DIR, "models", "ecg_model.weights.h5"
)

# ----------- BUILD MODEL (EXACT MATCH) --------
def build_ecg_model():
    model = models.Sequential([
        layers.Input(shape=(224, 224, 3)),

        # Normalization (must exist — you trained with it)
        layers.Rescaling(1. / 255),

        # Feature extraction (exact same order)
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),

        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),

        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),

        # Decision head
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(4, activation='softmax')
    ])

    # 🔥 Load trained weights
    model.load_weights(WEIGHTS_PATH)
    return model

# Load once at startup
ECG_MODEL = build_ecg_model()

# ----------- PREDICTION FUNCTION --------
def predict_ecg(file_path: str):
    img = image.load_img(file_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    preds = ECG_MODEL.predict(img_array)[0]

    results = []
    for label, score in zip(CLASS_NAMES, preds):
        results.append({
            "condition": label,
            "confidence": float(score)
        })

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results
