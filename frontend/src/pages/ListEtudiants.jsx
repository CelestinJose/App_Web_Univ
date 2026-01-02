import React, { useState, useEffect } from "react";
import {
  FaSearch, FaIdCard, FaFileAlt, FaPrint, FaDownload,
  FaEye, FaFilter, FaUserGraduate, FaUniversity, FaDatabase,
  FaBook
} from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Pagination from 'react-bootstrap/Pagination';
import Spinner from 'react-bootstrap/Spinner';
import { jsPDF } from "jspdf"
import 'bootstrap/dist/css/bootstrap.min.css';
import { etudiantApi } from "../api";
import QRCode from 'qrcode';

// Importez votre logo ici (assurez-vous d'avoir le fichier dans votre projet)
import logoUnivToliara from '../assets/logo-univ-toliara.png';
// Import des logos des facultés
import logoFaculteSciences from '../assets/logos/faculte-sciences.png';
// import logoFaculteLettres from '../assets/logos/faculte-lettres.png';
// import logoFaculteDroit from '../assets/logos/faculte-droit.png';
import logoFaculteMedecine from '../assets/logos/faculte-medecine.png';
// import logoFaculteEconomie from '../assets/logos/faculte-economie.png';
// import logoEcoleIngenieurs from '../assets/logos/ecole-ingenieurs.png';
// import logoInstitutTechnologie from '../assets/logos/institut-technologie.png';
// Ajoutez d'autres logos selon vos facultés

export default function ListEtudiants() {
  // État pour les données
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterFaculte, setFilterFaculte] = useState("");
  const [filterBoursier, setFilterBoursier] = useState("");
  const [filterMention, setFilterMention] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // États pour les modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCertificatModal, setShowCertificatModal] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);

  // Charger les données depuis l'API
  useEffect(() => {
    fetchEtudiants();
    fetchStats();
  }, []);

  // Fonction pour charger les étudiants
  const fetchEtudiants = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Chargement des étudiants avec params:", params);
      const response = await etudiantApi.getEtudiants(params);
      console.log("Données reçues:", response.data);

      if (response.data && Array.isArray(response.data.results)) {
        setEtudiants(response.data.results);
        setTotalCount(response.data.count || response.data.results.length);
      } else if (Array.isArray(response.data)) {
        setEtudiants(response.data);
        setTotalCount(response.data.length);
      } else {
        console.error("Format de données non reconnu:", response.data);
        setEtudiants([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des étudiants:", error);
      setError("Impossible de charger les données des étudiants. Veuillez vérifier votre connexion.");
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour charger les statistiques
  const fetchStats = async () => {
    try {
      console.log("Chargement des statistiques...");
      const response = await etudiantApi.getStats();
      console.log("Statistiques reçues:", response.data);
      setStats(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  // Filtrer les étudiants
  const handleSearch = () => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (filterNiveau) params.niveau = filterNiveau;
    if (filterFaculte) params.faculte = filterFaculte;
    if (filterBoursier) params.boursier = filterBoursier;
    if (filterMention) params.mention = filterMention;

    setCurrentPage(1);
    fetchEtudiants(params);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setFilterNiveau("");
    setFilterFaculte("");
    setFilterBoursier("");
    setFilterMention("");
    setCurrentPage(1);
    fetchEtudiants();
  };

  // Options pour les filtres
  const niveaux = [...new Set(etudiants.map(e => e.niveau).filter(Boolean))];
  const facultes = [...new Set(etudiants.map(e => e.faculte).filter(Boolean))];
  const mentions = [...new Set(etudiants.map(e => e.mention).filter(Boolean))];

  // Filtrer les étudiants localement
  const filteredEtudiants = etudiants.filter(etudiant => {
    const matchesSearch =
      (etudiant.nom && etudiant.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.prenom && etudiant.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.matricule && etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.numero_inscription && etudiant.numero_inscription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.mention && etudiant.mention.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNiveau = filterNiveau ? etudiant.niveau === filterNiveau : true;
    const matchesFaculte = filterFaculte ? etudiant.faculte === filterFaculte : true;
    const matchesBoursier = filterBoursier ? etudiant.boursier === filterBoursier : true;
    const matchesMention = filterMention ? etudiant.mention === filterMention : true;

    return matchesSearch && matchesNiveau && matchesFaculte && matchesBoursier && matchesMention;
  });

  // Logique de pagination locale
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEtudiants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEtudiants.length / itemsPerPage);

  // Changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Ouvrir modal de détail
  const openDetailModal = (etudiant) => {
    setSelectedEtudiant(etudiant);
    setShowDetailModal(true);
  };

  // Ouvrir modal pour carte étudiante
  const openCardModal = (etudiant) => {
    setSelectedEtudiant(etudiant);
    setShowCardModal(true);
  };

  // Ouvrir modal pour certificat
  const openCertificatModal = (etudiant) => {
    setSelectedEtudiant(etudiant);
    setShowCertificatModal(true);
  };

// Générer la carte étudiante en PDF
const genererCarteEtudiantPDF = async () => {
  if (!selectedEtudiant) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [86, 54] // Format carte de crédit standard
  });

  // Dimensions utiles
  const cardWidth = 86;
  const cardHeight = 54;
  const margin = 2; // Marge générale
  
  // Zone de la photo
  const photoWidth = 20; // Largeur de la photo
  const photoHeight = 25; // Hauteur de la photo
  const photoX = margin + 2; // Position X de la photo
  const photoY = 16; // Position Y de la photo
  
  // Zone des informations - AUGMENTÉE pour noms longs
  const infoX = photoX + photoWidth + 3; // Position X des informations
  const infoWidth = 38; // Largeur augmentée pour les informations
  
  // Zone QR code - RÉDUITE pour compenser
  const qrSize = 16; // Taille du QR code réduite
  const qrX = infoX + infoWidth + 2; // Position X du QR code
  const qrY = photoY + 2; // Position Y du QR code

  // 1. FOND DE LA CARTE - Dégradé bleu
  doc.setFillColor(230, 240, 255);
  doc.rect(0, 0, cardWidth, cardHeight, 'F');
  
  // Bande supérieure (bleu foncé)
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, cardWidth, 10, 'F');
  
  // Bande inférieure (bleu moyen)
  doc.setFillColor(0, 102, 204);
  doc.rect(0, cardHeight - 8, cardWidth, 8, 'F');

  // 2. LOGO UNIVERSITÉ - dans le bandeau supérieur
  try {
    // Logo université à gauche
    const logoUnivWidth = 15;
    const logoUnivHeight = 8;
    const logoUnivX = margin + 2;
    const logoUnivY = 1;
    
    if (logoUnivToliara) {
      doc.addImage(logoUnivToliara, 'PNG', logoUnivX, logoUnivY, logoUnivWidth, logoUnivHeight);
    }
  } catch (error) {
    console.warn("Logo université non chargé:", error);
  }

  // 3. NOM DE L'UNIVERSITÉ
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("UNIVERSITÉ DE TOLIARA", cardWidth / 2, 6, { align: 'center' });

  // 4. LOGO DE LA FACULTÉ - dans le bandeau supérieur à droite
  try {
    const logoFaculte = getLogoFaculte(selectedEtudiant.faculte);
    if (logoFaculte) {
      const logoFaculteWidth = 12;
      const logoFaculteHeight = 8;
      const logoFaculteX = cardWidth - margin - 2 - logoFaculteWidth;
      const logoFaculteY = 1;
      doc.addImage(logoFaculte, 'PNG', logoFaculteX, logoFaculteY, logoFaculteWidth, logoFaculteHeight);
    }
  } catch (error) {
    console.warn("Logo faculté non chargé:", error);
  }

  // 5. CADRE PHOTO AVEC EFFET 3D
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 1, 1, 'F');
  
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(photoX + 0.5, photoY + 0.5, photoWidth, photoHeight, 1, 1, 'F');
  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 1, 1, 'F');
  
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.3);
  doc.roundedRect(photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2, 0.5, 0.5);
  
  doc.setFontSize(5);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text("PHOTO", photoX + photoWidth / 2, photoY + photoHeight - 2, { align: 'center' });

  // 6. ZONE DES INFORMATIONS - AGRANDIE
  doc.setFillColor(255, 255, 255, 230);
  doc.roundedRect(infoX - 1, photoY - 1, infoWidth + 2, photoHeight + 2, 2, 2, 'F');
  
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.3);
  doc.roundedRect(infoX - 1, photoY - 1, infoWidth + 2, photoHeight + 2, 2, 2);

  // Titre de la carte
  doc.setFontSize(6);
  doc.setTextColor(0, 51, 102);
  doc.setFont('helvetica', 'bold');
  doc.text("CARTE ÉTUDIANTE", infoX + infoWidth / 2, photoY + 2, { align: 'center' });

  // Ligne de séparation
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.2);
  doc.line(infoX, photoY + 4, infoX + infoWidth, photoY + 4);

  // Informations de l'étudiant
  doc.setFontSize(5);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  let currentY = photoY + 7;

  // FONCTION AMÉLIORÉE POUR LES NOMS LONGS
  const wrapText = (text, maxWidth, x, y, lineHeight = 3.5) => {
    if (!text) return y;
    
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let isFirstLine = true;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? ' ' : '') + words[i];
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && i > 0) {
        // Écrire la ligne actuelle
        doc.text(line, x, currentY);
        currentY += lineHeight;
        line = words[i];
        isFirstLine = false;
      } else {
        line = testLine;
      }
    }
    
    // Écrire la dernière ligne
    doc.text(line, x, currentY);
    
    // Retourner la prochaine position Y
    return currentY + lineHeight;
  };

  // FONCTION POUR TRONQUER LES TEXTES TRÈS LONGS (sans couper les mots)
  const truncateTextSmart = (text, maxChars) => {
    if (!text) return '';
    if (text.length <= maxChars) return text;
    
    // Tronquer aux maxChars, mais chercher le dernier espace
    let truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxChars - 10) { // Si on a un espace proche de la fin
      truncated = truncated.substring(0, lastSpace);
    }
    
    return truncated + '...';
  };

  // 1. NOM COMPLET - Gestion spéciale pour les noms longs
  const nom = selectedEtudiant.nom?.toUpperCase() || '';
  const prenom = selectedEtudiant.prenom || '';
  
  // STRATÉGIE : Afficher d'abord le nom en entier, puis le prénom tronqué si nécessaire
  const maxCharsForLine = 28; // Augmenté pour les noms longs
  
  // Calculer la largeur disponible pour le texte
  const labelWidth = 8; // "NOM:"
  const textStartX = infoX + labelWidth;
  const maxTextWidth = infoWidth - labelWidth - 2; // Largeur disponible pour le texte
  
  // Option 1: Nom seul (si très long)
  let nomToDisplay = nom;
  let nomWidth = doc.getTextWidth(nomToDisplay);
  
  // Option 2: Nom + initiale du prénom (pour économiser de la place)
  if (nomWidth > maxTextWidth && prenom) {
    const initiale = prenom.charAt(0).toUpperCase() + '.';
    nomToDisplay = `${nom} ${initiale}`;
    nomWidth = doc.getTextWidth(nomToDisplay);
  }
  
  // Option 3: Tronquer intelligemment
  if (nomWidth > maxTextWidth) {
    nomToDisplay = truncateTextSmart(nomToDisplay, maxCharsForLine);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text("NOM:", infoX, currentY);
  doc.setFont('helvetica', 'normal');
  
  // Vérifier si le texte dépasse encore
  const finalWidth = doc.getTextWidth(nomToDisplay);
  if (finalWidth > maxTextWidth) {
    // Utiliser wrapText pour les cas extrêmes
    currentY = wrapText(nomToDisplay, maxTextWidth, textStartX, currentY, 3);
  } else {
    doc.text(nomToDisplay, textStartX, currentY);
    currentY += 3.5;
  }

  // 2. PRÉNOM COMPLET (sur une ligne séparée si le nom est tronqué)
  if (prenom && (nom.length > 15 || finalWidth > maxTextWidth - 5)) {
    // Afficher le prénom sur une ligne séparée
    const prenomTruncated = truncateTextSmart(prenom, 22);
    doc.setFont('helvetica', 'bold');
    doc.text("PRÉNOM:", infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(prenomTruncated, infoX + 12, currentY);
    currentY += 3.5;
  }

  // 3. MATRICULE
  doc.setFont('helvetica', 'bold');
  doc.text("MATRICULE:", infoX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(selectedEtudiant.matricule || '-', infoX + 14, currentY);
  currentY += 3.5;

  // 4. NIVEAU - Taille de police réduite pour les noms longs
  const levelFontSize = (nom.length > 20) ? 4.5 : 5;
  doc.setFontSize(levelFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text("NIVEAU:", infoX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(selectedEtudiant.niveau || '-', infoX + 12, currentY);
  currentY += 3.5;

  // 5. FACULTÉ - Tronquer si nécessaire
  if (selectedEtudiant.faculte) {
    let faculteDisplay = selectedEtudiant.faculte;
    const faculteWidth = doc.getTextWidth(faculteDisplay);
    const maxFaculteWidth = infoWidth - 12 - 2; // Largeur disponible
    
    if (faculteWidth > maxFaculteWidth) {
      faculteDisplay = truncateTextSmart(faculteDisplay, 20);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text("FACULTÉ:", infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(faculteDisplay, infoX + 12, currentY);
    currentY += 3.5;
  }

  // 6. ANNÉE ACADÉMIQUE
  doc.setFont('helvetica', 'bold');
  doc.text("ANNÉE:", infoX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text("2024-2025", infoX + 10, currentY);
  currentY += 3.5;

  // 7. CODE QR - Taille réduite pour compenser l'espace du nom
  try {
    const qrContent = JSON.stringify({
      universite: "Université de Toliara",
      numero_inscription: selectedEtudiant.numero_inscription,
      matricule: selectedEtudiant.matricule,
      nom: nom,
      prenom: prenom,
      date_emission: new Date().toISOString().split('T')[0]
    });

    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      width: qrSize * 4,
      margin: 1,
      color: {
        dark: '#003366',
        light: '#FFFFFF'
      }
    });

    // Fond blanc pour le QR code
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'F');
    
    // Ajouter le QR code
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    
    // Légende sous le QR code
    doc.setFontSize(3.5);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'italic');
    doc.text("SCAN", qrX + qrSize / 2, qrY + qrSize + 1.5, { align: 'center' });

  } catch (error) {
    console.error("Erreur génération QR code:", error);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'F');
    doc.setFontSize(4);
    doc.setTextColor(150, 150, 150);
    doc.text("QR", qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
  }
  
  // 8. INFORMATIONS DE CONTACT (en bas)
  doc.setFontSize(4);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'italic');
  
  // À gauche : site web
  doc.text("www.univ-toliara.mg", margin + 5, cardHeight - 2.5);
  
  // À droite : email
  doc.text("contact@univ-toliara.mg", cardWidth - margin - 5, cardHeight - 2.5, { align: 'right' });

  // 9. BORDURE FINALE ET EFFETS
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.rect(0.5, 0.5, cardWidth - 1, cardHeight - 1);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.rect(0.7, 0.7, cardWidth - 1.4, cardHeight - 1.4);

  // Enregistrer le PDF
  doc.save(`carte-etudiant-${selectedEtudiant.matricule}-${new Date().getFullYear()}.pdf`);
};

  // Fonction pour obtenir le logo de la faculté
  const getLogoFaculte = (faculte) => {
    if (!faculte) return null;

    const faculteLower = faculte.toLowerCase();

    // Mapping des logos par faculté
    const logosMap = {
      // Sciences
      'sciences': logoFaculteSciences,
      'faculté des sciences': logoFaculteSciences,
      'faculte des sciences': logoFaculteSciences,
      'science': logoFaculteSciences,

      // Lettres
      // 'lettres': logoFaculteLettres,
      // 'faculté des lettres': logoFaculteLettres,
      // 'faculte des lettres': logoFaculteLettres,
      // 'lettres et sciences humaines': logoFaculteLettres,

      // Droit
      // 'droit': logoFaculteDroit,
      // 'faculté de droit': logoFaculteDroit,
      // 'faculte de droit': logoFaculteDroit,
      // 'droit et sciences politiques': logoFaculteDroit,

      // Médecine
      'médecine': logoFaculteMedecine,
      'medecine': logoFaculteMedecine,
      'faculté de médecine': logoFaculteMedecine,
      'faculte de medecine': logoFaculteMedecine,
      'santé': logoFaculteMedecine,

      // Économie
      // 'économie': logoFaculteEconomie,
      // 'economie': logoFaculteEconomie,
      // 'faculté des sciences économiques': logoFaculteEconomie,
      // 'faculte des sciences economiques': logoFaculteEconomie,
      // 'sciences économiques': logoFaculteEconomie,

      // École d'ingénieurs
      // 'ingénierie': logoEcoleIngenieurs,
      // 'ingenierie': logoEcoleIngenieurs,
      // 'école d\'ingénieurs': logoEcoleIngenieurs,
      // 'ecole d\'ingenieurs': logoEcoleIngenieurs,
      // 'génie': logoEcoleIngenieurs,

      // Institut de technologie
      // 'technologie': logoInstitutTechnologie,
      // 'institut de technologie': logoInstitutTechnologie,
      // 'iut': logoInstitutTechnologie,
    };

    // Chercher le logo correspondant
    for (const [key, logo] of Object.entries(logosMap)) {
      if (faculteLower.includes(key)) {
        return logo;
      }
    }

    // Logo par défaut (logo de l'université)
    return logoUnivToliara;
  };

// Générer le certificat de scolarité officiel en PDF
const genererCertificatScolaritePDF = async () => {
  if (!selectedEtudiant) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Logo de l'université - à remplacer par votre vrai logo
  doc.addImage(logoUnivToliara, 'PNG', margin, margin, 30, 30);

  // Logo de la faculté de l'étudiant - à droite
  const logoFaculte = getLogoFaculte(selectedEtudiant.faculte);
  if (logoFaculte) {
    const logoFaculteWidth = 30;
    const logoFaculteHeight = 30;
    const logoFaculteX = pageWidth - margin - logoFaculteWidth;
    const logoFaculteY = margin;
    doc.addImage(logoFaculte, 'PNG', logoFaculteX, logoFaculteY, logoFaculteWidth, logoFaculteHeight);
  }

  // CADRE SIMPLE POUR PHOTO 4x4 - en bas du logo de la faculté
  const photoWidth = 25; // Largeur du cadre photo en mm
  const photoHeight = 32; // Hauteur du cadre photo en mm
  const photoX = pageWidth - margin - photoWidth; // Même alignement à droite que le logo
  const photoY = margin + 35; // 5mm sous le logo (30mm + 5mm d'espace)

  // Dessiner le cadre simple de la photo
  doc.setDrawColor(0, 0, 0); // Couleur noire
  doc.setLineWidth(0.5); // Épaisseur moyenne
  doc.rect(photoX, photoY, photoWidth, photoHeight); // Cadre simple

  // Ajouter le texte "PHOTO 4x4" sous le cadre
  doc.setFontSize(6);
  doc.setFont('times', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text("PHOTO 4x4", photoX + photoWidth / 2, photoY + photoHeight + 3, { align: 'center' });

  // En-tête officiel
  doc.setFontSize(12);
  doc.setFont('times');
  doc.setTextColor(0, 0, 0);
  doc.text("REPOBLIKAN'I MADAGASIKARA", pageWidth / 2, margin + 5, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text("Fitiavana – Tanindrazana – Fandrosoana", pageWidth / 2, margin + 10, { align: 'center' });

  doc.setFontSize(8);
  const asteriskLine1 = "* * * * * * * * * * * * * * * * * * * * * *";
  doc.text(asteriskLine1, pageWidth / 2, margin + 13, { align: 'center' });

  // Ligne 1 du ministère
  doc.setFontSize(10);
  doc.text("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA", pageWidth / 2, margin + 18, { align: 'center' });

  // Ligne 2 du ministère
  doc.text("RECHERCHE SCIENTIFIQUE", pageWidth / 2, margin + 24, { align: 'center' });

  // Université
  doc.setFontSize(11);
  doc.setFont('times');
  doc.text("UNIVERSITE DE TOLIARA", pageWidth / 2, margin + 30, { align: 'center' });

  // Direction
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text("Direction des Systèmes d'Information et du Numérique", pageWidth / 2, margin + 35, { align: 'center' });
  doc.text("Service de la Scolarité Centrale", pageWidth / 2, margin + 40, { align: 'center' });

  // Titre principal
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text("CERTIFICAT DE LA SCOLARITE", pageWidth / 2, margin + 53, { align: 'center' });

  // Référence - CORRECTION: placé au centre en dessous du titre
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  const currentYear = new Date().getFullYear();
  const refText = `Ref :                    /${currentYear}/MEsupRes/U.U/DSIN/Sco.Cent`;
  doc.text(refText, pageWidth / 2, margin + 61, { align: 'center' });

  // Texte d'introduction - CORRECTION: position ajustée
  doc.setFontSize(10);
  doc.text("Le Directeur des Systèmes d'Information et du Numérique certifie par la présente que", margin, margin + 70);

  // Informations de l'étudiant
  let yPosition = margin + 80;

  // Mr/Mme/Mlle
  doc.setFont('times');
  let civilite = "Mr/Mme/Mlle";
  if (selectedEtudiant.sexe === 'F') {
    civilite = selectedEtudiant.statut_matrimonial === 'MARIÉ(E)' ? "Mme" : "Mlle";
  } else if (selectedEtudiant.sexe === 'M') {
    civilite = "Mr";
  }
  doc.text(`${civilite} :`, margin, yPosition);
  doc.setFont('times', 'normal');
  doc.text(`${selectedEtudiant.nom} ${selectedEtudiant.prenom}`, margin + 25, yPosition);
  yPosition += 10;

  // Date et lieu de naissance - SUR UNE LIGNE
  const formatDateNaissance = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const jour = date.getDate();
      const mois = date.toLocaleDateString('fr-FR', { month: 'long' });
      const annee = date.getFullYear();
      return `${jour} ${mois} ${annee}`;
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return dateString; // Retourne la date originale si erreur
    }
  };

  const dateNaissance = formatDateNaissance(selectedEtudiant.date_naissance);
  const lieuNaissance = selectedEtudiant.lieu_naissance || "";
  doc.setFont('times');
  doc.text(`Date et lieu de naissance : ${dateNaissance} à ${lieuNaissance}`, margin, yPosition);
  yPosition += 10;

  // CN (CIN) - SUR UNE LIGNE
  if (selectedEtudiant.cin) {
    doc.setFont('times');
    doc.text(`CN : ${selectedEtudiant.cin}`, margin, yPosition);
    yPosition += 10;
  }

  // Parents - SUR UNE LIGNE
  doc.setFont('times');
  doc.text(`Fils/Fille de : ${selectedEtudiant.nom_pere || "[Nom du père]"}`, margin, yPosition);
  yPosition += 10;

  doc.setFont('times');
  doc.text(`Et de : ${selectedEtudiant.nom_mere || "[Nom de la mère]"}`, margin, yPosition);
  yPosition += 10;

  // Information d'inscription
  doc.text("Est inscrit(e) régulièrement au sein de l'Université de Toliara pour l'Année Universitaire 2024-2025", margin, yPosition);
  yPosition += 10;

  // Liste des informations académiques - Format une seule colonne
  const infoAcademiques = [
    { label: "Sous le numéro d'inscription :", value: selectedEtudiant.numero_inscription || 'N/A' },
    { label: "Faculté/Ecole/Institut :", value: selectedEtudiant.faculte || 'N/A' },
    { label: "Domaine :", value: selectedEtudiant.domaine || 'N/A' },
    { label: "Mention :", value: selectedEtudiant.mention || 'N/A' },
    { label: "Parcours :", value: selectedEtudiant.parcours || 'N/A' },
    { label: "Grade :", value: selectedEtudiant.grade || 'N/A' },
    { label: "Niveau :", value: selectedEtudiant.niveau || 'N/A' }
  ];

  let currentY = yPosition;

  infoAcademiques.forEach((info) => {
    // Texte complet sur une ligne : label + valeur
    const fullText = `${info.label} ${info.value}`;

    // Si le texte est trop long, diviser en plusieurs lignes
    const maxWidth = pageWidth - 2 * margin;
    const textWidth = doc.getTextWidth(fullText);

    if (textWidth > maxWidth) {
      // Diviser le texte
      const words = fullText.split(' ');
      let line = '';
      let lineCount = 0;

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = doc.getTextWidth(testLine);

        if (testWidth <= maxWidth) {
          line = testLine;
        } else {
          if (lineCount === 0) {
            // Première ligne : label + début de la valeur
            doc.text(line, margin, currentY);
          } else {
            // Lignes suivantes : continuation de la valeur
            doc.text(line, margin + 20, currentY); // Indenter les lignes suivantes
          }
          line = word;
          lineCount++;
          currentY += 5;
        }
      }

      if (line) {
        if (lineCount === 0) {
          doc.text(line, margin, currentY);
        } else {
          doc.text(line, margin + 20, currentY); // Indenter les lignes suivantes
        }
      }
      currentY += 8;
    } else {
      // Texte tient sur une ligne
      doc.text(fullText, margin, currentY);
      currentY += 8;
    }
  });

  // Ligne de signature
  const signatureY = currentY + 2;
  doc.text("En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.", margin, signatureY);

  // Date et signature
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const dateSignatureY = signatureY + 10;
  // Texte complet sur une seule ligne
  doc.text(`Fait à Toliara, le ${dateStr}`, pageWidth - margin, dateSignatureY, { align: 'right' });

  // Code QR
  const qrSize = 25;
  const qrX = margin;
  const qrY = dateSignatureY + 10;

  try {
    // 1. Construisez la chaîne de données
    const qrContent = JSON.stringify({
      universite: "Université de Toliara",
      numero_inscription: selectedEtudiant.numero_inscription,
      matricule: selectedEtudiant.matricule,
      nom: selectedEtudiant.nom,
      prenom: selectedEtudiant.prenom,
      date_emission: new Date().toISOString().split('T')[0]
    });

    // 2. Générez l'image du QR code en Data URL (base64)
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      width: qrSize * 4,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // 3. Ajoutez l'image au PDF
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // 4. Ajoutez une légende (optionnel)
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("Code de vérification", qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });

  } catch (error) {
    console.error("Erreur lors de la génération du QR Code :", error);
    // Fallback simple en cas d'erreur
    doc.setFillColor(255, 255, 255);
    doc.rect(qrX, qrY, qrSize, qrSize, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("QR", qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
  }
  
  // Note de bas de page
  doc.setFontSize(7);
  doc.setFont('times', 'normal');
  const noteY = pageHeight - margin;
  doc.text("N.B : Un seul certificat de scolarité est délivré durant l'année universitaire en cours.", margin, noteY - 10);
  doc.text("Faire autant de copies que nécessaires suivies des certifications conformes par les autorités compétentes.", margin, noteY - 5);

  // Sauvegarder le PDF
  doc.save(`certificat-scolarite-${selectedEtudiant.matricule || selectedEtudiant.numero_inscription}.pdf`);
};

  // Prévisualiser la carte étudiante
  const previewCarteEtudiant = () => {
    if (!selectedEtudiant) return;
    genererCarteEtudiantPDF();
  };

  // Prévisualiser le certificat
  const previewCertificat = () => {
    if (!selectedEtudiant) return;
    genererCertificatScolaritePDF();
  };

  // Rafraîchir les données
  const refreshData = () => {
    fetchEtudiants();
    fetchStats();
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-primary">
            <FaUserGraduate className="me-2" />
            Liste des Étudiants
          </h1>
          <p className="text-muted">
            Consultation et gestion des étudiants - Génération de documents
          </p>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="row g-2">
                <div className="col-md-2">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </InputGroup>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={filterNiveau}
                    onChange={(e) => setFilterNiveau(e.target.value)}
                  >
                    <option value="">Tous niveaux</option>
                    {niveaux.map((niveau, index) => (
                      <option key={index} value={niveau}>{niveau}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={filterFaculte}
                    onChange={(e) => setFilterFaculte(e.target.value)}
                  >
                    <option value="">Toutes facultés</option>
                    {facultes.map((faculte, index) => (
                      <option key={index} value={faculte}>{faculte}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={filterMention}
                    onChange={(e) => setFilterMention(e.target.value)}
                  >
                    <option value="">Toutes mentions</option>
                    {mentions.map((mention, index) => (
                      <option key={index} value={mention}>{mention}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={filterBoursier}
                    onChange={(e) => setFilterBoursier(e.target.value)}
                  >
                    <option value="">Tous statuts</option>
                    <option value="OUI">Boursiers</option>
                    <option value="NON">Non boursiers</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="10">10 par page</option>
                    <option value="25">25 par page</option>
                    <option value="50">50 par page</option>
                    <option value="100">100 par page</option>
                  </Form.Select>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Button variant="outline-primary" onClick={handleSearch}>
                    <FaSearch className="me-2" /> Rechercher
                  </Button>
                  <Button variant="outline-secondary" className="ms-2" onClick={resetFilters}>
                    <FaFilter className="me-2" /> Réinitialiser
                  </Button>
                </div>
                <div>
                  <Badge bg="info">
                    {etudiants.length.toLocaleString()} étudiant(s) total
                  </Badge>
                  <Badge bg="primary" className="ms-2">
                    Filtrés: {filteredEtudiants.length.toLocaleString()}
                  </Badge>
                  <Badge bg="success" className="ms-2">
                    Boursiers: {etudiants.filter(e => e.boursier === 'OUI').length}
                  </Badge>
                </div>
                <div className="text-muted">
                  Page {currentPage} sur {totalPages}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="card-body">
          {error && (
            <Alert variant="danger" className="mb-4">
              <strong>Erreur:</strong> {error}
              <Button variant="outline-danger" size="sm" className="ms-3" onClick={refreshData}>
                Réessayer
              </Button>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Chargement des données...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead className="table-light">
                    <tr>
                      <th>Numéro</th>
                      <th>Étudiant</th>
                      <th>Statut</th>
                      <th>Niveau</th>
                      <th>Faculté</th>
                      <th>Mention</th>
                      <th className="text-center">Documents</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          {etudiants.length === 0 ? (
                            <>
                              <FaDatabase className="text-muted mb-3" size={48} />
                              <p className="text-muted">Aucun étudiant enregistré</p>
                              <p className="text-muted small">Utilisez le formulaire d'inscription pour ajouter des étudiants</p>
                            </>
                          ) : (
                            <>
                              {/* <FaSearch className="text-muted mb-3" size={48} /> */}
                              <p className="text-muted">Aucun étudiant trouvé avec ces filtres</p>
                              <Button variant="outline-primary" size="sm" onClick={resetFilters}>
                                Réinitialiser les filtres
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((etudiant) => {
                        const nomComplet = `${etudiant.nom} ${etudiant.prenom}`;

                        return (
                          <tr key={etudiant.id}>
                            <td>
                              <div className="font-monospace small">{etudiant.numero_inscription || 'N/A'}</div>
                              <div className="text-muted smaller">{etudiant.matricule}</div>
                            </td>
                            <td>
                              <div className="fw-medium">{nomComplet}</div>
                              {etudiant.cin && (
                                <div className="text-muted small">CIN: {etudiant.cin}</div>
                              )}
                            </td>
                            <td>
                              <Badge bg={etudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                                {etudiant.code_redoublement === 'N' ? 'Nouveau' : 'Redoublant'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={
                                etudiant.niveau && (
                                  etudiant.niveau.includes('1') ? 'primary' :
                                    etudiant.niveau.includes('2') ? 'info' :
                                      etudiant.niveau.includes('3') ? 'secondary' :
                                        etudiant.niveau.includes('Master') ? 'warning' :
                                          etudiant.niveau.includes('Doctorat') ? 'dark' : 'light'
                                ) || 'light'
                              }>
                                {etudiant.niveau || 'N/A'}
                              </Badge>
                            </td>
                            <td>
                              <div>{etudiant.faculte || 'N/A'}</div>
                              {etudiant.domaine && (
                                <div className="text-muted small">{etudiant.domaine}</div>
                              )}
                            </td>
                            <td>
                              {etudiant.mention ? (
                                <div>
                                  <small className="text-muted" style={{
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block'
                                  }}>
                                    {etudiant.mention}
                                  </small>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="btn-group btn-group-sm" role="group">
                                <Button
                                  variant="outline-info"
                                  onClick={() => openCardModal(etudiant)}
                                  title="Générer carte étudiante"
                                  size="sm"
                                >
                                  <FaIdCard />
                                </Button>
                                <Button
                                  variant="outline-success"
                                  onClick={() => openCertificatModal(etudiant)}
                                  title="Générer certificat de scolarité"
                                  size="sm"
                                >
                                  <FaFileAlt />
                                </Button>
                              </div>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-primary"
                                onClick={() => openDetailModal(etudiant)}
                                title="Voir détails"
                                size="sm"
                              >
                                <FaEye />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination>
                    <Pagination.First
                      onClick={() => paginate(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    />

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Pagination.Item
                          key={i}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    })}

                    <Pagination.Next
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => paginate(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Détails Étudiant */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Détails de l'étudiant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <div className="row">
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  <div className="bg-light rounded-circle border d-flex align-items-center justify-content-center mx-auto"
                    style={{ width: '150px', height: '150px' }}>
                    <span className="text-muted fs-1">
                      {selectedEtudiant.nom?.charAt(0)}{selectedEtudiant.prenom?.charAt(0)}
                    </span>
                  </div>
                </div>
                <h5 className="fw-bold">{selectedEtudiant.nom} {selectedEtudiant.prenom}</h5>
                <p className="text-muted">{selectedEtudiant.matricule}</p>

                <div className="mt-3">
                  <Badge bg="primary" className="me-2">{selectedEtudiant.niveau}</Badge>
                  <Badge bg={selectedEtudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                    {selectedEtudiant.code_redoublement === 'N' ? 'Inscrit' : 'Réinscrit'}
                  </Badge>
                </div>
              </div>

              <div className="col-md-8">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold">Informations personnelles</h6>
                    <dl className="row">
                      <dt className="col-sm-5">Numéro d'inscription</dt>
                      <dd className="col-sm-7">{selectedEtudiant.numero_inscription || 'N/A'}</dd>

                      <dt className="col-sm-5">Matricule</dt>
                      <dd className="col-sm-7">{selectedEtudiant.matricule}</dd>

                      {selectedEtudiant.date_naissance && (
                        <>
                          <dt className="col-sm-5">Date de naissance</dt>
                          <dd className="col-sm-7">{selectedEtudiant.date_naissance}</dd>
                        </>
                      )}

                      {selectedEtudiant.cin && (
                        <>
                          <dt className="col-sm-5">CIN</dt>
                          <dd className="col-sm-7">{selectedEtudiant.cin}</dd>
                        </>
                      )}

                      {selectedEtudiant.nationalite && (
                        <>
                          <dt className="col-sm-5">Nationalité</dt>
                          <dd className="col-sm-7">{selectedEtudiant.nationalite}</dd>
                        </>
                      )}
                    </dl>
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold">Informations académiques</h6>
                    <dl className="row">
                      {selectedEtudiant.faculte && (
                        <>
                          <dt className="col-sm-5">Faculté</dt>
                          <dd className="col-sm-7">{selectedEtudiant.faculte}</dd>
                        </>
                      )}

                      {selectedEtudiant.domaine && (
                        <>
                          <dt className="col-sm-5">Domaine</dt>
                          <dd className="col-sm-7">{selectedEtudiant.domaine}</dd>
                        </>
                      )}

                      <dt className="col-sm-5">Niveau</dt>
                      <dd className="col-sm-7">{selectedEtudiant.niveau}</dd>

                      {selectedEtudiant.mention && (
                        <>
                          <dt className="col-sm-5">Mention</dt>
                          <dd className="col-sm-7">{selectedEtudiant.mention}</dd>
                        </>
                      )}

                      {selectedEtudiant.annee_bacc && (
                        <>
                          <dt className="col-sm-5">Année du Bac</dt>
                          <dd className="col-sm-7">{selectedEtudiant.annee_bacc}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
          <Button variant="info" onClick={() => {
            setShowDetailModal(false);
            openCardModal(selectedEtudiant);
          }}>
            <FaIdCard className="me-2" /> Carte étudiante
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Carte Étudiante */}
      <Modal show={showCardModal} onHide={() => setShowCardModal(false)}>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>Carte étudiante</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <>
              <Alert variant="info">
                <h5 className="alert-heading">Générer la carte d'étudiant</h5>
                <p>Créer la carte d'identité étudiante pour :</p>
                <p className="fw-bold">{selectedEtudiant.nom} {selectedEtudiant.prenom}</p>
                <p className="mb-0">Matricule : {selectedEtudiant.matricule}</p>
              </Alert>

              <div className="text-center mb-4">
                <div className="card mx-auto" style={{ width: '86mm', height: '54mm', border: '2px solid #0066cc' }}>
                  <div className="card-header bg-primary text-white py-1">
                    <h6 className="mb-0">UNIVERSITÉ DE TOLIARA</h6>
                  </div>
                  <div className="card-body p-2">
                    <div className="row">
                      <div className="col-4">
                        <div className="bg-light border d-flex align-items-center justify-content-center"
                          style={{ height: '30mm' }}>
                          <small className="text-muted">PHOTO</small>
                        </div>
                      </div>
                      <div className="col-8">
                        <h6 className="text-primary">CARTE D'ÉTUDIANT</h6>
                        <div className="small">
                          <div><strong>Nom:</strong> {selectedEtudiant.nom} {selectedEtudiant.prenom}</div>
                          <div><strong>Matricule:</strong> {selectedEtudiant.matricule}</div>
                          <div><strong>Niveau:</strong> {selectedEtudiant.niveau}</div>
                          {selectedEtudiant.faculte && (
                            <div><strong>Faculté:</strong> {selectedEtudiant.faculte}</div>
                          )}
                          {selectedEtudiant.mention && (
                            <div><strong>Mention:</strong> {selectedEtudiant.mention}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="bg-dark" style={{ height: '3mm' }}></div>
                      <small className="text-muted">Valable 2024-2025</small>
                    </div>
                  </div>
                </div>
                <small className="text-muted mt-2 d-block">Format carte de crédit (86mm x 54mm)</small>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCardModal(false)}>
            Annuler
          </Button>
          <Button variant="info" onClick={previewCarteEtudiant}>
            <FaEye className="me-2" /> Prévisualiser
          </Button>
          <Button variant="primary" onClick={genererCarteEtudiantPDF}>
            <FaDownload className="me-2" /> Télécharger PDF
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Certificat de Scolarité */}
      <Modal show={showCertificatModal} onHide={() => setShowCertificatModal(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>Certificat de scolarité</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <>
              <div className="border p-4 bg-light">
                <div className="text-center mb-4">
                  <h4 className="text-primary">REPOBLIKAN'I MADAGASIKARA</h4>
                  <p className="text-muted">Fitiavana – Tanindrazana – Fandrosoana</p>

                  <h5>MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE</h5>
                  <h4 className="text-primary">UNIVERSITE DE TOLIARA</h4>
                  <p>Direction des Systèmes d'Information et du Numérique</p>
                  <p>Service de la Scolarité Centrale</p>

                  <h3 className="mt-4">CERTIFICAT DE LA SCOLARITE</h3>
                </div>

                <hr className="border-primary" />

                <div className="mt-4">
                  <p>Le Directeur des Systèmes d'Information et du Numérique certifie par la présente que</p>

                  <div className="ms-4 mt-3">
                    <p><strong>Mr/Mme/Mlle :</strong> {selectedEtudiant.nom} {selectedEtudiant.prenom}</p>

                    {selectedEtudiant.date_naissance && (
                      <p><strong>Date et lieu de naissance :</strong> {selectedEtudiant.date_naissance}</p>
                    )}

                    {selectedEtudiant.cin && (
                      <p><strong>CN :</strong> {selectedEtudiant.cin}</p>
                    )}

                    <p><strong>Fils/Fille de :</strong> [Nom du père]</p>
                    <p><strong>Et de :</strong> [Nom de la mère]</p>
                  </div>

                  <p className="mt-3">
                    Est inscrit(e) régulièrement au sein de l'Université de Toliara pour l'Année Universitaire 2024-2025
                  </p>

                  <div className="ms-4 mt-3">
                    <p><strong>Sous le numéro d'inscription :</strong> {selectedEtudiant.numero_inscription || 'N/A'}</p>
                    {selectedEtudiant.faculte && (
                      <p><strong>Faculté/Ecole/Institut :</strong> {selectedEtudiant.faculte}</p>
                    )}
                    {selectedEtudiant.domaine && (
                      <p><strong>Domaine :</strong> {selectedEtudiant.domaine}</p>
                    )}
                    {selectedEtudiant.mention && (
                      <p><strong>Mention :</strong> {selectedEtudiant.mention}</p>
                    )}
                    <p><strong>Niveau :</strong> {selectedEtudiant.niveau || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p>En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.</p>

                  <div className="row mt-5">
                    <div className="col-6">
                      <div className="border p-2 text-center" style={{ width: '60px', height: '60px' }}>
                        <small className="text-muted">QR Code</small>
                      </div>
                    </div>
                    <div className="col-6 text-end">
                      <p>Fait à Toliara, le {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted">
                    <strong>N.B :</strong> Un seul certificat de scolarité est délivré durant l'année universitaire en cours.
                    Faire autant de copies que nécessaires suivies des certifications conformes par les autorités compétentes.
                  </small>
                </div>
              </div>

              <div className="alert alert-info mt-3">
                <FaUniversity className="me-2" />
                Document officiel au format A4 avec QR Code de vérification
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCertificatModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={previewCertificat}>
            <FaEye className="me-2" /> Prévisualiser
          </Button>
          <Button variant="primary" onClick={genererCertificatScolaritePDF}>
            <FaDownload className="me-2" /> Télécharger PDF
          </Button>
          <Button variant="warning" onClick={() => window.print()}>
            <FaPrint className="me-2" /> Imprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}