from app.tools.image_classifier import classify_image
from app.tools.model_router import route_model
from app.tools.xray_model import predict_xray
from app.tools.mri_model import predict_mri
from app.tools.ecg_model import predict_ecg

def run_prediction(file_path: str):
    image_type = classify_image(file_path)
    model_name = route_model(image_type)

    if model_name == "chest_xray_model":
        predictions = predict_xray(file_path)

    elif model_name == "mri_model":
        predictions = predict_mri(file_path)

    elif model_name == "ecg_model":
        predictions = predict_ecg(file_path)

    else:
        predictions = []

    return {
        "input_type": image_type,
        "model_used": model_name,
        "predictions": predictions
    }
