from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EcheancierPaiementViewSet

router = DefaultRouter()
router.register(r'', EcheancierPaiementViewSet, basename='echeanciers')

urlpatterns = [
    path('', include(router.urls)),
]
