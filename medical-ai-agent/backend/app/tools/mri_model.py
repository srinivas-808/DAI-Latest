import tensorflow as tf
import numpy as np
from PIL import Image
import os

# ---------------- CONFIG ----------------
IMG_SIZE = (299, 299)

CLASS_LABELS = [
    'Glioma',
    'Meningioma',
    'No Tumor',
    'Pituitary'
]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(
    BASE_DIR, "models", "brain_tumor_best.keras"
)

# ----------- BUILD ARCHITECTURE ----------
def build_mri_model():
    img_shape = (299, 299, 3)

    base_model = tf.keras.applications.Xception(
        include_top=False,
        weights=None,
        input_shape=img_shape,
        pooling='max'
    )

    model = tf.keras.models.Sequential([
        base_model,
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dropout(rate=0.3),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(rate=0.25),
        tf.keras.layers.Dense(4, activation='softmax')
    ])

    model.load_weights(MODEL_PATH)
    return model

# 🔥 Load once at startup
MRI_MODEL = build_mri_model()

# ----------- PREDICTION FUNCTION --------
def predict_mri(file_path: str):
    img = Image.open(file_path).convert("RGB")
    img = img.resize(IMG_SIZE)

    img_array = np.asarray(img).astype("float32") / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    preds = MRI_MODEL.predict(img_array)[0]

    results = []
    for label, score in zip(CLASS_LABELS, preds):
        results.append({
            "condition": label,
            "confidence": float(score)
        })

    # Sort by confidence
    results.sort(key=lambda x: x["confidence"], reverse=True)

    return results
