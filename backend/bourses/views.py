# bourses/views.py - Ajoutez ces nouvelles vues
from .serializers import BourseSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Bourse
from etudiants.models import Etudiant
import hashlib

class BourseViewSet(viewsets.ModelViewSet):
    queryset = Bourse.objects.all()
    serializer_class = BourseSerializer
    
    @action(detail=False, methods=['get'])
    def doublons_identite(self, request):
        """
        Détecte les étudiants avec mêmes nom/prénom/cin mais formations différentes
        """
        # Récupérer tous les étudiants
        etudiants = Etudiant.objects.exclude(cin__isnull=True).exclude(cin='')
        
        # Grouper par identité (nom/prénom/cin)
        groupes_identite = {}
        
        for etudiant in etudiants:
            # Créer une clé d'identité
            cle_identite = f"{etudiant.nom}_{etudiant.prenom}_{etudiant.cin}".lower()
            
            if cle_identite not in groupes_identite:
                groupes_identite[cle_identite] = {
                    'nom': etudiant.nom,
                    'prenom': etudiant.prenom,
                    'cin': etudiant.cin,
                    'formations': set(),
                    'etudiants': [],
                    'bourses_actives': []
                }
            
            # Ajouter la formation
            formation = f"{etudiant.faculte or ''}|{etudiant.domaine or ''}|{etudiant.mention or ''}"
            groupes_identite[cle_identite]['formations'].add(formation)
            
            # Ajouter l'étudiant
            groupes_identite[cle_identite]['etudiants'].append({
                'id': etudiant.id,
                'matricule': etudiant.matricule,
                'faculte': etudiant.faculte,
                'domaine': etudiant.domaine,
                'mention': etudiant.mention,
                'niveau': etudiant.niveau,
                'boursier': etudiant.boursier,
                'bourse_montant': etudiant.bourse
            })
        
        # Filtrer pour garder seulement ceux avec plusieurs formations
        doublons = []
        for cle, groupe in groupes_identite.items():
            if len(groupe['etudiants']) > 1:
                # Récupérer les bourses actives pour ce groupe
                etudiant_ids = [e['id'] for e in groupe['etudiants']]
                bourses_actives = Bourse.objects.filter(
                    etudiant__in=etudiant_ids,
                    status__in=['ACCEPTEE', 'EN_ATTENTE']
                )
                
                groupe['bourses_actives'] = BourseSerializer(bourses_actives, many=True).data
                groupe['formations'] = list(groupe['formations'])
                groupe['count'] = len(groupe['etudiants'])
                groupe['bourses_count'] = len(bourses_actives)
                groupe['has_bourse'] = bourses_actives.exists()
                
                doublons.append(groupe)
        
        return Response({
            'count': len(doublons),
            'results': doublons
        })
    
    @action(detail=False, methods=['post'])
    def attribuer_bourse_unique(self, request):
        """
        Attribue une bourse unique à une personne qui a plusieurs inscriptions
        """
        data = request.data
        etudiant_id = data.get('etudiant_id')
        formation_choisie = data.get('formation_choisie')  # format: "faculte|domaine|mention"
        
        if not etudiant_id:
            return Response({'error': 'Étudiant non spécifié'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Récupérer l'étudiant principal
            etudiant_principal = Etudiant.objects.get(id=etudiant_id)
            
            # Trouver tous les étudiants avec la même identité
            doublons = Etudiant.objects.filter(
                nom=etudiant_principal.nom,
                prenom=etudiant_principal.prenom,
                cin=etudiant_principal.cin
            )
            
            # Si une formation est spécifiée, mettre à jour l'étudiant principal
            if formation_choisie:
                faculte, domaine, mention = formation_choisie.split('|')
                if faculte != 'None' and faculte != '':
                    etudiant_principal.faculte = faculte
                if domaine != 'None' and domaine != '':
                    etudiant_principal.domaine = domaine
                if mention != 'None' and mention != '':
                    etudiant_principal.mention = mention
                etudiant_principal.save()
            
            # Récupérer toutes les bourses actives des doublons
            bourses_actives = Bourse.objects.filter(
                etudiant__in=doublons,
                status__in=['ACCEPTEE', 'EN_ATTENTE']
            )
            
            response_data = {
                'etudiant_principal': {
                    'id': etudiant_principal.id,
                    'nom': etudiant_principal.nom,
                    'prenom': etudiant_principal.prenom,
                    'matricule': etudiant_principal.matricule,
                    'formation': f"{etudiant_principal.faculte} / {etudiant_principal.domaine} / {etudiant_principal.mention}"
                },
                'bourses_traitees': [],
                'message': ''
            }
            
            if bourses_actives.count() > 1:
                # Garder la première bourse ACCEPTEE, sinon la première EN_ATTENTE
                bourse_acceptee = bourses_actives.filter(status='ACCEPTEE').first()
                if bourse_acceptee:
                    bourse_a_garder = bourse_acceptee
                else:
                    bourse_a_garder = bourses_actives.filter(status='EN_ATTENTE').first()
                
                # Rejeter ou supprimer les autres bourses
                for bourse in bourses_actives:
                    if bourse.id == bourse_a_garder.id:
                        # Transférer la bourse à l'étudiant principal si nécessaire
                        if bourse.etudiant != etudiant_principal:
                            bourse.etudiant = etudiant_principal
                            bourse.save()
                            response_data['bourses_traitees'].append({
                                'id': bourse.id,
                                'action': 'transférée',
                                'status': bourse.status
                            })
                        else:
                            response_data['bourses_traitees'].append({
                                'id': bourse.id,
                                'action': 'conservée',
                                'status': bourse.status
                            })
                    else:
                        # Rejeter les autres bourses
                        bourse.status = 'REJETEE'
                        bourse.save()
                        response_data['bourses_traitees'].append({
                            'id': bourse.id,
                            'action': 'rejetée',
                            'status': 'REJETEE'
                        })
                
                response_data['message'] = f"{len(bourses_actives) - 1} bourse(s) rejetée(s). Une seule bourse conservée."
            
            elif bourses_actives.count() == 1:
                # Vérifier que la bourse est sur l'étudiant principal
                bourse = bourses_actives.first()
                if bourse.etudiant != etudiant_principal:
                    bourse.etudiant = etudiant_principal
                    bourse.save()
                    response_data['message'] = "Bourse transférée à l'étudiant principal."
                else:
                    response_data['message'] = "Une seule bourse active trouvée."
                
                response_data['bourses_traitees'].append({
                    'id': bourse.id,
                    'action': 'conservée',
                    'status': bourse.status
                })
            
            else:
                response_data['message'] = "Aucune bourse active trouvée pour ce groupe."
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Etudiant.DoesNotExist:
            return Response({'error': 'Étudiant non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)