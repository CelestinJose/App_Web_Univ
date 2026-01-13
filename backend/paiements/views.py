from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Paiement, EcheancierPaiement
from etudiants.models import Etudiant
from facultes.models import Faculte
from .serializers import PaiementIndividuelSerializer, PaiementCollectifSerializer, EcheanceSerializer, PaiementListSerializer
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus.flowables import Image
import os
from decimal import Decimal


from reportlab.lib.pagesizes import landscape, A4

from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


# ⚡ Paiement individuel
class PaiementIndividuelViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related('etudiant').prefetch_related('etudiant__echeanciers')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PaiementListSerializer
        return PaiementIndividuelSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paiement = serializer.save()
        return Response({
            "message": "Paiement individuel créé !",
            "paiement_id": paiement.id
        }, status=status.HTTP_201_CREATED)


# ⚡ Paiement collectif
class PaiementCollectifViewSet(viewsets.GenericViewSet):
    serializer_class = PaiementCollectifSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paiements = serializer.save()
        return Response({
            "message": f"{len(paiements)} paiements créés pour la faculté."
        }, status=status.HTTP_201_CREATED)
   

class EcheanceViewSet(viewsets.ModelViewSet):
    queryset = EcheancierPaiement.objects.all()
    serializer_class = EcheanceSerializer


def export_pdf_view(request):
    """
    Génère un PDF de récapitulatif des bourses selon le format spécifié
    """
    faculte_id = request.GET.get("faculte")
    niveau = request.GET.get("niveau")

    # Récupérer la faculté
    faculte = None
    if faculte_id:
        try:
            faculte = Faculte.objects.get(id=faculte_id)
        except Faculte.DoesNotExist:
            pass

    # Filtrer les étudiants selon les critères
    etudiants = Etudiant.objects.all()
    if faculte:
        etudiants = etudiants.filter(faculte=faculte)
    if niveau:
        etudiants = etudiants.filter(niveau=niveau)
    
    # Calculer les effectifs - CORRIGÉ selon le PDF
    # Dans le PDF: PASSANT = boursiers, REDOUBLANT = non boursiers
    # Note: Vérifiez votre modèle pour confirmer les champs
    
    try:
        # Méthode 1: Basé sur le champ boursier
        passants = etudiants.filter(boursier='OUI').count()
        redoublants = etudiants.filter(boursier='NON').count()
    except:
        try:
            # Méthode 2: Basé sur le code redoublement
            passants = etudiants.filter(code_redoublement='N').count()
            redoublants = etudiants.filter(code_redoublement__in=['R', 'T']).count()
        except:
            # Méthode 3: Valeurs par défaut
            passants = etudiants.count()
            redoublants = 0
    
    total_etudiants = passants + redoublants
    
    # Définir les taux selon le PDF
    TAUX_BOURSE_PASSANT_MOIS = Decimal('48400.00')  # 48 400,00 Ar
    TAUX_BOURSE_REDOUBLANT_MOIS = Decimal('12100.00')  # 12 100,00 Ar
    TAUX_EQUIPEMENT = Decimal('66000.00')  # 66 000,00 Ar
    
    # Calculer les montants comme dans le PDF
    # 1. Bourses mensuelles
    bourses_mensuelles_passants = passants * TAUX_BOURSE_PASSANT_MOIS
    bourses_mensuelles_redoublants = redoublants * TAUX_BOURSE_REDOUBLANT_MOIS
    bourses_mensuelles_total = bourses_mensuelles_passants + bourses_mensuelles_redoublants
    
    # 2. Équipement
    equipement_passants = passants * TAUX_EQUIPEMENT
    equipement_redoublants = redoublants * TAUX_EQUIPEMENT
    equipement_total = equipement_passants + equipement_redoublants
    
    # 3. Total 3 mois + équipement
    total_3mois_equipement_passants = (bourses_mensuelles_passants * Decimal('3')) + equipement_passants
    total_3mois_equipement_redoublants = (bourses_mensuelles_redoublants * Decimal('3')) + equipement_redoublants
    total_3mois_equipement_total = (bourses_mensuelles_total * Decimal('3')) + equipement_total
    
    # Formater les montants avec espace comme séparateur de milliers
    def format_montant(montant):
        # Format: "X XXX XXX,XX"
        formatted = f"{montant:,.2f}"
        parts = formatted.split(".")
        integer_part = parts[0].replace(",", " ")
        if len(parts) > 1:
            return f"{integer_part},{parts[1]}"
        return integer_part
    
    # Préparer la réponse PDF
    response = HttpResponse(content_type='application/pdf')
    
    # Nom du fichier
    nom_faculte = faculte.nom if faculte else "TOUS"
    filename = f"Etat_recapitulatif_bourses_{nom_faculte}_{niveau}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    # Créer le document PDF en format paysage
    doc = SimpleDocTemplate(
        response,
        pagesize=landscape(A4),
        rightMargin=0.5*cm,
        leftMargin=0.5*cm,
        topMargin=0.5*cm,
        bottomMargin=0.5*cm
    )
    
    # Créer les styles
    styles = getSampleStyleSheet()
    
    # Style pour "REPOBLIKAN'I MADAGASCAR"
    header_main_style = ParagraphStyle(
        'HeaderMain',
        parent=styles['Heading1'],
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=4,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    # Style pour la devise
    motto_style = ParagraphStyle(
        'Motto',
        parent=styles['Heading2'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=8,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour les institutions
    institution_style = ParagraphStyle(
        'Institution',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=2,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour les titres de sections
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=9,
        alignment=TA_CENTER,
        spaceAfter=2,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour le titre principal
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading2'],
        fontSize=12,
        alignment=TA_CENTER,
        spaceAfter=12,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    # Style normal pour le texte
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_LEFT,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour les cellules du tableau
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour les cellules alignées à gauche
    table_cell_left_style = ParagraphStyle(
        'TableCellLeft',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_LEFT,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour les cellules alignées à droite
    table_cell_right_style = ParagraphStyle(
        'TableCellRight',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_RIGHT,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Style pour le pied de page
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Construire le contenu du PDF
    elements = []
    
    # === EN-TÊTE AVEC LOGO ===
    # Chemin du logo
    logo_path = "/frontend/src/assets/logo-univ-toliara.png"
    
    # Vérifier si le logo existe
    if os.path.exists(logo_path):
        try:
            # Créer une table pour aligner le logo et le texte
            logo_table_data = [
                [
                    Image(logo_path, width=2.5*cm, height=2.5*cm),  # Logo à gauche
                    Paragraph(
                        """<b>REPOBLIKAN'I MADAGASCAR</b><br/>
                        Tanindrazana - Fitiavana - Fandrosoana<br/>
                        <br/>
                        MINISTERE DE L'ENSEIGNEMENT SUPERIEUR<br/>
                        ET DE LA RECHERCHE SCIENTIFIQUE<br/>
                        <br/>
                        UNIVERSITE DE TOLIARA<br/>
                        ---<br/>
                        PRESIDENCE<br/>
                        ---<br/>
                        DIRECTION ADMINISTRATIF ET FINANCIER""",
                        ParagraphStyle(
                            'LogoHeader',
                            parent=styles['Normal'],
                            fontSize=9,
                            alignment=TA_CENTER,
                            textColor=colors.black,
                            fontName='Helvetica'
                        )
                    )
                ]
            ]
            
            # Créer le tableau pour l'en-tête avec logo
            logo_table = Table(logo_table_data, colWidths=[3*cm, 20*cm])
            logo_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('ALIGN', (1, 0), (1, 0), 'CENTER'),
                ('BOX', (0, 0), (-1, -1), 0, colors.white),  # Pas de bordure visible
                ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ]))
            
            elements.append(logo_table)
            elements.append(Spacer(1, 8))
            
        except Exception as e:
            # Si le logo ne peut pas être chargé, utiliser l'en-tête texte seulement
            print(f"Erreur lors du chargement du logo: {e}")
            elements.append(Paragraph("REPOBLIKAN'I MADAGASCAR", header_main_style))
            elements.append(Paragraph("Tanindrazana - Fitiavana - Fandrosoana", motto_style))
            elements.append(Paragraph("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR", institution_style))
            elements.append(Paragraph("ET DE LA RECHERCHE SCIENTIFIQUE", institution_style))
            elements.append(Paragraph("UNIVERSITE DE TOLIARA", institution_style))
            elements.append(Paragraph("---", institution_style))
            elements.append(Paragraph("PRESIDENCE", section_style))
            elements.append(Paragraph("---", institution_style))
            elements.append(Paragraph("DIRECTION ADMINISTRATIF ET FINANCIER", section_style))
            elements.append(Spacer(1, 8))
    else:
        # Logo non trouvé, utiliser l'en-tête texte seulement
        print(f"Logo non trouvé à l'emplacement: {logo_path}")
        elements.append(Paragraph("REPOBLIKAN'I MADAGASCAR", header_main_style))
        elements.append(Paragraph("Tanindrazana - Fitiavana - Fandrosoana", motto_style))
        elements.append(Paragraph("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR", institution_style))
        elements.append(Paragraph("ET DE LA RECHERCHE SCIENTIFIQUE", institution_style))
        elements.append(Paragraph("UNIVERSITE DE TOLIARA", institution_style))
        elements.append(Paragraph("---", institution_style))
        elements.append(Paragraph("PRESIDENCE", section_style))
        elements.append(Paragraph("---", institution_style))
        elements.append(Paragraph("DIRECTION ADMINISTRATIF ET FINANCIER", section_style))
        elements.append(Spacer(1, 8))
    
    # === ADRESSE ===
    elements.append(Paragraph(
        "Le Directeur Administratif et Financier de l'Université de Tolara<br/>à<br/>Madame le Ministre de l'Enseignement Supérieur et de la Recherche Scientifique", 
        normal_style
    ))
    elements.append(Spacer(1, 12))
    
    # === TITRE PRINCIPAL ===
    elements.append(Paragraph(
        f"ETAT RECAPITULATIF DE RECLAMATION DES BOURSES TROIS (3) MOIS AVEC EQUIPEMENT AU NIVEAU {niveau}", 
        title_style
    ))
    elements.append(Spacer(1, 12))
    
    # === TABLEAU AVEC STRUCTURE MODIFIÉE ===
    # Nous devons fusionner certaines cellules pour obtenir la structure souhaitée
    # Créer un tableau plus complexe avec fusion de cellules
    
    # Création des données du tableau avec structure hiérarchique
    table_data = [
        # Première ligne : en-têtes
        [
            Paragraph("<b>ETABLISSEMENT</b>", table_cell_style),
            Paragraph("<b></b>", table_cell_style),
            Paragraph("<b>EFFECTIF</b>", table_cell_style),
            Paragraph("<b>Taux de<br/>Bourses/Mois/Etudiants</b>", table_cell_style),
            Paragraph("<b>Taux<br/>Equipement/Etudiants</b>", table_cell_style),
            Paragraph("<b>Bourses<br/>Mensuelles</b>", table_cell_style),
            Paragraph("<b>Equipement</b>", table_cell_style),
            Paragraph("<b>3mois+<br/>Equipement</b>", table_cell_style)
        ],
        # Deuxième ligne : PASSANT
        [
            Paragraph("UNIVERSITE DE TOLIARA", table_cell_style),
            Paragraph("PASSANT", table_cell_left_style),  # Catégorie alignée à gauche
            Paragraph(str(passants), table_cell_right_style),  # Effectif aligné à droite
            Paragraph(format_montant(TAUX_BOURSE_PASSANT_MOIS), table_cell_style),
            Paragraph(format_montant(TAUX_EQUIPEMENT), table_cell_style),
            Paragraph(format_montant(bourses_mensuelles_passants), table_cell_style),
            Paragraph(format_montant(equipement_passants), table_cell_style),
            Paragraph(format_montant(total_3mois_equipement_passants), table_cell_style)
        ],
        # Troisième ligne : REDOUBLANT
        [
            Paragraph("", table_cell_style),  # Cellule vide pour ETABLISSEMENT
            Paragraph("REDOUBLANT", table_cell_left_style),  # Catégorie alignée à gauche
            Paragraph(str(redoublants), table_cell_right_style),  # Effectif aligné à droite
            Paragraph(format_montant(TAUX_BOURSE_REDOUBLANT_MOIS), table_cell_style),
            Paragraph(format_montant(TAUX_EQUIPEMENT), table_cell_style),
            Paragraph(format_montant(bourses_mensuelles_redoublants), table_cell_style),
            Paragraph(format_montant(equipement_redoublants), table_cell_style),
            Paragraph(format_montant(total_3mois_equipement_redoublants), table_cell_style)
        ],
        # Quatrième ligne : TOTAL
        [
            Paragraph("", table_cell_style),  # Cellule vide pour ETABLISSEMENT
            Paragraph("<b>TOTAL</b>", table_cell_left_style),  # TOTAL aligné à gauche
            Paragraph(f"<b>{total_etudiants}</b>", table_cell_right_style),  # Effectif total aligné à droite
            Paragraph("", table_cell_style),
            Paragraph("", table_cell_style),
            Paragraph(f"<b>{format_montant(bourses_mensuelles_total)}</b>", table_cell_style),
            Paragraph(f"<b>{format_montant(equipement_total)}</b>", table_cell_style),
            Paragraph(f"<b>{format_montant(total_3mois_equipement_total)}</b>", table_cell_style)
        ]
    ]
    
    # Largeurs des colonnes adaptées au PDF
    col_widths = [
        4.5*cm,   # ETABLISSEMENT (titre court mais contenu long)
        2.8*cm,   # CATEGORIE (PASSANT, REDOUBLANT, TOTAL)
        1.8*cm,   # pas de text ici
        4.5*cm,   # effectif
        3.2*cm,   # Taux de Bourses/Mois/Etudiants
        3.0*cm,   # Taux Equipement/Etudiants
        3.0*cm,   # Bourses Mensuelles
        2.8*cm,   # Equipement
        3.2*cm    # 3mois+ Equipement
    ]
    
    # Créer le tableau
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Style du tableau avec fusion de cellules pour l'établissement
    table_style = TableStyle([
        # Bordures
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        
        # Fusionner la cellule ETABLISSEMENT pour les lignes 1-3
        ('SPAN', (0, 1), (0, 3)),  # Fusionner ETABLISSEMENT sur 3 lignes
        
        # En-tête
        ('BACKGROUND', (0, 0), (-1, 0), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        
        # Alignement spécifique pour les colonnes
        ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  # Colonne EFFECTIF (nombres) alignée à droite
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),   # Colonne CATEGORIE alignée à gauche
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'), # Colonnes de montants alignées à droite
        
        # Style pour la cellule ETABLISSEMENT fusionnée
        ('VALIGN', (0, 1), (0, 3), 'MIDDLE'),
        ('ALIGN', (0, 1), (0, 3), 'CENTER'),
        
        # Ligne de total
        ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (1, -1), (-1, -1), colors.lightgrey),
        
        # Padding
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ])
    
    table.setStyle(table_style)
    elements.append(table)
    elements.append(Spacer(1, 20))
    
    # === PIED DE PAGE ===
    # Convertir le montant total en lettres (simplifié)
    montant_total_lettres = f"Vingt neuf millions sept cent soixante douze mille six cent Ariary"
    # Note: Dans la réalité, vous devriez implémenter une fonction de conversion nombre→lettres
    
    elements.append(Paragraph(
        f"Arrêté le présent état au nombre de <b>{total_etudiants}</b> étudiants et d'un montant total de <b>{montant_total_lettres} ({format_montant(total_3mois_equipement_total)} Ar)</b>",
        footer_style
    ))
    elements.append(Spacer(1, 8))
    
    # Construire le PDF
    doc.build(elements)
    
    return response