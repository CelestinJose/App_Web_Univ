from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('administrateur', 'Administrateur'),
        ('scolarite', 'Scolarité'),
        ('bourse', 'Bourse'),
        ('finance', 'Finance'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    faculte = models.CharField(max_length=50, blank=True, null=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def update_online_status(self):
        """Met à jour le statut en ligne de l'utilisateur"""
        # Un utilisateur est considéré comme en ligne s'il a été actif dans les 5 dernières minutes
        if self.last_seen:
            time_since_last_seen = timezone.now() - self.last_seen
            self.is_online = time_since_last_seen.total_seconds() <= 300  # 5 minutes
        else:
            self.is_online = False
        
        # Sauvegarder seulement les champs modifiés
        self.save(update_fields=['is_online'])
        return self.is_online