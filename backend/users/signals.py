# users/signals.py
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.utils import timezone
from django.core.cache import cache

@receiver(post_migrate)
def create_default_users(sender, **kwargs):
    """
    Crée les utilisateurs par défaut après les migrations
    """
    User = get_user_model()
    default_users = [
        {'username': 'admin', 'role': 'administrateur', 'email': 'admin@example.com', 'password': '123456'},
        {'username': 'scolarite', 'role': 'scolarite', 'email': 'scolarite@example.com', 'password': '123456'},
        {'username': 'bourse', 'role': 'bourse', 'email': 'bourse@example.com', 'password': '123456'},
        {'username': 'finance', 'role': 'finance', 'email': 'finance@example.com', 'password': '123456'},
    ]
    
    for user_data in default_users:
        if not User.objects.filter(username=user_data['username']).exists():
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                role=user_data['role'],
                password=user_data['password']
            )
            # Marquer comme déconnecté par défaut
            user.is_online = False
            user.save(update_fields=['is_online'])
            print(f"Utilisateur créé : {user.username} ({user.role})")

@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """
    Met à jour le statut quand un utilisateur se connecte
    """
    User = get_user_model()
    if isinstance(user, User):
        user.last_seen = timezone.now()
        user.is_online = True
        if request:
            try:
                user.last_login_ip = request.META.get('REMOTE_ADDR')
            except:
                user.last_login_ip = None
        user.save(update_fields=['last_seen', 'is_online', 'last_login_ip'])
        
        # Stocker la session dans le cache pour suivi (5 minutes)
        cache.set(f'user_online_{user.id}', True, 300)
        
        print(f"Utilisateur connecté : {user.username}")

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    """
    Met à jour le statut quand un utilisateur se déconnecte
    """
    User = get_user_model()
    if isinstance(user, User):
        user.is_online = False
        user.save(update_fields=['is_online'])
        
        # Supprimer du cache
        cache.delete(f'user_online_{user.id}')
        
        print(f"Utilisateur déconnecté : {user.username}")

@receiver(post_save, sender=get_user_model())
def update_online_status_on_save(sender, instance, **kwargs):
    """
    Met à jour le statut en ligne lors de la sauvegarde de l'utilisateur
    """
    # Vérifier si l'utilisateur a un champ last_seen
    if hasattr(instance, 'last_seen') and instance.last_seen:
        # Un utilisateur est considéré comme en ligne s'il a été actif dans les 5 dernières minutes
        time_since_last_seen = timezone.now() - instance.last_seen
        is_online_now = time_since_last_seen.total_seconds() <= 300  # 5 minutes
        
        # Mettre à jour seulement si le statut a changé
        if instance.is_online != is_online_now:
            instance.is_online = is_online_now
            
            # Éviter la récursion en sauvegardant directement
            sender.objects.filter(pk=instance.pk).update(is_online=is_online_now)
            
            # Mettre à jour le cache
            if is_online_now:
                cache.set(f'user_online_{instance.id}', True, 300)
            else:
                cache.delete(f'user_online_{instance.id}')