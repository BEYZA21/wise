from rest_framework.views import APIView
from rest_framework.response import Response
from users.models import AnalysisResult
from yolo_models.image_loader import load_image_from_url
from google.cloud import storage
import cv2
from PIL import Image
from io import BytesIO
import uuid
import os
import torch
import sys
import pathlib
import numpy as np
import torchvision.transforms as transforms
from yolo_models.classify_and_detect import analyze_image_from_url

# GCS Ayarları
BUCKET_NAME = "wise-uploads"
GCS_PREFIX = "processed"
creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
gcs_client = storage.Client.from_service_account_json(creds_path)
bucket = gcs_client.bucket(BUCKET_NAME)

# Windows için yol uyumu
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

# YOLO modelini yükle
plate_model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5/weights/wisePlate.pt')
plate_model.eval()

# Model çıktılarının doğru olup olmadığını kontrol et
print("🔍 YOLO Model sınıf isimleri:", plate_model.names)

# Analiz için transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Daha önce analiz edilen görselleri takip etmek için bir küme (cache gibi davranır)
already_processed_urls = set()

def analysis_result_exists(image_url):
    return AnalysisResult.objects.filter(image_url=image_url).exists()
def crop_and_save(image, class_names=None, original_filename="", photo_day=None):
    uploaded_results = []
    results = plate_model(image)
    detections = results.xyxy[0].cpu().numpy()
    class_names = plate_model.names

    img_np = np.array(image)
    h, w = img_np.shape[:2]

    for i, det in enumerate(detections):
        try:
            x1, y1, x2, y2, conf, cls = det
            # Dönüşüm ve sınır kontrolü
            x1 = int(max(0, min(round(x1), w - 1)))
            y1 = int(max(0, min(round(y1), h - 1)))
            x2 = int(max(0, min(round(x2), w)))
            y2 = int(max(0, min(round(y2), h)))
            print(f"[DEBUG] img_np.shape: {img_np.shape}")
            print(f"[DEBUG] x1={x1}, y1={y1}, x2={x2}, y2={y2}")
            # Bunu crop alınan yerde uygula
            if conf < 0.5:
                print(f"[WARNING] Düşük confidence, atlanıyor: conf={conf}")
                continue
            area = (x2 - x1) * (y2 - y1)
            if area < 1500 or area > (w * h * 0.8):  # Çok küçük ya da çok büyük kutu
                print(f"[WARNING] Uygunsuz bbox (area={area}), atlanıyor: {x1},{y1},{x2},{y2}")
                continue

            if x2 <= x1 or y2 <= y1:
                print(f"[WARNING] Geçersiz bbox: x1={x1}, y1={y1}, x2={x2}, y2={y2}")
                continue  # bu kutuyu atla

            crop = img_np[y1:y2, x1:x2]
            print(f"[DEBUG] crop.shape: {crop.shape}")

            if crop.size == 0:
                print(f"[WARNING] Boş crop döndü: {x1}-{x2}, {y1}-{y2}")
                continue

            pil_img = Image.fromarray(crop)

            # Debug crop'u kaydet
            debug_crop_path = f"crop_debug_{i}_{original_filename}"
            pil_img.save(debug_crop_path)
            print(f"[DEBUG] Crop kaydedildi: {debug_crop_path}")

            tensor = transform(pil_img).unsqueeze(0)

            category = class_names[int(cls)]
            print(f"🔍 Kategori: {category}, Sınıf: {int(cls)}, Tensor shape: {tensor.shape}")
            result = analyze_image_from_url(tensor=tensor, category=category)

            print("✅ Analiz sonucu:", result)

            if result.get("error"):
                print("❌ Hatalı analiz:", result["error"])
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
            print(f"📦 Taşındı: {new_blob_path}")

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
                print("💾 Veritabanına kaydedildi.")
            else:
                print("🔁 Zaten analiz edilmiş, tekrar kaydedilmedi.")

            result["photo_day"] = photo_day
            uploaded_results.append(result)

        except Exception as e:
            print("❌ Hata:", str(e))
            import traceback
            traceback.print_exc()
            error_result = {"error": str(e), "photo_day": photo_day}
            uploaded_results.append(error_result)

    return uploaded_results
