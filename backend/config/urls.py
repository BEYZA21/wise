from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect

def redirect_to_frontend(request):
    return HttpResponseRedirect("http://localhost:5173/")  # veya sitenin gerçek adresi

urlpatterns = [
    path('', redirect_to_frontend),  # Boş path'e gelen istek React frontend'e yönlenir
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
]
