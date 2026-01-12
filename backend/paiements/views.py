from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Paiement, EcheancierPaiement
from etudiants.models import Etudiant
from facultes.models import Faculte
from rest_framework.decorators import action
from .serializers import PaiementIndividuelSerializer, PaiementCollectifSerializer, EcheanceSerializer, PaiementListSerializer, ExportPdfSerializer
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import inch, cm
from reportlab.platypus.flowables import Image
from django.conf import settings
import os
from decimal import Decimal

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
    
    # Calculer les vrais effectifs
    print(f"Total étudiants filtrés: {etudiants.count()}")
    
    try:
        passants = etudiants.filter(boursier='OUI').count()
        redoublants = etudiants.filter(boursier='NON').count()
        print(f"Passants (boursier=OUI): {passants}")
        print(f"Redoublants (boursier=NON): {redoublants}")
    except:
        try:
            passants = etudiants.filter(code_redoublement='N').count()
            redoublants = etudiants.filter(code_redoublement__in=['R', 'T']).count()
            print(f"Passants (code_redoublement=N): {passants}")
            print(f"Redoublants (code_redoublement=R/T): {redoublants}")
        except:
            passants = etudiants.count()
            redoublants = 0
            print("Utilisation de valeurs par défaut")
    
    total_etudiants = passants + redoublants
    
    # Définir les taux
    TAUX_BOURSE_PASSANT_MOIS = Decimal('36300.00')
    TAUX_BOURSE_REDOUBLANT_MOIS = Decimal('9075.00')
    TAUX_EQUIPEMENT = Decimal('66000.00')
    
    # Calculer les montants
    bourses_mensuelles_passants = passants * TAUX_BOURSE_PASSANT_MOIS
    bourses_mensuelles_redoublants = redoublants * TAUX_BOURSE_REDOUBLANT_MOIS
    bourses_mensuelles_total = bourses_mensuelles_passants + bourses_mensuelles_redoublants
    
    equipement_passants = passants * TAUX_EQUIPEMENT
    equipement_redoublants = redoublants * TAUX_EQUIPEMENT
    equipement_total = equipement_passants + equipement_redoublants
    
    total_3mois_equipement_passants = (bourses_mensuelles_passants * Decimal('3')) + equipement_passants
    total_3mois_equipement_redoublants = (bourses_mensuelles_redoublants * Decimal('3')) + equipement_redoublants
    total_3mois_equipement_total = (bourses_mensuelles_total * Decimal('3')) + equipement_total
    
    # Formater les montants
    def format_montant(montant):
        return "{:,.0f}".format(montant).replace(",", " ")
    
    # Préparer la réponse PDF
    response = HttpResponse(content_type='application/pdf')
    
    # Nom du fichier
    nom_faculte = faculte.nom if faculte else "TOUS"
    filename = f"Etat_recapitulatif_bourses_{nom_faculte}_{niveau}.pdf"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    # Créer le document PDF avec des marges modérées et paysage
    from reportlab.lib.pagesizes import landscape
    doc = SimpleDocTemplate(
        response,
        pagesize=landscape(A4),
        rightMargin=0.4*cm,
        leftMargin=0.4*cm,
        topMargin=0.8*cm,
        bottomMargin=0.8*cm
    )
    
    # Créer les styles
    styles = getSampleStyleSheet()
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading1'],
        fontSize=13,
        alignment=TA_CENTER,
        spaceAfter=4,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=3,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    ministry_style = ParagraphStyle(
        'Ministry',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=2,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading2'],
        fontSize=11,
        alignment=TA_CENTER,
        spaceAfter=5,
        textColor=colors.black,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_LEFT,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Construire le contenu du PDF
    elements = []
    
    # === EN-TÊTE COMPACT ===
    elements.append(Paragraph("REPOBLIKANT MADAGASCAR", header_style))
    elements.append(Paragraph("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR", ministry_style))
    elements.append(Paragraph("UNIVERSITE DE TOLIARA", ministry_style))
    elements.append(Spacer(1, 10))
    
    # === TITRE PRINCIPAL ===
    elements.append(Paragraph(
        f"ETAT RECAPITULATIF DE RECLAMATION DES BOURSES 3 MOIS + EQUIPEMENT - NIVEAU {niveau}", 
        title_style
    ))
    elements.append(Spacer(1, 8))
    
    # === TABLEAU OPTIMISÉ ===
    table_data = [
        [
            Paragraph("<b>ETABLISSEMENT</b>", normal_style),
            Paragraph("<b>CATEGORIE</b>", normal_style),
            Paragraph("<b>EFFECTIF</b>", normal_style),
            Paragraph("<b>Taux Bourses/Mois</b>", normal_style),
            Paragraph("<b>Taux Equipement</b>", normal_style),
            Paragraph("<b>Bourses 3 mois</b>", normal_style),
            Paragraph("<b>Equipement</b>", normal_style),
            Paragraph("<b>Total</b>", normal_style)
        ],
        [
            Paragraph("UNIV. TOLIARA", normal_style),
            Paragraph("PASSANT", normal_style),
            Paragraph(str(passants), normal_style),
            Paragraph(format_montant(TAUX_BOURSE_PASSANT_MOIS), normal_style),
            Paragraph(format_montant(TAUX_EQUIPEMENT), normal_style),
            Paragraph(format_montant(bourses_mensuelles_passants * 3), normal_style),
            Paragraph(format_montant(equipement_passants), normal_style),
            Paragraph(format_montant(total_3mois_equipement_passants), normal_style)
        ],
        [
            Paragraph("", normal_style),
            Paragraph("REDOUBLANT", normal_style),
            Paragraph(str(redoublants), normal_style),
            Paragraph(format_montant(TAUX_BOURSE_REDOUBLANT_MOIS), normal_style),
            Paragraph(format_montant(TAUX_EQUIPEMENT), normal_style),
            Paragraph(format_montant(bourses_mensuelles_redoublants * 3), normal_style),
            Paragraph(format_montant(equipement_redoublants), normal_style),
            Paragraph(format_montant(total_3mois_equipement_redoublants), normal_style)
        ],
        [
            Paragraph("", normal_style),
            Paragraph("<b>TOTAL</b>", normal_style),
            Paragraph(f"<b>{total_etudiants}</b>", normal_style),
            Paragraph("", normal_style),
            Paragraph("", normal_style),
            Paragraph(f"<b>{format_montant(bourses_mensuelles_total * 3)}</b>", normal_style),
            Paragraph(f"<b>{format_montant(equipement_total)}</b>", normal_style),
            Paragraph(f"<b>{format_montant(total_3mois_equipement_total)}</b>", normal_style)
        ]
    ]
    
    # Colonnes optimisées pour paysage
    col_widths = [
        3.2*cm,  # ETABLISSEMENT
        2.7*cm,  # CATEGORIE
        2.2*cm,  # EFFECTIF
        2.9*cm,  # Taux Bourses
        2.9*cm,  # Taux Equipement
        3.1*cm,  # Bourses 3 mois
        2.7*cm,  # Equipement
        2.9*cm   # Total
    ]
    
    # Créer le tableau
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Style du tableau compact
    table_style = TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.5, colors.black),
        ('GRID', (0, 0), (-1, -1), 1.5, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 1), (1, -1), 'LEFT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ROWHEIGHTS', (0, 0), (-1, -1), 36),
    ])
    
    table.setStyle(table_style)
    elements.append(table)
    elements.append(Spacer(1, 10))
    
    # === PIED DE PAGE ===
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    from datetime import datetime
    date_actuelle = datetime.now().strftime("%d/%m/%Y")
    
    elements.append(Paragraph(
        f"Arreté le présent état au nombre de <b>{total_etudiants}</b> étudiants et d'un montant total de <b>{format_montant(total_3mois_equipement_total)} Ar</b>",
        footer_style
    ))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(f"Fait à Toliara, le {date_actuelle}", footer_style))
    
    # Construire le PDF
    doc.build(elements)
    
    return response
