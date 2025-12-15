from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('administrateur', 'Administrateur'),
        ('scolarite', 'Scolarité'),
        ('bourse', 'Bourse'),
        ('finance', 'Finance'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.username} ({self.role})"
