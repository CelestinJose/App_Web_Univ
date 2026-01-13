from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementIndividuelViewSet

router = DefaultRouter()
router.register(r'', PaiementIndividuelViewSet, basename='paiement-individuel')

urlpatterns = [
    path('', include(router.urls)),
    ]