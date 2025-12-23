from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)
    confirm_password = serializers.CharField(required=True, write_only=True, min_length=6)
    
    def validate(self, attrs):
        # Vérifier que les nouveaux mots de passe correspondent
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Les mots de passe ne correspondent pas."
            })
        return attrs

# Serializer pour afficher les utilisateurs
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role']

# Serializer pour la création ou l'authentification JWT
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ajoute les infos personnalisées dans le token
        token['username'] = user.username
        token['role'] = user.role
        return token
    
    
    
# Serializer pour la demande de réinitialisation de mot de passe
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

# Serializer pour réinitialiser le mot de passe
class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    re_new_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['re_new_password']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs    
