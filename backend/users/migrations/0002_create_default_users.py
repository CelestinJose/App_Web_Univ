from django.db import migrations

def create_default_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')

    # Admin
    if not CustomUser.objects.filter(username='admin').exists():
        CustomUser.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            first_name='Admin',
            last_name='System',
            role='administrateur'
        )

    users_data = [
        {
            'username': 'scolarite',
            'email': 'scolarite@example.com',
            'password': 'scolarite123',
            'first_name': 'Service',
            'last_name': 'Scolarité',
            'role': 'scolarite'
        },
        {
            'username': 'bourse',
            'email': 'bourse@example.com',
            'password': 'bourse123',
            'first_name': 'Service',
            'last_name': 'Bourse',
            'role': 'bourse'
        },
        {
            'username': 'finance',
            'email': 'finance@example.com',
            'password': 'finance123',
            'first_name': 'Service',
            'last_name': 'Finance',
            'role': 'finance'
        },
    ]

    for user_data in users_data:
        if not CustomUser.objects.filter(username=user_data['username']).exists():
            CustomUser.objects.create_user(**user_data)

def reverse_create_default_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.filter(
        username__in=['admin', 'scolarite', 'bourse', 'finance']
    ).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_users, reverse_create_default_users),
    ]
