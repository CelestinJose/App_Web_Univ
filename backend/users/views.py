# users/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.core.cache import cache

from .models import CustomUser
from .serializers import (
    UserSerializer,
    MyTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer
)
from django.contrib.auth import update_session_auth_hash

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Vérifier l'ancien mot de passe
    old_password = serializer.validated_data['old_password']
    if not user.check_password(old_password):
        return Response(
            {"old_password": ["Ancien mot de passe incorrect."]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Changer le mot de passe
    new_password = serializer.validated_data['new_password']
    user.set_password(new_password)
    user.save()
    
    # Mettre à jour la session pour éviter la déconnexion
    update_session_auth_hash(request, user)
    
    return Response(
        {"message": "Mot de passe changé avec succès."},
        status=status.HTTP_200_OK
    )

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Surcharge pour restreindre certaines actions aux administrateurs seulement
        """
        if self.action in ['destroy', 'update', 'partial_update']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def online(self, request):
        """
        Retourne la liste des utilisateurs en ligne (admin seulement)
        """
        if request.user.role != 'administrateur':
            return Response(
                {"error": "Permission refusée. Admin seulement."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filtrer les utilisateurs en ligne
        five_minutes_ago = timezone.now() - timezone.timedelta(minutes=5)
        online_users = CustomUser.objects.filter(
            last_seen__gte=five_minutes_ago,
            is_online=True
        ).exclude(id=request.user.id)
        
        serializer = self.get_serializer(online_users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_last_seen(self, request):
        """
        Met à jour le timestamp de dernière activité
        """
        user = request.user
        user.last_seen = timezone.now()
        user.save(update_fields=['last_seen'])
        
        # Mettre en cache
        cache.set(f'user_online_{user.id}', True, 300)
        
        return Response({
            'status': 'success', 
            'last_seen': user.last_seen,
            'is_online': user.is_online
        })

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({"message": "Si cet email existe, un lien de réinitialisation a été envoyé."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"http://localhost:3000/reset-password/{uid}/{token}/"

        send_mail(
            subject="Réinitialisation du mot de passe",
            message=f"Voici le lien pour réinitialiser votre mot de passe : {reset_link}",
            from_email=None,
            recipient_list=[user.email],
        )

        return Response({"message": "Si cet email existe, un lien de réinitialisation a été envoyé."})

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (CustomUser.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Lien invalide"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Lien expiré ou invalide"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"message": "Mot de passe réinitialisé avec succès"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Retourne les informations de l'utilisateur actuellement connecté
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)