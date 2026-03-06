import tensorflow as tf
import numpy as np
from tensorflow.keras.utils import load_img, img_to_array
import os

# Load model ONCE
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "medical_classifier.keras")

classifier_model = tf.keras.models.load_model(MODEL_PATH)

# IMPORTANT: must match training order
CLASS_NAMES = ["ecgs", "mris", "xrays"]

def classify_image(file_path: str):
    """
    Classify medical image as ecg, mri, or xray using trained CNN.
    """

    img = load_img(file_path, target_size=(224, 224))
    img_array = img_to_array(img)
    img_array = tf.expand_dims(img_array, 0)

    predictions = classifier_model.predict(img_array)
    predicted_class = CLASS_NAMES[np.argmax(predictions)]

    return predicted_class
