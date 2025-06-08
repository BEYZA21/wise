# utils/image_loader.py
from PIL import Image
import requests
from io import BytesIO
import sys
from pathlib import Path

# Ana dizini bul ve yol ekle (utils için)
FILE = Path(__file__).resolve()
ROOT = FILE.parents[2]
sys.path.append(str(ROOT))

def load_image_from_url(image_url):
    response = requests.get(image_url)
    response.raise_for_status()
    img = Image.open(BytesIO(response.content)).convert("RGB")
    return img
