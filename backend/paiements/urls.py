# # backend/paiements/urls.py
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import PaiementViewSet
# router = DefaultRouter()
# router.register(r'', PaiementViewSet, basename='paiements')
# # router.register(r'echeanciers', EcheancierPaiementViewSet, basename='echeanciers')
# # router.register(r'versements', VersementEcheanceViewSet, basename='versements')

# urlpatterns = [
#     path('', include(router.urls)),
# ]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementIndividuelViewSet,EcheanceViewSet

router = DefaultRouter()
router.register(r'', PaiementIndividuelViewSet, basename='paiement-individuel')
router.register(r'', EcheanceViewSet, basename='Echeance')

urlpatterns = [
    path('', include(router.urls)),
]