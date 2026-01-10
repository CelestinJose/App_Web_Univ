from django.db import models
# from etudiants.models import Etudiant

class Paiement(models.Model):
    """Modèle pour les paiements des frais de scolarité"""
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('CONFIRME', 'Confirmé'),
        ('ECHOUE', 'Échoué'),
        ('REMBOURSÉ', 'Remboursé'),
    ]
    
    etudiant = models.ForeignKey( 'etudiants.Etudiant',on_delete=models.CASCADE,related_name='paiement')

    montant = models.DecimalField(max_digits=10, decimal_places=2)
    montant_restant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    
    date_paiement = models.DateTimeField(auto_now_add=True)
    date_confirmation = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.status} - {self.montant}€"


class EcheancierPaiement(models.Model):
    """Modèle pour les paiements échelonnés"""
    etudiant = models.ForeignKey('etudiants.Etudiant', on_delete=models.CASCADE, related_name='echeanciers')
    nombre_echeances = models.IntegerField(default=3)  # Nombre de versements
    montant_par_echeance = models.DecimalField(max_digits=10, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Écheancier {self.nombre_echeances}x - {self.etudiant}"


class VersementEcheance(models.Model):
    """Modèle pour chaque versement d'une écheance"""
    STATUS_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('PAYE', 'Payé'),
        ('RETARD', 'En retard'),
    ]
    
    echeancier = models.ForeignKey(EcheancierPaiement, on_delete=models.CASCADE, related_name='versements')
    numero_echeance = models.IntegerField()  # 1, 2, 3...
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_echeance = models.DateField()
    date_paiement = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    reference_paiement = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['numero_echeance']
    
    def __str__(self):
        return f"Versement {self.numero_echeance} - {self.montant}€"
