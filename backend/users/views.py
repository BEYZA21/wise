import os
import uuid
import csv
from datetime import date, timedelta
import chardet
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.generics import ListAPIView

from google.cloud import storage
from dotenv import load_dotenv


from .models import AnalysisResult, WeeklyMenu, DailyMenu
from .serializers import (
    AnalysisResultSerializer,
    WeeklyMenuSerializer,
    DailyMenuSerializer,
)

load_dotenv()
User = get_user_model()

# ========== LOGIN ==========
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            return Response({
                "token": "dummy_token",
                "user": {"username": user.username}
            }, status=200)
        return Response({"error": "Geçersiz kullanıcı adı veya şifre."}, status=401)

# ========== REGISTER ==========
@method_decorator(csrf_exempt, name='dispatch')
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
import datetime

# Türkçe günler
DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"]
gun = DAYS_TR[datetime.datetime.now().weekday()]

# ========== FOTOĞRAF YÜKLEME ==========
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import traceback

class UploadPhotoView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request):
        files = request.FILES.getlist('photos')
        if not files:
            return Response({'error': 'Fotoğraf bulunamadı.'}, status=400)

        
        uploaded_urls = []
        # Google Cloud Storage bağlantısı
        try:
            creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            client = storage.Client.from_service_account_json(creds_path)
            bucket = client.bucket('wise-uploads')
        except Exception as e:
            return Response({'error': f'GCS bağlantı hatası: {str(e)}'}, status=500)
        # UploadPhotoView
        for file in files:
            try:
                blob_name = f'uploads/{uuid.uuid4()}_{file.name}'
                blob = bucket.blob(blob_name)
                blob.upload_from_file(file, content_type=file.content_type)
                url = f"https://storage.googleapis.com/wise-uploads/{blob_name}"
                uploaded_urls.append(url)
                # AnalysisResult.objects.create(...)  <--- BURAYI SİL
            except Exception as e:
                print("[UPLOAD HATASI]:", e)
                traceback.print_exc()
                return Response({"error": str(e)}, status=500)
        return Response({'message': 'Yükleme başarılı!', 'uploaded_urls': uploaded_urls}, status=200)

# ========== ANALİZ ==========
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from yolo_models.cropper import crop_and_save
from yolo_models.image_loader import load_image_from_url
from .models import AnalysisResult  # Modelini buraya ekle

class AnalyzeFoodView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        image_url = request.data.get("image_url")
        photo_day = request.data.get("photo_day")

        if not image_url:
            return Response({"error": "image_url alanı zorunludur."}, status=400)
        if not photo_day:
            return Response({"error": "photo_day alanı zorunludur."}, status=400)

        img0 = load_image_from_url(image_url)
        if img0 is None:
            return Response({"error": "Görsel indirilemedi."}, status=400)

        original_filename = image_url.split("/")[-1]
        
        try:
            # crop_and_save her zaman liste döndürsün!
            results = crop_and_save(
                img0,
                original_filename=original_filename,
                photo_day=photo_day
            )
        except Exception as e:
            return Response({"error": f"crop_and_save hatası: {str(e)}"}, status=500)
        
        if not results or len(results) == 0:
            return Response({"error": "Hiçbir yemek tespit edilemedi."}, status=200)

        analysis_results = []
        for result in results:
            try:
                food_category = result.get("food_category", "")
                food_type = result.get("food_type", "")
                is_waste = result.get("is_waste", False)
                cropped_image_url = result.get("image_url", image_url)
                obj, created = AnalysisResult.objects.update_or_create(
                    image_url=cropped_image_url,
                    defaults={
                        "food_category": food_category,
                        "food_type": food_type,
                        "is_waste": is_waste,
                        "photo_day": photo_day
                    }
                )
                analysis_results.append(result)
            except Exception as e:
                # Bu crop sonucu kayıt hatasını da response'a ekle
                result["db_error"] = str(e)
                analysis_results.append(result)

        return Response({
            "message": "Analiz tamamlandı",
            "results": analysis_results
        }, status=200)

# ========== ANALİZ SONUÇ LİSTESİ ==========
class ListAnalysisResultsView(ListAPIView):
    serializer_class = AnalysisResultSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = AnalysisResult.objects.all().order_by('-created_at')
        photo_day = self.request.query_params.get('photo_day')
        if photo_day:
            queryset = queryset.filter(photo_day=photo_day)
        return queryset

# ========== DASHBOARD GENEL ÖZET ==========
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


class PhotoListView(APIView):
    def get(self, request):
        bucket_name = "wise-uploads"
        prefix = "uploads/"
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blobs = bucket.list_blobs(prefix=prefix)
        image_urls = [
            {"id": blob.name, "url": f"https://storage.googleapis.com/{bucket_name}/{blob.name}"}
            for blob in blobs
        ]
        return Response(image_urls)