from django.db import migrations

def create_default_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    if not CustomUser.objects.filter(username='admin').exists():
        CustomUser.objects.create_superuser(username='admin', email='admin@test.com', password='admin123', role='administrateur')
    if not CustomUser.objects.filter(username='scolarite').exists():
        CustomUser.objects.create_user(username='scolarite', password='scolarite123', role='scolarite')
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
