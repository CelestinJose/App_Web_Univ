from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementIndividuelViewSet

router = DefaultRouter()
router.register(r'', PaiementIndividuelViewSet, basename='paiement_url')

urlpatterns = [
    path('', include(router.urls)),
]