# users/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth import get_user_model

@receiver(post_migrate)
def create_default_users(sender, **kwargs):
    User = get_user_model()
    default_users = [
        {'username': 'admin', 'role': 'ADMIN', 'email': 'admin@example.com'},
        {'username': 'scolarite', 'role': 'SCOLARITE', 'email': 'scolarite@example.com'},
        {'username': 'bourse', 'role': 'BOURSE', 'email': 'bourse@example.com'},
        {'username': 'finance', 'role': 'FINANCE', 'email': 'finance@example.com'},
    ]
    for u in default_users:
        if not User.objects.filter(username=u['username']).exists():
            User.objects.create_user(username=u['username'], role=u['role'], email=u['email'], password='123456')
