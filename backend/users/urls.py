from django.urls import path


from django.views.decorators.csrf import csrf_exempt


from .views import (
    LoginView, RegisterView,
    UploadPhotoView, PhotoListView,
    AnalyzeFoodView,
  ListAnalysisResultsView,
    DashboardSummaryView,DeleteAnalysisResultsView


)

urlpatterns = [
  
    path('login/', csrf_exempt(LoginView.as_view()), name='login'),
    path('register/', csrf_exempt(RegisterView.as_view()), name='register'),
    path('upload/', csrf_exempt (UploadPhotoView.as_view()), name='upload'),
    path("photos/",  csrf_exempt (PhotoListView.as_view()), name="photo-list"),
    path('analysis/', AnalyzeFoodView.as_view(), name='analyze'),
    path('analysis-results/', ListAnalysisResultsView.as_view()),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('delete-analysis-results/', csrf_exempt(DeleteAnalysisResultsView.as_view()), name='delete-analysis-results'),
]


