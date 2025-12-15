# etudiants/admin.py
from django.contrib import admin
from .models import Etudiant

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ('id', 'numero_inscription', 'matricule', 'nom', 'prenom', 'faculte', 'niveau')
    search_fields = ('numero_inscription', 'matricule', 'nom', 'prenom')
    list_filter = ('faculte', 'niveau')
    ordering = ('id',)
