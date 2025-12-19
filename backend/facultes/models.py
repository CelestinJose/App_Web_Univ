# facultes/models.py
from django.db import models

class Faculte(models.Model):
    STATUT_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]
    
    code = models.CharField(max_length=20, unique=True, help_text="Code de la faculté (ex: FST, FLASH)")
    nom = models.CharField(max_length=200, help_text="Nom complet de la faculté")
    description = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nom']
        verbose_name = "Faculté"
        verbose_name_plural = "Facultés"
    
    def __str__(self):
        return f"{self.code} - {self.nom}"


class Domaine(models.Model):
    STATUT_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]
    
    faculte = models.ForeignKey(Faculte, on_delete=models.CASCADE, related_name='domaines')
    code = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nom']
        verbose_name = "Domaine"
        verbose_name_plural = "Domaines"
        unique_together = ['faculte', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.nom} ({self.faculte.code})"


class Mention(models.Model):
    STATUT_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]
    
    domaine = models.ForeignKey(Domaine, on_delete=models.CASCADE, related_name='mentions')
    code = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    duree_etude = models.IntegerField(help_text="Durée d'étude en années", default=3)
    credits_requis = models.IntegerField(help_text="Nombre de crédits requis", default=180)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nom']
        verbose_name = "Mention"
        verbose_name_plural = "Mentions"
        unique_together = ['domaine', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.nom} ({self.domaine.code})"