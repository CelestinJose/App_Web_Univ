from rest_framework import serializers
from .models import Paiement, EcheancierPaiement, VersementEcheance

class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = '__all__'
        read_only_fields = ['date_paiement', 'date_confirmation']


class EcheancierPaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcheancierPaiement
        fields = '__all__'
        read_only_fields = ['created_at']


class VersementEcheanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VersementEcheance
        fields = '__all__'
