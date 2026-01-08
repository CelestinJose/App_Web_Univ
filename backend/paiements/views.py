# views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Paiement
from .serializers import PaiementIndividuelSerializer, PaiementCollectifSerializer

# ⚡ Paiement individuel
class PaiementIndividuelViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementIndividuelSerializer

    # Surcharge de la méthode create pour renvoyer JSON valide
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paiement = serializer.save()
        return Response({
            "message": "Paiement individuel créé !",
            "paiement_id": paiement.id
        }, status=status.HTTP_201_CREATED)

# ⚡ Paiement collectif
class PaiementCollectifViewSet(viewsets.GenericViewSet):
    serializer_class = PaiementCollectifSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paiements = serializer.save()
        return Response({
            "message": f"{len(paiements)} paiements créés pour la faculté."
        }, status=status.HTTP_201_CREATED)
