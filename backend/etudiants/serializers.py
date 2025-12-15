from rest_framework import serializers
from .models import Etudiant
from bourses.models import Bourse
from datetime import date

class EtudiantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etudiant
        fields = [
            'id', 'matricule', 'numero_inscription', 'nom', 'prenom', 
            'date_naissance', 'lieu_naissance', 'telephone', 'email', 'cin', 'annee_bacc',
            'code_redoublement', 'faculte', 'domaine', 'mention', 'niveau',
            'nationalite', 'photo', 'bourse', 'boursier',
            'nom_pere', 'nom_mere',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'numero_inscription', 'bourse']
    
    def validate(self, data):
        """Validation des données"""
        required_fields = ['matricule', 'nom', 'prenom', 'niveau', 'code_redoublement', 'boursier']
        for field in required_fields:
            if field not in data or not data[field]:
                raise serializers.ValidationError({field: "Ce champ est obligatoire"})
        
        # MODIFIÉ: Ajout du code 'T' pour Triplant
        if data.get('code_redoublement') not in ['N', 'R', 'T']:
            raise serializers.ValidationError({
                'code_redoublement': "Doit être 'N' (Non redoublant), 'R' (Redoublant) ou 'T' (Triplant)"
            })
        
        if data.get('boursier') not in ['OUI', 'NON']:
            raise serializers.ValidationError({
                'boursier': "Doit être 'OUI' ou 'NON'"
            })
        
        return data
    
    def calculate_bourse(self, niveau, code_redoublement, boursier):
        """Calcule le montant de la bourse selon les règles"""
        montant = 0.0
        
        if boursier != 'OUI':
            return montant
        
        niveau_upper = niveau.upper()
        
        # MODIFIÉ: Triplant = pas de bourse (0 MGA)
        if code_redoublement == 'T':
            return 0.0
        
        # Master et Doctorat
        if any(x in niveau_upper for x in ["M2", "M1", "MASTER", "DOCTORAT", "DOT"]):
            if code_redoublement == 'N':
                montant = 48400.00
            elif code_redoublement == 'R':
                montant = 48400.00 / 2
        
        # Licence 3
        elif "LICENCE 3" in niveau_upper or "L3" in niveau_upper:
            if code_redoublement == 'N':
                montant = 36300.00
            elif code_redoublement == 'R':
                montant = 36300.00 / 2
        
        # Licence 2
        elif "LICENCE 2" in niveau_upper or "L2" in niveau_upper:
            if code_redoublement == 'N':
                montant = 30250.00
            elif code_redoublement == 'R':
                montant = 30250.00 / 2
        
        # Licence 1
        elif "LICENCE 1" in niveau_upper or "L1" in niveau_upper:
            if code_redoublement == 'N':
                montant = 24200.00
            elif code_redoublement == 'R':
                montant = 24200.00 / 2
        
        return montant
    
    def get_niveau_code(self, niveau):
        """Retourne le code de niveau pour le numéro d'inscription"""
        niveau_upper = niveau.upper()
        
        if any(x in niveau_upper for x in ["MASTER", "M1", "M2"]):
            return "M"
        elif any(x in niveau_upper for x in ["LICENCE", "L1", "L2", "L3"]):
            return "L"
        elif any(x in niveau_upper for x in ["DOCTORAT", "D1", "DOT"]):
            return "D"
        else:
            return "X"  # Code par défaut si non reconnu
    
    def generate_numero_inscription(self, niveau):
        """Génère un numéro d'inscription selon le format de l'Excel"""
        # Trouver le dernier numéro d'inscription
        dernier_etudiant = Etudiant.objects.filter(
            numero_inscription__startswith='6000'
        ).order_by('-numero_inscription').first()
        
        if dernier_etudiant and dernier_etudiant.numero_inscription:
            try:
                # Extraire la partie numérique (derniers 5 chiffres)
                dernier_num = int(dernier_etudiant.numero_inscription[-5:])
                nouveau_num = dernier_num + 1
            except (ValueError, IndexError):
                nouveau_num = 1
        else:
            nouveau_num = 1
        
        # Année courante (format 2 derniers chiffres)
        annee = str(date.today().year)[-2:]
        
        # Code de niveau
        niveau_code = self.get_niveau_code(niveau)
        
        # Formater le nouveau numéro
        nouveau_num_formate = str(nouveau_num).zfill(5)
        
        return f"6000{niveau_code}{annee}{nouveau_num_formate}"
    
    def create(self, validated_data):
        """Création d'un étudiant avec calcul automatique de bourse"""
        # Générer le numéro d'inscription
        niveau = validated_data.get('niveau')
        numero_inscription = self.generate_numero_inscription(niveau)
        validated_data['numero_inscription'] = numero_inscription
        
        # Calculer la bourse
        code_redoublement = validated_data.get('code_redoublement')
        boursier = validated_data.get('boursier')
        
        montant_bourse = self.calculate_bourse(niveau, code_redoublement, boursier)
        validated_data['bourse'] = montant_bourse
        
        # Créer l'étudiant
        etudiant = Etudiant.objects.create(**validated_data)
        
        # Créer un enregistrement de bourse si besoin
        if boursier == 'OUI' and montant_bourse > 0:
            today = date.today()
            Bourse.objects.create(
                etudiant=etudiant,
                montant=montant_bourse,
                annee_academique=f"{today.year}-{today.year + 1}",
                status="EN_ATTENTE",
                date_debut=today,
                date_fin=date(today.year + 1, today.month, today.day),
                conditions="Bourse automatiquement attribuée lors de l'inscription"
            )
        
        return etudiant
    
    def update(self, instance, validated_data):
        """Mise à jour d'un étudiant avec recalcul de la bourse si nécessaire"""
        # Vérifier si les champs affectant la bourse ont changé
        recalculate = False
        fields_to_check = ['niveau', 'code_redoublement', 'boursier']
        
        for field in fields_to_check:
            if field in validated_data and getattr(instance, field) != validated_data[field]:
                recalculate = True
                break
        
        # Si le niveau a changé, générer un nouveau numéro d'inscription
        if 'niveau' in validated_data and instance.niveau != validated_data['niveau']:
            niveau_code_ancien = self.get_niveau_code(instance.niveau)
            niveau_code_nouveau = self.get_niveau_code(validated_data['niveau'])
            
            # Si le code de niveau a changé, générer un nouveau numéro
            if niveau_code_ancien != niveau_code_nouveau:
                validated_data['numero_inscription'] = self.generate_numero_inscription(
                    validated_data['niveau']
                )
        
        # Si les champs de bourse ont changé, recalculer
        if recalculate:
            niveau = validated_data.get('niveau', instance.niveau)
            code_redoublement = validated_data.get('code_redoublement', instance.code_redoublement)
            boursier = validated_data.get('boursier', instance.boursier)
            
            montant_bourse = self.calculate_bourse(niveau, code_redoublement, boursier)
            validated_data['bourse'] = montant_bourse
            
            # Mettre à jour la bourse associée si elle existe
            try:
                bourse = Bourse.objects.filter(etudiant=instance).order_by('-id').first()
                if bourse:
                    # Si le code devient 'T' (Triplant), supprimer la bourse
                    if code_redoublement == 'T':
                        bourse.delete()
                    else:
                        bourse.montant = montant_bourse
                        bourse.save()
                elif boursier == 'OUI' and montant_bourse > 0 and code_redoublement != 'T':
                    # Créer une nouvelle bourse si l'étudiant devient boursier (sauf triplant)
                    today = date.today()
                    Bourse.objects.create(
                        etudiant=instance,
                        montant=montant_bourse,
                        annee_academique=f"{today.year}-{today.year + 1}",
                        status="EN_ATTENTE",
                        date_debut=today,
                        date_fin=date(today.year + 1, today.month, today.day),
                        conditions="Bourse mise à jour"
                    )
            except Exception as e:
                # En cas d'erreur, on continue sans la bourse
                print(f"Erreur lors de la mise à jour de la bourse: {e}")
        
        # Mettre à jour l'étudiant
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class EtudiantDetailSerializers(serializers.ModelSerializer):
    """Serializer détaillé avec informations supplémentaires"""
    
    statut_bourse = serializers.SerializerMethodField()
    faculte_display = serializers.CharField(source='get_faculte_display', read_only=True)
    
    class Meta:
        model = Etudiant
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_statut_bourse(self, obj):
        if obj.boursier == 'NON':
            return "Non boursier"
        
        montant = obj.bourse
        code = obj.code_redoublement
        
        if montant == 0:
            if code == 'T':
                return "Triplant (pas de bourse)"
            else:
                return "Boursier sans allocation"
        elif code == 'N':
            return f"Boursier à plein temps ({montant} MGA)"
        elif code == 'R':
            return f"Boursier redoublant ({montant} MGA)"
        
        return "Statut indéterminé"