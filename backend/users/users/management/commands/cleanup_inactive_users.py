# users/management/commands/cleanup_inactive_users.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import CustomUser
from datetime import timedelta

class Command(BaseCommand):
    help = 'Met à jour le statut en ligne des utilisateurs inactifs'

    def handle(self, *args, **options):
        # Définir le seuil d'inactivité (15 minutes)
        threshold = timezone.now() - timedelta(minutes=15)
        
        # Marquer comme hors ligne les utilisateurs inactifs
        inactive_users = CustomUser.objects.filter(
            last_seen__lt=threshold,
            is_online=True
        )
        
        count = inactive_users.count()
        
        for user in inactive_users:
            user.is_online = False
            user.save(update_fields=['is_online'])
        
        self.stdout.write(
            self.style.SUCCESS(f'Mis hors ligne {count} utilisateur(s) inactif(s)')
        )