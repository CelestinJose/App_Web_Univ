# users/migrations/0002_create_default_users.py
from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_default_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')

    default_users = [
        {'username': 'admin', 'role': 'administrateur', 'email': 'admin@example.com', 'password': '123456'},
        {'username': 'scolarite_informatique', 'role': 'scolarite', 'faculte': 'Faculté des Sciences et Technologies', 'email': 'scolarite_info@example.com', 'password': 'info123'},
        {'username': 'scolarite_medecine', 'role': 'scolarite', 'faculte': 'Faculté de Médecine et de Santé', 'email': 'scolarite_med@example.com', 'password': 'med123'},
        {'username': 'scolarite_droit', 'role': 'scolarite', 'faculte': 'Droit', 'email': 'scolarite_droit@example.com', 'password': 'droit123'},
        {'username': 'scolarite_economie', 'role': 'scolarite', 'Faculté de faculte': 'Faculté des Sciences Économiques et de Gestion', 'email': 'scolarite_eco@example.com', 'password': 'eco123'},
        {'username': 'bourse', 'role': 'bourse', 'email': 'bourse@example.com', 'password': 'bourse123'},
        {'username': 'finance', 'role': 'finance', 'email': 'finance@example.com', 'password': 'finance123'},
    ]

    for user_data in default_users:
        if not CustomUser.objects.filter(username=user_data['username']).exists():
            password = make_password(user_data['password'])
            fields = {k: v for k, v in user_data.items() if k != 'password'}
            CustomUser.objects.create(password=password, **fields)

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_users),
    ]
