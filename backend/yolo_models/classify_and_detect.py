import os
import sys
import uuid
import pathlib
import requests
import base64
import json
from pathlib import Path
from datetime import datetime
from google.cloud import storage
from google.oauth2 import service_account

# Windows için Path desteği
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

MODEL_BASE_PATH = Path("yolov5/weights")
BUCKET_NAME = "wise-uploads"
GCS_PREFIX = "processed"

# GCS Credentials
base64_creds = os.getenv("GOOGLE_SERVICE_ACCOUNT_BASE64")
if base64_creds:
    creds_json = json.loads(base64.b64decode(base64_creds).decode('utf-8'))
    credentials = service_account.Credentials.from_service_account_info(creds_json)
    gcs_client = storage.Client(credentials=credentials, project=credentials.project_id)
else:
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    gcs_client = storage.Client.from_service_account_json(creds_path)

bucket = gcs_client.bucket(BUCKET_NAME)

loaded_models = {}

def load_model(model_filename):
    import torch
    model_path = MODEL_BASE_PATH / model_filename
    if model_filename not in loaded_models:
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=str(model_path), force_reload=False)
        model.eval()
        loaded_models[model_filename] = model
    return loaded_models[model_filename]

# Yemek türleri ve modeller
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
    "ana-yemek": "wiseMainCls-yolo5.pt",
    "corba": "wiseSoup.pt",
    "ek-yemek": "wiseExtraCls-yolo5.pt",
    "yan-yemek": "wiseSideCls-yolo5.pt"
}

def get_transform():
    import torchvision.transforms as transforms
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.CenterCrop((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def analyze_image_from_url(image_url_or_path=None, category=None, tensor=None):
    try:
        if category not in TYPE_MODELS or category not in WASTE_MODELS:
            return {"error": f"Geçersiz kategori: {category}"}
        import torch
        import torchvision.transforms as transforms
        from PIL import Image
        from io import BytesIO
        import numpy as np

        transform = get_transform()

        if tensor is None:
            # URL ya da path üzerinden yükle
            if os.path.isfile(image_url_or_path):
                image = Image.open(image_url_or_path).convert("RGB")
            else:
                response = requests.get(image_url_or_path)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).convert("RGB")
            tensor = transform(image).unsqueeze(0)

        # Model yükle
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
        print(f"🍲 Type index: {type_idx}, confidence: {type_conf}")
        print(f"🗑️ Waste index: {waste_idx}, confidence: {waste_conf}")

        return {
            "kategori": category,
            "tur": type_name,
            "tur_confidence": type_conf,
            "israf": israf,
            "israf_confidence": waste_conf,
            "veritabanı_kayıt": True
        }

    except Exception as e:
        return {"error": str(e)}

def analyze_directory(input_folder, category):
    """Bir klasördeki tüm görüntüleri analiz eder."""
    image_files = [
        os.path.join(input_folder, f)
        for f in os.listdir(input_folder)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]

    for image_path in image_files:
        try:
            result = analyze_image_from_url(image_path, category)
            print(f"\n{os.path.basename(image_path)} sonucu:")
            print(result)
        except Exception as e:
            print(f"Hata oluştu: {image_path}, Hata: {e}")
