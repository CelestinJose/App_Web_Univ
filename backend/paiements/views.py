from rest_framework import viewsets
from .models import Paiement
from .serializers import PaiementIndividuelSerializer, PaiementCollectifSerializer

class PaiementIndividuelSerializer(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementIndividuelSerializer


class PaiementCollectifViewSet(viewsets.GenericViewSet):
    serializer_class = PaiementCollectifSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paiements = serializer.save()
        return Response({"message": f"{len(paiements)} paiements créés pour la faculté."})