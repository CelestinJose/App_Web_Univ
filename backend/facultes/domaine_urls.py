# facultes/domaine_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DomaineViewSet

router = DefaultRouter()
router.register(r'', DomaineViewSet, basename='domaine')

urlpatterns = [
    path('', include(router.urls)),
]