# bourses/views.py - Version avec traitement permanent des doublons
from .serializers import BourseSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Bourse
from etudiants.models import Etudiant
import hashlib
import traceback
from django.db import transaction

class BourseViewSet(viewsets.ModelViewSet):
    queryset = Bourse.objects.all()
    serializer_class = BourseSerializer
    
    @action(detail=False, methods=['get'])
    def doublons_identite(self, request):
        """
        Détecte les étudiants avec mêmes nom/prénom/cin mais formations différentes
        EXCLUT les étudiants déjà traités (bourse unique attribuée)
        """
        try:
            # Récupérer tous les étudiants EXCEPTÉ ceux déjà traités
            etudiants = Etudiant.objects.exclude(
                Q(cin__isnull=True) | Q(cin='')
            ).exclude(
                # Exclure les étudiants marqués comme "doublon_traite"
                Q(doublon_traite=True) | 
                Q(bourse_unique_attribuee=True)
            )
            
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
                
                # Récupérer les noms (pas les objets)
                faculte_nom = str(etudiant.faculte) if etudiant.faculte else ''
                domaine_nom = str(etudiant.domaine) if etudiant.domaine else ''
                mention_nom = str(etudiant.mention) if etudiant.mention else ''
                
                # Ajouter la formation
                formation = f"{faculte_nom}|{domaine_nom}|{mention_nom}"
                groupes_identite[cle_identite]['formations'].add(formation)
                
                # Ajouter l'étudiant - utiliser les noms, pas les objets
                groupes_identite[cle_identite]['etudiants'].append({
                    'id': etudiant.id,
                    'matricule': etudiant.matricule,
                    'faculte': faculte_nom,
                    'domaine': domaine_nom,
                    'mention': mention_nom,
                    'niveau': etudiant.niveau,
                    'boursier': etudiant.boursier,
                    'bourse_montant': float(etudiant.bourse) if etudiant.bourse else 0.0,
                    'doublon_traite': getattr(etudiant, 'doublon_traite', False)
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
                    
                    # Sérialiser manuellement les bourses pour éviter les problèmes
                    bourses_data = []
                    for bourse in bourses_actives:
                        bourse_dict = {
                            'id': bourse.id,
                            'etudiant_id': bourse.etudiant_id,
                            'montant': float(bourse.montant) if bourse.montant else 0.0,
                            'status': bourse.status,
                            'annee_academique': bourse.annee_academique,
                            'date_demande': bourse.date_demande.isoformat() if bourse.date_demande else None,
                            'date_decision': bourse.date_decision.isoformat() if bourse.date_decision else None,
                            'date_debut': bourse.date_debut.isoformat() if bourse.date_debut else None,
                            'date_fin': bourse.date_fin.isoformat() if bourse.date_fin else None,
                            'conditions': bourse.conditions,
                            'identifiant_personne': bourse.identifiant_personne
                        }
                        bourses_data.append(bourse_dict)
                    
                    groupe['bourses_actives'] = bourses_data
                    groupe['formations'] = list(groupe['formations'])
                    groupe['count'] = len(groupe['etudiants'])
                    groupe['bourses_count'] = len(bourses_actives)
                    groupe['has_bourse'] = bourses_actives.exists()
                    
                    doublons.append(groupe)
            
            return Response({
                'count': len(doublons),
                'results': doublons
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'detail': 'Erreur lors de la détection des doublons',
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def attribuer_bourse_unique(self, request):
        """
        Attribue une bourse unique à une personne qui a plusieurs inscriptions
        et MARQUE les étudiants comme traités pour qu'ils ne réapparaissent plus
        """
        try:
            data = request.data
            etudiant_id = data.get('etudiant_id')
            formation_choisie = data.get('formation_choisie')  # format: "faculte|domaine|mention"
            
            print(f"DEBUG: Données reçues: {data}")
            print(f"DEBUG: etudiant_id: {etudiant_id}")
            print(f"DEBUG: formation_choisie: {formation_choisie}")
            
            if not etudiant_id:
                return Response({'error': 'Étudiant non spécifié'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Récupérer l'étudiant principal
            etudiant_principal = Etudiant.objects.get(id=etudiant_id)
            print(f"DEBUG: Étudiant trouvé: {etudiant_principal.nom} {etudiant_principal.prenom}")
            
            # Trouver tous les étudiants avec la même identité
            doublons = Etudiant.objects.filter(
                nom=etudiant_principal.nom,
                prenom=etudiant_principal.prenom,
                cin=etudiant_principal.cin
            )
            print(f"DEBUG: Nombre de doublons trouvés: {doublons.count()}")
            
            # Utiliser une transaction pour garantir l'intégrité des données
            with transaction.atomic():
                # MARQUER TOUS les étudiants de ce groupe comme "doublon traité"
                # Pour qu'ils n'apparaissent plus dans la liste des doublons
                marquage_mis_a_jour = doublons.update(
                    doublon_traite=True,
                    bourse_unique_attribuee=True
                )
                print(f"DEBUG: {marquage_mis_a_jour} étudiants marqués comme traités")
                
                # Marquer spécifiquement l'étudiant principal comme "étudiant principal pour bourse"
                etudiant_principal.est_etudiant_principal = True
                
                # Si une formation est spécifiée, mettre à jour l'étudiant principal
                if formation_choisie and formation_choisie != 'None|None|None':
                    try:
                        faculte_nom, domaine_nom, mention_nom = formation_choisie.split('|')
                        print(f"DEBUG: Formation décomposée: {faculte_nom}, {domaine_nom}, {mention_nom}")
                        
                        # Mettre à jour les champs de formation
                        if faculte_nom and faculte_nom != 'None':
                            etudiant_principal.faculte = faculte_nom
                        if domaine_nom and domaine_nom != 'None':
                            etudiant_principal.domaine = domaine_nom
                        if mention_nom and mention_nom != 'None':
                            etudiant_principal.mention = mention_nom
                        
                    except Exception as e:
                        print(f"DEBUG: Erreur lors de la mise à jour de la formation: {str(e)}")
                        print(f"DEBUG: Traceback: {traceback.format_exc()}")
                        # Continuer même si la mise à jour échoue
                
                # Sauvegarder les modifications de l'étudiant principal
                etudiant_principal.save()
                
                # Récupérer toutes les bourses actives des doublons
                bourses_actives = Bourse.objects.filter(
                    etudiant__in=doublons,
                    status__in=['ACCEPTEE', 'EN_ATTENTE']
                )
                print(f"DEBUG: Bourses actives trouvées: {bourses_actives.count()}")
                
                response_data = {
                    'etudiant_principal': {
                        'id': etudiant_principal.id,
                        'nom': etudiant_principal.nom,
                        'prenom': etudiant_principal.prenom,
                        'matricule': etudiant_principal.matricule,
                        'faculte': str(etudiant_principal.faculte) if etudiant_principal.faculte else '',
                        'domaine': str(etudiant_principal.domaine) if etudiant_principal.domaine else '',
                        'mention': str(etudiant_principal.mention) if etudiant_principal.mention else '',
                        'niveau': etudiant_principal.niveau,
                        'doublon_traite': etudiant_principal.doublon_traite,
                        'bourse_unique_attribuee': etudiant_principal.bourse_unique_attribuee,
                        'est_etudiant_principal': etudiant_principal.est_etudiant_principal
                    },
                    'bourses_traitees': [],
                    'message': '',
                    'doublons_marques': marquage_mis_a_jour
                }
                
                if bourses_actives.count() > 1:
                    print(f"DEBUG: Plusieurs bourses trouvées, traitement...")
                    # Garder la première bourse ACCEPTEE, sinon la première EN_ATTENTE
                    bourse_acceptee = bourses_actives.filter(status='ACCEPTEE').first()
                    if bourse_acceptee:
                        bourse_a_garder = bourse_acceptee
                    else:
                        bourse_a_garder = bourses_actives.filter(status='EN_ATTENTE').first()
                    
                    print(f"DEBUG: Bourse à garder: {bourse_a_garder.id} - {bourse_a_garder.status}")
                    
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
                                    'status': bourse.status,
                                    'montant': float(bourse.montant) if bourse.montant else 0.0
                                })
                            else:
                                response_data['bourses_traitees'].append({
                                    'id': bourse.id,
                                    'action': 'conservée',
                                    'status': bourse.status,
                                    'montant': float(bourse.montant) if bourse.montant else 0.0
                                })
                        else:
                            # Rejeter les autres bourses
                            bourse.status = 'REJETEE'
                            bourse.motif_rejet = "Doublon détecté - Une seule bourse autorisée par personne"
                            bourse.save()
                            response_data['bourses_traitees'].append({
                                'id': bourse.id,
                                'action': 'rejetée',
                                'status': 'REJETEE',
                                'montant': float(bourse.montant) if bourse.montant else 0.0
                            })
                    
                    response_data['message'] = f"{len(bourses_actives) - 1} bourse(s) rejetée(s). Une seule bourse conservée."
                
                elif bourses_actives.count() == 1:
                    print(f"DEBUG: Une seule bourse trouvée")
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
                        'status': bourse.status,
                        'montant': float(bourse.montant) if bourse.montant else 0.0
                    })
                
                else:
                    print(f"DEBUG: Aucune bourse active trouvée")
                    response_data['message'] = "Aucune bourse active trouvée pour ce groupe. Les étudiants ont été marqués comme traités."
            
            print(f"DEBUG: Réponse finale: {response_data}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Etudiant.DoesNotExist:
            error_msg = f"Étudiant avec ID {etudiant_id} non trouvé"
            print(f"DEBUG: {error_msg}")
            return Response({'error': error_msg}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            error_msg = str(e)
            traceback_msg = traceback.format_exc()
            print(f"DEBUG: Erreur inattendue: {error_msg}")
            print(f"DEBUG: Traceback: {traceback_msg}")
            return Response({
                'error': error_msg,
                'traceback': traceback_msg,
                'detail': 'Erreur lors de l\'attribution de la bourse unique'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # bourses/views.py - Ajoutez cette action

@action(detail=False, methods=['get'])
def doublons_traites(self, request):
    """
    Liste les doublons déjà traités
    """
    try:
        etudiants_traites = Etudiant.objects.filter(
            doublon_traite=True
        ).values(
            'nom', 'prenom', 'cin', 'date_traitement_doublon',
            'bourse_unique_attribuee', 'est_etudiant_principal'
        ).distinct()
        
        return Response({
            'count': etudiants_traites.count(),
            'results': list(etudiants_traites)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'detail': 'Erreur lors de la récupération des doublons traités'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@action(detail=False, methods=['post'])
def reinitialiser_doublon(self, request):
    """
    Réinitialiser un doublon traité (pour le cas où on se serait trompé)
    """
    try:
        data = request.data
        nom = data.get('nom')
        prenom = data.get('prenom')
        cin = data.get('cin')
        
        if not all([nom, prenom, cin]):
            return Response({'error': 'Nom, prénom et CIN requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        etudiants = Etudiant.objects.filter(
            nom=nom, prenom=prenom, cin=cin
        )
        
        mis_a_jour = etudiants.update(
            doublon_traite=False,
            bourse_unique_attribuee=False,
            est_etudiant_principal=False,
            date_traitement_doublon=None
        )
        
        return Response({
            'message': f'{mis_a_jour} étudiant(s) réinitialisé(s)',
            'count': mis_a_jour
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e),
            'detail': 'Erreur lors de la réinitialisation'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)