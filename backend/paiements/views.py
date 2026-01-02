from rest_framework import viewsets,permissions
from .models import Paiement, EcheancierPaiement, VersementEcheance
from .serializers import (
    PaiementSerializer,
    EcheancierPaiementSerializer,
    VersementEcheanceSerializer,
)

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer


class EcheancierPaiementViewSet(viewsets.ModelViewSet):
    queryset = EcheancierPaiement.objects.all()
    serializer_class = EcheancierPaiementSerializer


class VersementEcheanceViewSet(viewsets.ModelViewSet):
    queryset = VersementEcheance.objects.all()
    serializer_class = VersementEcheanceSerializer
