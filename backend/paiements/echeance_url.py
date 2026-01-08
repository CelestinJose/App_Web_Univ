from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EcheanceViewSet

router = DefaultRouter()
router.register(r'', EcheanceViewSet, basename='Echeance')

urlpatterns = [
    path('', include(router.urls)),
]