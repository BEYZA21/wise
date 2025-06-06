# yolo_models/torch_patch.py

import pathlib
from pathlib import Path

def patch_posixpath_for_windows():
    """
    torch.load() sırasında oluşan PosixPath hatasını düzeltir.
    Bu patch, pathlib.PosixPath referansını Windows uyumlu Path sınıfına yönlendirir.
    """
    pathlib.PosixPath = Path
