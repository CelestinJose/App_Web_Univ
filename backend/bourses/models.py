from django.db import models
from etudiants.models import Etudiant

class Bourse(models.Model):
    """Modèle pour les bourses d'études"""
    
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente de traitement'),
        ('ACCEPTEE', 'Acceptée'),
        ('REJETEE', 'Rejetée'),
        ('SUSPENDUE', 'Suspendue'),
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
     
    class Meta:
        ordering = ['-date_demande']
    
    def __str__(self):
        return f"Bourse {self.status} - {self.etudiant.nom} ({self.annee_academique})"


# Create your models here.
