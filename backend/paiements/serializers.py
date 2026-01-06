from rest_framework import serializers
from .models import Paiement, EcheancierPaiement
from etudiants.models import Etudiant

class PaiementIndividuelSerializer(serializers.ModelSerializer):
    echeancier = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Paiement
        fields = [
            'id',
            'etudiant',
            'montant',
            'montant_restant',
            'status',
            'date_paiement',
            'date_confirmation',
            'notes',
            'echeancier',
        ]
        read_only_fields = ['date_paiement', 'date_confirmation']

    def create(self, validated_data):
        echeancier_data = validated_data.pop('echeancier', None)
        paiement = Paiement.objects.create(**validated_data)

        if echeancier_data:
            EcheancierPaiement.objects.create(
                etudiant=paiement.etudiant,
                nombre_echeances=echeancier_data.get('nombre_echeances', 3),
                montant_par_echeance=echeancier_data.get('montant_par_echeance')
            )
        return paiement



class PaiementCollectifSerializer(serializers.Serializer):
    faculte = serializers.CharField()
    montant = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField(default="EN_ATTENTE")
    notes = serializers.CharField(required=False, allow_blank=True)
    echeancier = serializers.DictField(write_only=True, required=False)

    def create(self, validated_data):
        faculte = validated_data.get('faculte')
        echeancier_data = validated_data.pop('echeancier', None)

        etudiants = Etudiant.objects.filter(faculte=faculte)
        paiements = []

        for etudiant in etudiants:
            paiement = Paiement.objects.create(etudiant=etudiant, **validated_data)
            paiements.append(paiement)

            if echeancier_data:
                EcheancierPaiement.objects.create(
                    etudiant=etudiant,
                    nombre_echeances=echeancier_data.get('nombre_echeances', 3),
                    montant_par_echeance=echeancier_data.get('montant_par_echeance')
                )

        return paiements
