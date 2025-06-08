from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect
from django.http import JsonResponse, HttpResponseRedirect


def root_health(request):
    return JsonResponse({"status": "ok"})

# def root_or_redirect(request):
#     # Health check (Render veya başka botlardan gelenlere 200 OK dön)
#     user_agent = request.META.get('HTTP_USER_AGENT', '')
#     if 'render' in user_agent.lower() or 'uptime' in user_agent.lower():
#         return JsonResponse({"status": "ok"})
#     # Tarayıcıdan gelenlere redirect (isteğe bağlı)
#     return HttpResponseRedirect('https://wise-pr89.onrender.com')

urlpatterns = [
    path("", root_health),  # 👈 Railway GET / isteğine bu cevap verir

    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
]

