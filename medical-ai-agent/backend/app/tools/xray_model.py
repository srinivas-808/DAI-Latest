import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNet
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing import image
import os

# ---------------- CONFIG ----------------
IMG_SIZE = (128, 128)

LABELS = [
    'Atelectasis', 'Cardiomegaly', 'Consolidation', 'Edema', 'Effusion',
    'Emphysema', 'Fibrosis', 'Infiltration', 'Mass', 'Nodule',
    'Pleural_Thickening', 'Pneumonia', 'Pneumothorax'
]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEIGHTS_PATH = os.path.join(
    BASE_DIR, "models", "xray_class_weights.best.hdf5"
)

# ------------- BUILD MODEL -------------
def build_xray_model():
    base = MobileNet(
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 1),
        include_top=False,
        weights=None
    )

    model = Sequential([
        base,
        GlobalAveragePooling2D(),
        Dropout(0.5),
        Dense(512),
        Dropout(0.5),
        Dense(len(LABELS), activation='sigmoid')
    ])

    model.load_weights(WEIGHTS_PATH)
    return model

# 🔥 Load model ONCE
XRAY_MODEL = build_xray_model()

# ----------- PREDICTION FUNCTION ----------
def predict_xray(file_path: str, threshold: float = 0.3):
    img = image.load_img(
        file_path,
        target_size=IMG_SIZE,
        color_mode="grayscale"
    )

    x = image.img_to_array(img)
    x -= np.mean(x)
    x /= (np.std(x) + 1e-7)
    x = np.expand_dims(x, axis=0)

    preds = XRAY_MODEL.predict(x)[0]

    results = []
    for label, score in zip(LABELS, preds):
        if score >= threshold:
            results.append({
                "condition": label,
                "confidence": float(score)
            })

    # Fallback if nothing crosses threshold
    if not results:
        results.append({
            "condition": "No significant abnormality detected",
            "confidence": float(np.max(preds))
        })

    return results
