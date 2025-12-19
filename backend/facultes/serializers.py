# facultes/serializers.py
from rest_framework import serializers
from .models import Faculte, Domaine, Mention

class FaculteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculte
        fields = '__all__'

class DomaineSerializer(serializers.ModelSerializer):
    faculte_nom = serializers.CharField(source='faculte.nom', read_only=True)
    
    class Meta:
        model = Domaine
        fields = '__all__'
        extra_fields = ['faculte_nom']

class MentionSerializer(serializers.ModelSerializer):
    domaine_nom = serializers.CharField(source='domaine.nom', read_only=True)
    faculte_nom = serializers.CharField(source='domaine.faculte.nom', read_only=True)
    
    class Meta:
        model = Mention
        fields = '__all__'
        extra_fields = ['domaine_nom', 'faculte_nom']