# users/serializers.py
from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)
    confirm_password = serializers.CharField(required=True, write_only=True, min_length=6)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Les mots de passe ne correspondent pas."
            })
        return attrs

class UserSerializer(serializers.ModelSerializer):
    is_online = serializers.BooleanField(read_only=True)
    last_seen = serializers.DateTimeField(read_only=True)
    last_seen_human = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'is_online', 
                  'last_seen', 'last_seen_human', 'date_joined', 'last_login']
        read_only_fields = ['is_online', 'last_seen', 'date_joined', 'last_login']
    
    def get_last_seen_human(self, obj):
        """Retourne un format humain pour last_seen"""
        if not obj.last_seen:
            return "Jamais connecté"
        
        now = timezone.now()
        delta = now - obj.last_seen
        
        if delta.total_seconds() < 60:
            return "À l'instant"
        elif delta.total_seconds() < 120:
            return "Il y a 1 minute"
        elif delta.total_seconds() < 3600:
            minutes = int(delta.total_seconds() // 60)
            return f"Il y a {minutes} minutes"
        elif delta.total_seconds() < 7200:
            return "Il y a 1 heure"
        elif delta.total_seconds() < 86400:
            hours = int(delta.total_seconds() // 3600)
            return f"Il y a {hours} heures"
        elif delta.total_seconds() < 172800:
            return "Il y a 1 jour"
        else:
            days = int(delta.total_seconds() // 86400)
            return f"Il y a {days} jours"

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['user_id'] = user.id
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Mettre à jour le statut de l'utilisateur
        user = self.user
        user.last_seen = timezone.now()
        user.is_online = True
        user.save(update_fields=['last_seen', 'is_online'])
        
        # Ajouter les infos utilisateur à la réponse
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_online': user.is_online
        }
        
        return data

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    re_new_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['re_new_password']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs