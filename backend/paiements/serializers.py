from rest_framework import serializers
from .models import Paiement, EcheancierPaiement
from etudiants.models import Etudiant
from facultes.models import Faculte

# -------------------------------
# Paiement Individuel
# -------------------------------
class PaiementIndividuelSerializer(serializers.ModelSerializer):
    nombre_echeances = serializers.IntegerField(write_only=True)
    paiement_equipement = serializers.FloatField(write_only=True, required=False, allow_null=True)
    etudiant = serializers.PrimaryKeyRelatedField(queryset=Etudiant.objects.all())

    class Meta:
        model = Paiement
        fields = [
            'id',
            'etudiant',
            'nombre_echeances',
            'paiement_equipement',  # optionnel
            'montant',
            'montant_restant',
            'status',
            'date_paiement',
            'notes',
        ]
        read_only_fields = ['status', 'montant', 'montant_restant']

    def create(self, validated_data):
        nombre_echeances = validated_data.pop('nombre_echeances')
        paiement_equipement = validated_data.pop('paiement_equipement', 0) or 0
        etudiant = validated_data.get('etudiant')
        bourse = float(etudiant.bourse or 0)

        # 🔹 Calcul EXISTANT (on ne touche pas)
        montant_total = bourse * int(nombre_echeances)
        if paiement_equipement:
            montant_total += float(paiement_equipement)

        # 🔹 NOUVEAU : récupérer le dernier paiement
        dernier_paiement = Paiement.objects.filter(
            etudiant=etudiant
        ).order_by('-date_paiement').first()

        # 🔹 NOUVEAU : déterminer le montant de départ
        if dernier_paiement and dernier_paiement.montant_restant is not None:
            montant_depart = float(dernier_paiement.montant_restant)
        else:
            # Premier paiement → montant annuel
            montant_depart = (bourse * 9) + float(paiement_equipement or 0)

        # 🔹 NOUVEAU : calcul du montant restant
        montant_restant = montant_depart - montant_total

        # 🔹 Sécurité minimale
        if montant_restant < 0:
            raise serializers.ValidationError(
                "Le montant payé dépasse le montant restant."
            )

        # 🔹 Création du paiement (inchangé sauf montant_restant)
        paiement = Paiement.objects.create(
            etudiant=etudiant,
            montant=montant_total,
            montant_restant=montant_restant,
            status="EN_ATTENTE",
            date_paiement=validated_data.get('date_paiement'),
            notes=validated_data.get('notes', "EN_ATTENTE")
        )

        # 🔹 Création de l'échéancier (INCHANGÉE)
        EcheancierPaiement.objects.create(
            etudiant=etudiant,
            nombre_echeances=nombre_echeances,
            montant_par_echeance= bourse
            if nombre_echeances > 0 else 0
        )

        return paiement


# -------------------------------
# Paiement Collectif
# -------------------------------
class PaiementCollectifSerializer(serializers.Serializer):
    faculte = serializers.IntegerField()
    niveau = serializers.CharField()
    nombre_echeances = serializers.IntegerField()
    paiement_equipement = serializers.FloatField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    date_paiement = serializers.DateField(required=True)

    def create(self, validated_data):
        faculte_id = validated_data.get('faculte')
        niveau = validated_data.get('niveau')
        nombre_echeances = validated_data.get('nombre_echeances')
        paiement_equipement = validated_data.get('paiement_equipement', 0) or 0
        notes = validated_data.get('notes', "EN_ATTENTE")
        date_paiement = validated_data.get('date_paiement')

        etudiants = Etudiant.objects.filter(
            faculte=faculte_id,
            niveau=niveau
        )

        paiements = []

        for etudiant in etudiants:
            bourse = float(etudiant.bourse or 0)

            # 🔹 Calcul EXISTANT (on ne touche pas)
            montant_total = bourse * int(nombre_echeances)
            if paiement_equipement:
                montant_total += float(paiement_equipement)

            # 🔹 NOUVEAU : dernier paiement
            dernier_paiement = Paiement.objects.filter(
                etudiant=etudiant
            ).order_by('-date_paiement').first()

            # 🔹 NOUVEAU : montant de départ
            if dernier_paiement and dernier_paiement.montant_restant is not None:
                montant_depart = float(dernier_paiement.montant_restant)
            else:
                montant_depart = (bourse * 9) + float(paiement_equipement or 0)

            # 🔹 NOUVEAU : montant restant
            montant_restant = montant_depart - montant_total

            if montant_restant < 0:
                # On saute cet étudiant sans bloquer tout le batch
                continue

            paiement = Paiement.objects.create(
                etudiant=etudiant,
                montant=montant_total,
                montant_restant=montant_restant,
                status="EN_ATTENTE",
                date_paiement=date_paiement,
                notes=notes
            )

            # 🔹 Création échéancier (inchangée)
            EcheancierPaiement.objects.create(
                etudiant=etudiant,
                nombre_echeances=nombre_echeances,
                montant_par_echeance=bourse
                if nombre_echeances > 0 else 0
            )

            paiements.append(paiement)

        return paiements


# -------------------------------
# Serializer Échéancier
# -------------------------------
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


class PaiementListSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.nom', read_only=True)
    etudiant_prenom = serializers.CharField(source='etudiant.prenom', read_only=True)
    bourse = serializers.FloatField(source='etudiant.bourse', read_only=True)
    niveau = serializers.CharField(source='etudiant.niveau', read_only=True)

    nombre_echeances = serializers.SerializerMethodField()
    montant_par_echeance = serializers.SerializerMethodField()
    montant_bourse_total = serializers.SerializerMethodField()
    montant_equipement = serializers.SerializerMethodField()
    montant_restant_calcule = serializers.FloatField(source='montant_restant', read_only=True)

    class Meta:
        model = Paiement
        fields = [
            'id',
            'etudiant',
            'etudiant_nom',
            'etudiant_prenom',
            'niveau',
            'bourse',
            'nombre_echeances',
            'montant_par_echeance',
            'montant',
            'montant_bourse_total',
            'montant_equipement',
            'montant_restant_calcule',
            'status',
            'date_paiement',
            'notes',
        ]

    def get_nombre_echeances(self, obj):
        """
        On récupère le nombre d’échéances correspondant à CE paiement.
        """
        echeancier = EcheancierPaiement.objects.filter(etudiant=obj.etudiant).first()
        if echeancier:
            return echeancier.nombre_echeances
        return 0

    def get_montant_par_echeance(self, obj):
        """
        Montant par échéance pour CE paiement.
        """
        echeancier = EcheancierPaiement.objects.filter(etudiant=obj.etudiant).first()
        if echeancier and echeancier.nombre_echeances > 0:
            return float(obj.montant or 0) / float(echeancier.nombre_echeances)
        return 0

    def get_montant_bourse_total(self, obj):
        """
        Montant total de la bourse pour CE paiement = bourse * nombre d’échéances du paiement.
        """
        bourse = float(obj.etudiant.bourse or 0)
        nombre_echeances = self.get_nombre_echeances(obj)
        return bourse * nombre_echeances

    def get_montant_equipement(self, obj):
        """
        Détermine le montant de l’équipement pour CE paiement :
        Si montant_total == bourse * nombre d’échéances → pas d’équipement
        Sinon → équipement = montant_total - (bourse * nombre d’échéances)
        """
        bourse = float(obj.etudiant.bourse or 0)
        nombre_echeances = self.get_nombre_echeances(obj)
        montant_total = float(obj.montant or 0)

        montant_bourse = bourse * nombre_echeances

        if montant_total > montant_bourse:
            return 66000
        return 0



class ExportPdfSerializer(serializers.Serializer):
    faculte = serializers.IntegerField(required=False)
    niveau = serializers.CharField(required=False, max_length=5)
