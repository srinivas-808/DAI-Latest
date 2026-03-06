def route_model(image_type: str):
    if image_type == "xrays":
        return "chest_xray_model"

    if image_type == "ecgs":
        return "ecg_model"

    if image_type == "mris":
        return "mri_model"

    return None
