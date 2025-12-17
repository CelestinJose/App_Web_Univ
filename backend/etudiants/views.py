from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
import pandas as pd
import io
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
        }
        
        # Statistiques par niveau
        niveaux_stats = queryset.values('niveau').annotate(
            count=Count('id'),
            boursiers=Count('id', filter=Q(boursier='OUI'))
        )
        stats_data['par_niveau'] = list(niveaux_stats)
        
        return Response(stats_data)
    
    # 2. Action pour l'importation Excel
    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        """Importation d'étudiants depuis un fichier Excel"""
        try:
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {'error': 'Aucun fichier fourni'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Lire le fichier Excel
            excel_data = pd.read_excel(file)
            
            # Normaliser les noms de colonnes
            excel_data.columns = excel_data.columns.str.lower().str.strip()
            
            results = {
                'total': len(excel_data),
                'success': 0,
                'failed': 0,
                'errors': []
            }
            
            # Parcourir chaque ligne
            for index, row in excel_data.iterrows():
                try:
                    # Préparer les données
                    etudiant_data = {
                        'matricule': row.get('matricule', '').strip(),
                        'nom': row.get('nom', '').strip(),
                        'prenom': row.get('prenom', '').strip(),
                        'date_naissance': row.get('date_naissance'),
                        'lieu_naissance': row.get('lieu_naissance', '').strip(),
                        'telephone': row.get('telephone', '').strip(),
                        'email': row.get('email', '').strip(),
                        'cin': row.get('cin', '').strip(),
                        'annee_bacc': row.get('annee_bacc'),
                        'code_redoublement': row.get('code_redoublement', 'N'),
                        'boursier': row.get('boursier', 'NON'),
                        'faculte': row.get('faculte', '').strip(),
                        'domaine': row.get('domaine', '').strip(),
                        'niveau': row.get('niveau', 'Licence 1').strip(),
                        'nationalite': row.get('nationalite', 'Malagasy').strip(),
                        'mention': row.get('mention', '').strip(),
                        'nom_pere': row.get('nom_pere', '').strip(),
                        'nom_mere': row.get('nom_mere', '').strip(),
                    }
                    
                    # Validation
                    if not etudiant_data['matricule'] or not etudiant_data['nom'] or not etudiant_data['prenom']:
                        raise ValueError('Matricule, nom et prénom sont obligatoires')
                    
                    # Vérifier si l'étudiant existe déjà
                    if Etudiant.objects.filter(matricule=etudiant_data['matricule']).exists():
                        # Mettre à jour
                        etudiant = Etudiant.objects.get(matricule=etudiant_data['matricule'])
                        serializer = EtudiantSerializer(etudiant, data=etudiant_data, partial=True)
                    else:
                        # Créer
                        serializer = EtudiantSerializer(data=etudiant_data)
                    
                    if serializer.is_valid():
                        serializer.save()
                        results['success'] += 1
                    else:
                        raise ValueError(f"Erreur validation: {serializer.errors}")
                    
                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append(f"Ligne {index + 2}: {str(e)}")
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'importation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 3. Importation en masse (alternative)
    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Importation en masse d'étudiants depuis JSON avec gestion des doublons"""
        try:
            etudiants_data = request.data
            
            if not isinstance(etudiants_data, list):
                return Response(
                    {'error': 'Les données doivent être une liste d\'étudiants'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            results = {
                'total': len(etudiants_data),
                'created': 0,
                'updated': 0,
                'failed': 0,
                'errors': []
            }
            
            for i, etudiant_data in enumerate(etudiants_data):
                try:
                    matricule = etudiant_data.get('matricule')
                    numero_inscription = etudiant_data.get('numero_inscription')
                    
                    if not matricule and not numero_inscription:
                        raise ValueError('Matricule ou numéro d\'inscription requis')
                    
                    # Chercher par matricule OU numéro d'inscription
                    existing_etudiant = None
                    if matricule:
                        existing_etudiant = Etudiant.objects.filter(matricule=matricule).first()
                    elif numero_inscription:
                        existing_etudiant = Etudiant.objects.filter(numero_inscription=numero_inscription).first()
                    
                    if existing_etudiant:
                        # Mettre à jour l'étudiant existant
                        serializer = EtudiantSerializer(existing_etudiant, data=etudiant_data, partial=True)
                        if serializer.is_valid():
                            serializer.save()
                            results['updated'] += 1
                        else:
                            raise ValueError(f"Erreur validation mise à jour: {serializer.errors}")
                    else:
                        # Créer un nouvel étudiant
                        serializer = EtudiantSerializer(data=etudiant_data)
                        if serializer.is_valid():
                            serializer.save()
                            results['created'] += 1
                        else:
                            raise ValueError(f"Erreur validation création: {serializer.errors}")
                    
                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append(f"Ligne {i + 1}: {str(e)}")
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'importation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    # 4. Action pour la recherche
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
                Q(numero_inscription__icontains=search_term)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    # 5. Action pour afficher un étudiant
    @action(detail=False, methods=['get'])
    def affiche_etudiant(self, request):
        try:
            etudiant_id = request.query_params.get('id')
            if not etudiant_id:
                return Response({'error': 'ID étudiant requis'}, status=status.HTTP_400_BAD_REQUEST)
            
            etudiant = Etudiant.objects.get(id=etudiant_id)
            serializer = EtudiantDetailSerializers(etudiant)
            return Response(serializer.data)
        except Etudiant.DoesNotExist:
            return Response({'error': 'Etudiant non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'ID invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 6. Action pour mettre à jour
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
        except ValueError:
            return Response({'error': 'ID invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 7. Choix du serializer
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EtudiantDetailSerializers
        return EtudiantSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtres
        niveau = self.request.query_params.get('niveau')
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        
        boursier = self.request.query_params.get('boursier')
        if boursier:
            queryset = queryset.filter(boursier=boursier)
        
        faculte = self.request.query_params.get('faculte')
        if faculte:
            queryset = queryset.filter(faculte=faculte)
        
        mention = self.request.query_params.get('mention')
        if mention:
            queryset = queryset.filter(mention__icontains=mention)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
                Q(matricule__icontains=search) |
                Q(numero_inscription__icontains=search)
            )
        
        return queryset