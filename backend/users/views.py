from rest_framework import viewsets, permissions, status
from rest_framework_simplejwt.views import TokenObtainPairView # type: ignore
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from .models import CustomUser
from .serializers import (
    UserSerializer,
    MyTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
# Vue pour JWT login
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Vue pour gérer les utilisateurs
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    

# Demande de réinitialisation
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            # Pour la sécurité, on ne révèle pas si l'utilisateur existe
            return Response({"message": "Si cet email existe, un lien de réinitialisation a été envoyé."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"http://localhost:8000/reset-password-confirm/{uid}/{token}/"  # Modifie l'URL frontend si besoin

        send_mail(
            subject="Réinitialisation du mot de passe",
            message=f"Voici le lien pour réinitialiser votre mot de passe : {reset_link}",
            from_email=None,
            recipient_list=[user.email],
        )

        return Response({"message": "Si cet email existe, un lien de réinitialisation a été envoyé."})

# Confirmation et mise à jour du mot de passe
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