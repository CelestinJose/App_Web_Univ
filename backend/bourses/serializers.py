from rest_framework import serializers
from .models import Bourse

class BourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bourse
        fields = '__all__'   # ou liste des champs : ["id", "etudiant", "montant", ...]
