from rest_framework import serializers
from .models import Paiement, EcheancierPaiement
from etudiants.models import Etudiant
from facultes.models import Faculte

class PaiementIndividuelSerializer(serializers.ModelSerializer):
    # Nombre d'échéances envoyé depuis le frontend
    
    nombre_echeances = serializers.IntegerField(write_only=True)
    etudiant = serializers.PrimaryKeyRelatedField(queryset=Etudiant.objects.all())

    class Meta:
        model = Paiement
        fields = [
            'id',
            'etudiant',           # ID envoyé par le frontend
            'nombre_echeances',   # envoyé par le frontend
            'montant',
            'montant_restant',
            'status',
            'date_paiement',
            'notes',
            
        ]
        read_only_fields = ['status', 'montant', 'montant_restant']

    def create(self, validated_data):

        nombre_echeances = validated_data.pop('nombre_echeances')
        etudiant = validated_data.get('etudiant') 
        bourse = etudiant.bourse
        montant_total = bourse * int(nombre_echeances)

        # 🔹 Création du paiement
        paiement = Paiement.objects.create(
            montant=montant_total,
            montant_restant=montant_total,  # tout reste à payer initialement
            status="EN_ATTENTE",            # par défaut
            date_paiement=validated_data.get('date_paiement'),
            notes="EN_ATTENTE",
            etudiant_id=etudiant.id
        )
        # 🔹 Création de l'échéancier
        EcheancierPaiement.objects.create(
        etudiant=etudiant,  # passe l'objet étudiant
        nombre_echeances=nombre_echeances,
        montant_par_echeance=montant_total / int(nombre_echeances) if nombre_echeances > 0 else 0
     )

        return paiement


class PaiementCollectifSerializer(serializers.Serializer):
    faculte = serializers.IntegerField()  # ID de la faculté
    niveau = serializers.CharField()
    nombre_echeances = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(default="EN_ATTENTE")

    def create(self, validated_data):
        faculte_id = validated_data.get('faculte')
        niveau = validated_data.get('niveau')
        nombre_echeances = validated_data.get('nombre_echeances')

        # 🔹 Récupérer l'objet Faculté
        etudiants = Etudiant.objects.filter(faculte=faculte_id, niveau=niveau)
        print(f"Étudiants trouvés : {etudiants}")

        paiements = []

        for etudiant in etudiants:
            bourse = float(etudiant.bourse or 0)
            montant_total = bourse * int(nombre_echeances)

            # 🔹 Création du paiement
            paiement = Paiement.objects.create(
                etudiant=etudiant,
                montant=montant_total,
                montant_restant=montant_total,
                status="EN_ATTENTE", 
                date_paiement=validated_data.get('date_paiement'),
                notes="EN_ATTENTE",
                etudiant_id=etudiant.id
            )

            # 🔹 Création de l’échéancier
            EcheancierPaiement.objects.create(
                etudiant=etudiant,
                nombre_echeances=nombre_echeances,
                montant_par_echeance=montant_total / nombre_echeances if nombre_echeances > 0 else 0
            )

            paiements.append(paiement)

        return paiements


class EcheanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcheancierPaiement
        fields = [
            'id',
            'etudiant',
            'nombre_echeances',
            'montant_par_echeance',
            'created_at',
        ]