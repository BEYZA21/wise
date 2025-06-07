from rest_framework.views import APIView
from rest_framework.response import Response
from users.models import AnalysisResult
from yolo_models.image_loader import load_image_from_url
from yolo_models.classify_and_detect import analyze_image_from_url
import uuid
import os
import sys
import pathlib
import base64
import json
from google.cloud import storage
from google.oauth2 import service_account
from io import BytesIO

# GCS Credential Setup (globalde sadece bu olabilir)
import base64
import json
from google.oauth2 import service_account

base64_creds = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
creds_json = json.loads(base64.b64decode(base64_creds).decode("utf-8"))
credentials = service_account.Credentials.from_service_account_info(creds_json)

from google.cloud import storage
gcs_client = storage.Client(credentials=credentials)

BUCKET_NAME = "wise-uploads"
GCS_PREFIX = "processed"
bucket = gcs_client.bucket(BUCKET_NAME)

# Windows için yol uyumu
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

_plate_model = None

def get_plate_model():
    global _plate_model
    if _plate_model is None:
        import torch
        _plate_model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5/weights/wisePlate.pt')
    return _plate_model

def get_transform():
    import torchvision.transforms as transforms
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

already_processed_urls = set()

def analysis_result_exists(image_url):
    return AnalysisResult.objects.filter(image_url=image_url).exists()

def crop_and_save(image, class_names=None, original_filename="", photo_day=None):
    uploaded_results = []
    try:
        import torch
        import numpy as np
        from PIL import Image
        from io import BytesIO

        plate_model = get_plate_model()
        results = plate_model(image)
        detections = results.xyxy[0].cpu().numpy()
        class_names = plate_model.names

        img_np = np.array(image)
        h, w = img_np.shape[:2]

        transform = get_transform()

        for i, det in enumerate(detections):
            try:
                x1, y1, x2, y2, conf, cls = det
                x1 = int(max(0, min(round(x1), w - 1)))
                y1 = int(max(0, min(round(y1), h - 1)))
                x2 = int(max(0, min(round(x2), w)))
                y2 = int(max(0, min(round(y2), h)))
                if conf < 0.5:
                    continue
                area = (x2 - x1) * (y2 - y1)
                if area < 1500 or area > (w * h * 0.8):
                    continue
                if x2 <= x1 or y2 <= y1:
                    continue

                crop = img_np[y1:y2, x1:x2]
                if crop.size == 0:
                    continue

                pil_img = Image.fromarray(crop)

                # Debug crop'u kaydetmek istersen burayı aktif et
                # debug_crop_path = f"crop_debug_{i}_{original_filename}"
                # pil_img.save(debug_crop_path)

                tensor = transform(pil_img).unsqueeze(0)

                category = class_names[int(cls)]
                result = analyze_image_from_url(tensor=tensor, category=category)

                if result.get("error"):
                    result["photo_day"] = photo_day
                    uploaded_results.append(result)
                    continue

                food_type = result.get("tur", "bilinmeyen")
                israf = result.get("israf", "bilinmiyor")

                new_blob_path = f"{GCS_PREFIX}/{category}/{food_type}/{israf}/{i}_{original_filename}"
                buffer = BytesIO()
                pil_img.save(buffer, format="JPEG")
                buffer.seek(0)
                final_blob = bucket.blob(new_blob_path)
                final_blob.upload_from_file(buffer, content_type="image/jpeg")

                final_image_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{new_blob_path}"

                if final_image_url not in already_processed_urls and not analysis_result_exists(final_image_url):
                    AnalysisResult.objects.create(
                        image_url=final_image_url,
                        food_category=category,
                        food_type=food_type,
                        is_waste=israf == "israf-var",
                        photo_day=photo_day
                    )
                    already_processed_urls.add(final_image_url)
                result["photo_day"] = photo_day
                uploaded_results.append(result)

            except Exception as e:
                import traceback
                traceback.print_exc()
                error_result = {"error": str(e), "photo_day": photo_day}
                uploaded_results.append(error_result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_result = {"error": str(e), "photo_day": photo_day}
        uploaded_results.append(error_result)

    return uploaded_results
