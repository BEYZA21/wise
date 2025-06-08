from rest_framework import serializers
from .models import AnalysisResult, DailyAnalysis

class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = '__all__'

class DailyAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyAnalysis
        fields = '__all__'

# class DailyMenuSerializer(serializers.ModelSerializer):
#     # DailyMenu’ya bağlı özet analizleri (DailyAnalysis) ekrana dökmek istersen:
#     analyses = DailyAnalysisSerializer(many=True, read_only=True)
#     class Meta:
#         model = DailyMenu
#         fields = '__all__'
#         # istersen: fields = ['id', 'weekly_menu', 'date', 'soup', ... , 'analyses']

# class WeeklyMenuSerializer(serializers.ModelSerializer):
#     # Haftalık menüde günlerin detayını görmek istersen:
#     daily_menus = DailyMenuSerializer(many=True, read_only=True)
#     class Meta:
#         model = WeeklyMenu
#         fields = '__all__'
#         # veya sadece ['id', 'start_date', 'created_at', 'daily_menus']
