from django.db import models

# TEKİL ANALİZ KAYDI (her fotoğraf analizi için bir satır)
class AnalysisResult(models.Model):
    image_url = models.URLField(max_length=500, null=True, blank=True)
    food_category = models.CharField(max_length=50)   # ör: 'corba', 'ana-yemek', vs.
    food_type = models.CharField(max_length=100)      # ör: 'mercimek-corbasi', 'et-sote', vs.
    is_waste = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
    photo_day = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return f"{self.food_category} | {self.food_type} - {'israf-var' if self.is_waste else 'israf-yok'}"


# # HAFTALIK MENÜ BAŞLIĞI
# class WeeklyMenu(models.Model):
#     start_date = models.DateField()   # Haftanın başlangıç tarihi (örn: 2024-06-03)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"Hafta: {self.start_date}"


# # GÜNLÜK MENÜ (haftalık menüye bağlı)
# class DailyMenu(models.Model):
#     weekly_menu = models.ForeignKey(
#         WeeklyMenu,
#         on_delete=models.CASCADE,
#         related_name='daily_menus'
#     )
#     date = models.CharField(max_length=20)          # 'Pazartesi', 'Salı', vs.
#     soup = models.CharField(max_length=100)
#     main_dish = models.CharField(max_length=255)  
#     main_dish_2 = models.CharField(max_length=100, blank=True, null=True) # ör: 'Yemek1 / Yemek2'
#     side_dish = models.CharField(max_length=255)
#     side_dish_2 = models.CharField(max_length=100, blank=True, null=True) 
#     extra = models.CharField(max_length=255, blank=True, null=True)

#     def __str__(self):
#         return f"{self.date}: {self.main_dish}"


# GÜNLÜK ÖZET ANALİZ (istenirse, günlük toplam/istatistik için)
class DailyAnalysis(models.Model):
    

    waste_count = models.IntegerField(default=0)
    no_waste_count = models.IntegerField(default=0)
    total_analysis = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    # Ek alanlar eklenebilir (örn: notlar, ekstra istatistikler)

    def __str__(self):
        return f"{self.daily_menu.date} Analiz: {self.total_analysis} ({self.waste_count} israf, {self.no_waste_count} israf-yok)"
