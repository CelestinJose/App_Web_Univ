# bourses/models.py
from django.db import models
from django.db.models import Q
from etudiants.models import Etudiant
import hashlib

class Bourse(models.Model):
    """Modèle pour les bourses d'études"""
    
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente de traitement'),
        ('ACCEPTEE', 'Acceptée'),
        ('REJETEE', 'Rejetée'),
    ]
    
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='bourses')
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    annee_academique = models.CharField(max_length=20)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_decision = models.DateTimeField(null=True, blank=True) 
    
    date_debut = models.DateField()
    date_fin = models.DateField()
    
    conditions = models.TextField(blank=True)
    
    # Nouveau champ pour identifier les bourses attribuées à la même personne
    identifiant_personne = models.CharField(max_length=64, blank=True, null=True)
    
    class Meta:
        ordering = ['-date_demande']
    
    def __str__(self):
        return f"Bourse {self.status} - {self.etudiant.nom} ({self.annee_academique})"
    
    def save(self, *args, **kwargs):
        """Générer un identifiant unique pour la personne avant sauvegarde"""
        if self.etudiant:
            # Créer un identifiant basé sur nom/prénom/cin
            info_string = f"{self.etudiant.nom}{self.etudiant.prenom}{self.etudiant.cin}"
            if info_string.strip():
                self.identifiant_personne = hashlib.sha256(
                    info_string.encode('utf-8')
                ).hexdigest()
        
        # Vérifier s'il existe déjà une bourse active pour cette personne
        if self.status in ['ACCEPTEE', 'EN_ATTENTE'] and self.identifiant_personne:
            bourses_existantes = Bourse.objects.filter(
                identifiant_personne=self.identifiant_personne,
                status__in=['ACCEPTEE', 'EN_ATTENTE']
            ).exclude(id=self.id if self.id else None)
            
            if bourses_existantes.exists():
                # Ne pas lever d'erreur, mais logger l'information
                print(f"ATTENTION: Une bourse active existe déjà pour cette personne: {bourses_existantes.first()}")
        
        super().save(*args, **kwargs)