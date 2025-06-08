import os
import json
import base64
import requests
import numpy as np
from PIL import Image
from io import BytesIO
import torch
from pathlib import Path

from users.models import AnalysisResult
from google.cloud import storage
from google.oauth2 import service_account

from yolo_models.classify_and_detect import analyze_image_from_url

# === Ayarlar ===
BUCKET_NAME = "wise-uploads"
GCS_PREFIX = "processed"
MODEL_FILENAME = "wisePlate.pt"  # weights klasöründe olmalı

# === GCS Bağlantısı ===
creds_data = json.loads(base64.b64decode(os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")).decode("utf-8"))
credentials = service_account.Credentials.from_service_account_info(creds_data)
gcs_client = storage.Client(credentials=credentials)
bucket = gcs_client.bucket(BUCKET_NAME)

# === Model Yükleme (Lazy + Cache)
_plate_model = None
loaded_models = {}

def load_model(model_filename):
    if model_filename not in loaded_models:
        model_path = Path("yolov5/weights") / model_filename
        if not model_path.exists():
            raise FileNotFoundError(f"Model bulunamadı: {model_path}")
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=str(model_path), force_reload=False)
        model.eval()
        loaded_models[model_filename] = model
    return loaded_models[model_filename]

def get_plate_model():
    global _plate_model
    if _plate_model is None:
        _plate_model = load_model(MODEL_FILENAME)
    return _plate_model

def get_transform():
    import torchvision.transforms as transforms
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

# === Ana Fonksiyon ===
def crop_and_save(image, original_filename="", photo_day=None):
    uploaded_results = []

    try:
        model = get_plate_model()
        transform = get_transform()

        results = model(image)
        detections = results.xyxy[0].cpu().numpy()
        class_names = model.names

        img_np = np.array(image)
        h, w = img_np.shape[:2]

        for i, det in enumerate(detections):
            try:
                x1, y1, x2, y2, conf, cls = det
                if conf < 0.5:
                    continue

                x1 = int(max(0, min(round(x1), w - 1)))
                y1 = int(max(0, min(round(y1), h - 1)))
                x2 = int(max(0, min(round(x2), w)))
                y2 = int(max(0, min(round(y2), h)))

                area = (x2 - x1) * (y2 - y1)
                if area < 1500 or area > (w * h * 0.8) or x2 <= x1 or y2 <= y1:
                    continue

                crop = img_np[y1:y2, x1:x2]
                if crop.size == 0:
                    continue

                pil_img = Image.fromarray(crop)
                tensor = transform(pil_img).unsqueeze(0)
                category = class_names[int(cls)]

                # Alt sınıflandırma
                result = analyze_image_from_url(tensor=tensor, category=category)
                if result.get("error"):
                    result["photo_day"] = photo_day
                    uploaded_results.append(result)
                    continue

                food_type = result.get("tur", "bilinmeyen")
                israf = result.get("israf", "bilinmiyor")

                # GCS'ye kaydet
                new_blob_path = f"{GCS_PREFIX}/{category}/{food_type}/{israf}/{i}_{original_filename}"
                buffer = BytesIO()
                pil_img.save(buffer, format="JPEG")
                buffer.seek(0)
                blob = bucket.blob(new_blob_path)
                blob.upload_from_file(buffer, content_type="image/jpeg")

                image_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{new_blob_path}"

                result.update({
                    "image_url": image_url,
                    "food_category": category,
                    "food_type": food_type,
                    "is_waste": israf == "israf-var",
                    "photo_day": photo_day,
                    "tur_confidence": result.get("tur_confidence"),
                    "israf_confidence": result.get("israf_confidence")
                })

                uploaded_results.append(result)

            except Exception as e:
                import traceback
                traceback.print_exc()
                uploaded_results.append({"error": str(e), "photo_day": photo_day})

    except Exception as e:
        import traceback
        traceback.print_exc()
        uploaded_results.append({"error": str(e), "photo_day": photo_day})

    return uploaded_results
