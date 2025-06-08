import os
import sys
import json
import base64
import pathlib
import requests
from pathlib import Path
from io import BytesIO
from PIL import Image
import torch
from google.cloud import storage
from google.oauth2 import service_account

# Windows uyumu
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

# GCS Ayarları
BUCKET_NAME = "wise-uploads"
GCS_PREFIX = "processed"

# GCS Bağlantısı
try:
    base64_creds = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    creds_json = json.loads(base64.b64decode(base64_creds).decode("utf-8"))
    credentials = service_account.Credentials.from_service_account_info(creds_json)
    gcs_client = storage.Client(credentials=credentials)
    bucket = gcs_client.bucket(BUCKET_NAME)
except Exception as e:
    print("🚨 GCS bağlantı hatası:", str(e))
    bucket = None

# Model ID listesi
MODEL_DRIVE_IDS = {
    "wisePlate.pt": "1Tjp3Ga2b2IIMuiKSjMbWV_8o2PASQzwW",
    "wiseTypeSoup.pt": "1sbHqVBvtlFhYksyCV6YA7QK_DinlXnQR",
    "wiseSoup.pt": "1BJjsNDfe5pqn1Btd-CVs03RaU8GGAfqu",
    "wiseMainTypeCls-yolo5.pt": "181OutK-60HKy0WT-mDOvZOKkjjrM9sjK",
    "wiseSideTypeCls-yolo5.pt": "1QFNkEMPoCB0ZEF5wq2sp5v1G1fmoNXnZ",
    "wiseSideCls-yolo5.pt": "1uWRaVV46g-OdTFHLBExboWamBybzD-YL",
    "wiseExtraTypeCls-yolo5.pt": "1gEuh7AEqqk5gMvEsdftnwhu4tXDfKxSS",
    "wiseExtraCls-yolo5-yolo5.pt": "1TfzrpbpdM5XM210Jzuk-q96UTgngMrd4",
    "wiseMainCls-yolo5-yolo5.pt": "1vXG5fjcJhaAwsFMp-xE0udCu_UQZhC4h"
}

MODEL_BASE_PATH = Path("tmp_models")
loaded_models = {}

# === Model indirme ===
def download_from_gdrive(model_filename):
    if model_filename not in MODEL_DRIVE_IDS:
        raise ValueError(f"Model ID bulunamadı: {model_filename}")

    dest_path = MODEL_BASE_PATH / model_filename
    if dest_path.exists():
        print(f"✅ Model zaten var: {dest_path}")
        return dest_path

    os.makedirs(MODEL_BASE_PATH, exist_ok=True)
    file_id = MODEL_DRIVE_IDS[model_filename]
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    print(f"📥 Model indiriliyor: {model_filename}")

    response = requests.get(url)
    response.raise_for_status()
    with open(dest_path, "wb") as f:
        f.write(response.content)

    print(f"✅ Model indirildi: {model_filename}")
    return dest_path

# === Model yükleme ===
def load_model(model_filename):
    if model_filename not in loaded_models:
        model_path = download_from_gdrive(model_filename)
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=str(model_path), force_reload=False)
        model.eval()
        loaded_models[model_filename] = model
    return loaded_models[model_filename]

# === Lazy transform ===
def get_transform():
    import torchvision.transforms as transforms  # Lazy import
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.CenterCrop((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

# === Kategori eşleştirmeleri ===
FOOD_TYPES = {
    'corba': {
        0: 'mercimek-corbasi',
        1: 'sehriye-corbasi',
        2: 'tarhana-corbasi',
        3: 'yayla-corbasi'
    },
    'ana-yemek': {
        0: 'barbunya',
        1: 'bezelye',
        2: 'et-sote',
        3: 'kabak',
        4: 'kasarli-köfte',
        5: 'kuru-fasulye',
        6: 'sebzeli-tavuk',
    },
    'yan-yemek': {
        0: 'bulgur',
        1: 'burgu-makarna',
        2: 'eriste',
        3: 'fettucini',
        4: 'pirinc-pilavi',
        5: 'spagetti',
    },
    'ek-yemek': {
        0: 'havuc-salatasi',
        1: 'mor-yogurt',
        2: 'yogurt'
    },
}

TYPE_MODELS = {
    "ana-yemek": "wiseMainTypeCls-yolo5.pt",
    "corba": "wiseTypeSoup.pt",
    "ek-yemek": "wiseExtraTypeCls-yolo5.pt",
    "yan-yemek": "wiseSideTypeCls-yolo5.pt"
}

WASTE_MODELS = {
    "ana-yemek": "wiseMainCls-yolo5-yolo5.pt",
    "corba": "wiseSoup.pt",
    "ek-yemek": "wiseExtraCls-yolo5-yolo5.pt",
    "yan-yemek": "wiseSideCls-yolo5.pt"
}

# === Ana analiz fonksiyonu ===
def analyze_image_from_url(image_url_or_path=None, category=None, tensor=None):
    try:
        if category not in TYPE_MODELS or category not in WASTE_MODELS:
            return {"error": f"Geçersiz kategori: {category}"}

        transform = get_transform()

        if tensor is None:
            if os.path.isfile(image_url_or_path):
                image = Image.open(image_url_or_path).convert("RGB")
            else:
                response = requests.get(image_url_or_path)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
            tensor = transform(image).unsqueeze(0)

        type_model = load_model(TYPE_MODELS[category])
        with torch.no_grad():
            type_out = type_model(tensor)

        probs = torch.nn.functional.softmax(type_out[0], dim=0)
        type_idx = probs.argmax().item()
        type_conf = round(probs[type_idx].item(), 4)
        type_name = FOOD_TYPES[category].get(type_idx, f"type_{type_idx}")

        waste_model = load_model(WASTE_MODELS[category])
        with torch.no_grad():
            waste_out = waste_model(tensor)

        waste_probs = torch.nn.functional.softmax(waste_out[0], dim=0)
        waste_idx = waste_probs.argmax().item()
        waste_conf = round(waste_probs[waste_idx].item(), 4)
        israf = "israf-yok" if waste_idx == 1 else "israf-var"

        return {
            "kategori": category,
            "tur": type_name,
            "tur_confidence": type_conf,
            "israf": israf,
            "israf_confidence": waste_conf,
            "veritabanı_kayıt": True
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# === İsteğe bağlı klasör analizi ===
def analyze_directory(input_folder, category):
    image_files = [
        os.path.join(input_folder, f)
        for f in os.listdir(input_folder)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]

    for image_path in image_files:
        try:
            result = analyze_image_from_url(image_path, category)
            print(f"\n📷 {os.path.basename(image_path)} sonucu:")
            print(result)
        except Exception as e:
            print(f"❌ Hata: {image_path}, {e}")
