from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from .models import Etudiant
from .serializers import EtudiantSerializer, EtudiantDetailSerializers

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000

class EtudiantViewSet(viewsets.ModelViewSet):
    """
    ViewSet complet pour gérer les étudiants avec toutes les fonctionnalités.
    """
    queryset = Etudiant.objects.all()
    serializer_class = EtudiantSerializer
    permission_classes = [IsAuthenticated]
    
    # 1. Action pour les statistiques
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Récupérer les statistiques des étudiants"""
        queryset = self.get_queryset()
        
        # Calculer les statistiques
        stats_data = {
            'total': queryset.count(),
            'boursiers': queryset.filter(boursier='OUI').count(),
            'non_boursiers': queryset.filter(boursier='NON').count(),
            'non_redoublants': queryset.filter(code_redoublement='N').count(),
            'redoublants': queryset.filter(code_redoublement='R').count(),
            'total_bourses': queryset.filter(boursier='OUI').aggregate(
                total=Sum('bourse')
            )['total'] or 0,
        }
        
        # Statistiques par niveau
        niveaux_stats = queryset.values('niveau').annotate(
            count=Count('id'),
            boursiers=Count('id', filter=Q(boursier='OUI')),
            total_bourse=Sum('bourse', filter=Q(boursier='OUI'))
        )
        stats_data['par_niveau'] = list(niveaux_stats)
        
        return Response(stats_data)
    
    # 2. Action pour la recherche
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Recherche d'étudiants"""
        search_term = request.query_params.get('q', '')
        queryset = self.get_queryset()
        
        if search_term:
            queryset = queryset.filter(
                Q(nom__icontains=search_term) |
                Q(prenom__icontains=search_term) |
                Q(matricule__icontains=search_term) |
                Q(numero_inscription__icontains(search_term))
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    # 3. Action pour afficher un étudiant (votre code original)
    @action(detail=False, methods=['get'])
    def affiche_etudiant(self, request):
        try:
            # ATTENTION: Il y a une erreur ici, c'est request.user, pas request.Etudiant
            # ou vous devez passer l'ID dans les paramètres
            etudiant_id = request.query_params.get('id')
            if not etudiant_id:
                return Response({'error': 'ID étudiant requis'}, status=status.HTTP_400_BAD_REQUEST)
            
            etudiant = Etudiant.objects.get(id=etudiant_id)
            serializer = EtudiantDetailSerializers(etudiant)
            return Response(serializer.data)
        except Etudiant.DoesNotExist:
            return Response({'error': 'Etudiant non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # 4. Action pour mettre à jour (votre code original - corrigé)
    @action(detail=False, methods=['put'])
    def mettre_a_jour_etud(self, request):
        try:
            etudiant_id = request.data.get('id')
            if not etudiant_id:
                return Response({'error': 'ID étudiant requis'}, status=status.HTTP_400_BAD_REQUEST)
            
            etudiant = Etudiant.objects.get(id=etudiant_id)
            serializer = EtudiantDetailSerializers(etudiant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Etudiant.DoesNotExist:
            return Response({'error': 'Etudiant non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # 5. Vous pouvez aussi surcharger les méthodes standard si besoin
    def get_serializer_class(self):
        """Utiliser le serializer détaillé pour la récupération d'un seul objet"""
        if self.action == 'retrieve':
            return EtudiantDetailSerializers
        return EtudiantSerializer
    
    def get_queryset(self):
        """Filtrer le queryset si nécessaire"""
        queryset = super().get_queryset()
        
        # Filtre par niveau
        niveau = self.request.query_params.get('niveau')
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        
        # Filtre par boursier
        boursier = self.request.query_params.get('boursier')
        if boursier:
            queryset = queryset.filter(boursier=boursier)
        
        # Recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(matricule__icontains=search) |
                Q(numero_inscription__icontains=search)
            )
        
        return queryset