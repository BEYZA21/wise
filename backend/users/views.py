import os
import json
import uuid
import base64
import datetime
from datetime import date, timedelta

from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from dotenv import load_dotenv

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.generics import ListAPIView
from rest_framework.decorators import parser_classes

from google.cloud import storage
from google.oauth2 import service_account

from .models import AnalysisResult
from .serializers import AnalysisResultSerializer
from yolo_models.cropper import crop_and_save
from yolo_models.image_loader import load_image_from_url

load_dotenv()
User = get_user_model()

# === Ortak Ayarlar ===
BUCKET_NAME = "wise-uploads"
DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
gun = DAYS_TR[datetime.datetime.now().weekday()]

# === GCS Bağlantısı ===
try:
    base64_creds = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    creds_json = json.loads(base64.b64decode(base64_creds).decode("utf-8"))
    credentials = service_account.Credentials.from_service_account_info(creds_json)
    gcs_client = storage.Client(credentials=credentials)
    bucket = gcs_client.bucket(BUCKET_NAME)
except Exception as e:
    print("🚨 GCS bağlantı hatası:", str(e))
    bucket = None

# ========== LOGIN ==========
@method_decorator(csrf_exempt, name='dispatch')
@parser_classes([JSONParser])
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            return Response({"token": "dummy_token", "user": {"username": user.username}}, status=200)
        return Response({"error": "Geçersiz kullanıcı adı veya şifre."}, status=401)

# ========== REGISTER ==========
@method_decorator(csrf_exempt, name='dispatch')
@parser_classes([JSONParser])
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        full_name = request.data.get("fullName", "")
        if User.objects.filter(username=username).exists():
            return Response({"error": "Bu kullanıcı adı zaten kullanılıyor."}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Bu e-posta zaten kayıtlı."}, status=400)
        user = User.objects.create_user(username=username, email=email, password=password)
        user.first_name = full_name
        user.save()
        return Response({"message": "Kayıt başarılı!", "username": username}, status=201)

# ========== FOTOĞRAF YÜKLEME ==========
class UploadPhotoView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        files = request.FILES.getlist('photos')
        if not files:
            return Response({'error': 'Fotoğraf bulunamadı.'}, status=400)

        uploaded_urls = []

        for file in files:
            try:
                blob_name = f"uploads/{uuid.uuid4()}_{file.name}"
                blob = bucket.blob(blob_name)
                blob.upload_from_file(file, content_type=file.content_type)
                url = f"https://storage.googleapis.com/{BUCKET_NAME}/{blob_name}"
                uploaded_urls.append(url)
            except Exception as e:
                return Response({"error": f"Dosya yüklenemedi: {str(e)}"}, status=500)

        return Response({'message': 'Ükleme başarılı!', 'uploaded_urls': uploaded_urls}, status=200)

# ========== ANALİZ ==========
@parser_classes([JSONParser])
class AnalyzeFoodView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        image_url = request.data.get("image_url")
        photo_day = request.data.get("photo_day")

        if not image_url or not photo_day:
            return Response({"error": "image_url ve photo_day alanları zorunludur."}, status=400)

        try:
            print("🔗 Görsel indiriliyor:", image_url)
            img0 = load_image_from_url(image_url)
            if img0 is None:
                return Response({"error": "Görsel indirilemedi."}, status=400)

            original_filename = image_url.split("/")[-1]
            print("✂️ Görsel kırpılıyor ve analiz ediliyor...")
            results = crop_and_save(img0, original_filename=original_filename, photo_day=photo_day)

            if not results:
                return Response({"error": "Hiçbir yemek tespit edilemedi."}, status=200)

            analysis_results = []
            for result in results:
                try:
                    obj, created = AnalysisResult.objects.update_or_create(
                        image_url=result.get("image_url", image_url),
                        defaults={
                            "food_category": result.get("food_category", ""),
                            "food_type": result.get("food_type", ""),
                            "is_waste": result.get("is_waste", False),
                            "photo_day": photo_day
                        }
                    )
                    analysis_results.append(result)
                except Exception as db_err:
                    print("💥 DB Hatası:", db_err)
                    result["db_error"] = str(db_err)
                    analysis_results.append(result)

            return Response({"message": "Analiz tamamlandı", "results": analysis_results}, status=200)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Sunucu hatası: {str(e)}"}, status=500)

# ========== ANALİZ SONUÇLARI ==========
@parser_classes([JSONParser])
class ListAnalysisResultsView(ListAPIView):
    serializer_class = AnalysisResultSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = AnalysisResult.objects.all().order_by('-created_at')
        photo_day = self.request.query_params.get('photo_day')
        if photo_day:
            queryset = queryset.filter(photo_day=photo_day)
        return queryset

@parser_classes([JSONParser])
class DashboardSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = AnalysisResult.objects.all()
        total = qs.count()
        waste = qs.filter(is_waste=True).count()
        no_waste = qs.filter(is_waste=False).count()
        percent = round((waste / total) * 100, 1) if total else 0
        return Response({
            "total": total,
            "waste": waste,
            "noWaste": no_waste,
            "percent": percent
        })

@parser_classes([JSONParser])
class PhotoListView(APIView):
    def get(self, request):
        prefix = "uploads/"
        blobs = bucket.list_blobs(prefix=prefix)
        image_urls = [
            {"id": blob.name, "url": f"https://storage.googleapis.com/{BUCKET_NAME}/{blob.name}"}
            for blob in blobs
        ]
        return Response(image_urls)

# ========== ANALİZ SONUÇLARINI TEMİZLEME ==========
@parser_classes([JSONParser])
class DeleteAnalysisResultsView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request):
        AnalysisResult.objects.all().delete()
        return Response({"message": "Tüm analiz sonuçları silindi."}, status=200)
