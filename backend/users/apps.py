# users/apps.py
from django.apps import AppConfig

class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        # Importez les signaux pour qu'ils soient enregistrés
        import users.signals