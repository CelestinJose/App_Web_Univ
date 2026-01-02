from django.db import migrations

def create_default_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')

    # Créer l'admin s'il n'existe pas
    if not CustomUser.objects.filter(username='admin').exists():
        CustomUser.objects.create_superuser(
            username='admin', 
            email='admin@test.com', 
            password='admin123', 
            role='administrateur'
        )

    scolarites = {
        'Informatique': 'info123',
        'Medecine': 'med123',
        'Droit': 'droit123',
        'Economie': 'eco123'
    }

    for faculte, password in scolarites.items():
        username = f'scolarite_{faculte.lower()}'
        if not CustomUser.objects.filter(username=username).exists():
            CustomUser.objects.create_user(
                username=username,
                password=password,
                role='scolarite',
                faculte=faculte  # Assure-toi que le champ faculte existe
            )

    # Les autres comptes fixes
    if not CustomUser.objects.filter(username='bourse').exists():
        CustomUser.objects.create_user(username='bourse', password='bourse123', role='bourse')
    if not CustomUser.objects.filter(username='finance').exists():
        CustomUser.objects.create_user(username='finance', password='finance123', role='finance')

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_users),
    ]