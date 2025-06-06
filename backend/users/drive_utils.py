from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Google Drive Kimlik Doğrulama
gauth = GoogleAuth()
gauth.LoadClientConfigFile(os.path.join(BASE_DIR, "config", "client_secrets.json"))  # JSON dosyasını yüklüyoruz

def authenticate_drive():
    gauth = GoogleAuth()
    gauth.CommandLineAuth()  # veya sunucuya uygunsa başka yöntem
    return GoogleDrive(gauth)


def upload_to_drive(file_path, folder_id=None):
    """ Google Drive'a dosya yükleme fonksiyonu """
    drive = authenticate_drive()
    file_name = os.path.basename(file_path)
    gfile = drive.CreateFile({'title': file_name, 'parents': [{'id': folder_id}] if folder_id else []})
    gfile.SetContentFile(file_path)
    gfile.Upload()
    return gfile['id']

def download_from_drive(file_id, save_path):
    """ Google Drive'dan dosya indirme fonksiyonu """
    drive = authenticate_drive()
    gfile = drive.CreateFile({'id': file_id})
    gfile.GetContentFile(save_path)