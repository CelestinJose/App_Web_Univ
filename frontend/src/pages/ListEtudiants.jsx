import React, { useState, useEffect } from "react";
import {
  FaSearch, FaIdCard, FaFileAlt, FaPrint, FaDownload,
  FaEye, FaFilter, FaUserGraduate, FaUniversity, FaDatabase,
  FaBook, FaSync
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
import { etudiantApi, faculteApi, domaineApi, mentionApi } from "../api";
import QRCode from 'qrcode';

// Importez votre logo ici (assurez-vous d'avoir le fichier dans votre projet)
import logoUnivToliara from '../assets/logo-univ-toliara.png';
// Import des logos des facultés
import logoFaculteSciences from '../assets/logos/faculte-sciences.png';
import logoFaculteMedecine from '../assets/logos/faculte-medecine.png';

export default function ListEtudiants() {
  // État pour les données
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // États pour les données de référence (API)
  const [facultes, setFacultes] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterFaculte, setFilterFaculte] = useState("");
  const [filterDomaine, setFilterDomaine] = useState("");
  const [filterMention, setFilterMention] = useState("");
  const [filterBoursier, setFilterBoursier] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // États pour les modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCertificatModal, setShowCertificatModal] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);

  // FONCTIONS DE MAPPING AMÉLIORÉES
  const getNomFaculte = (faculte) => {
    if (!faculte) return "N/A";
    
    // Si faculte est déjà une string (nom)
    if (typeof faculte === 'string') {
      return faculte;
    }
    
    // Si c'est un ID numérique, chercher dans les références
    if (typeof faculte === 'number') {
      const fac = facultes.find(f => f.id === faculte);
      return fac ? fac.nom_faculte || fac.nom || fac.libelle || fac.name || `Faculté ${faculte}` : `Faculté ${faculte}`;
    }
    
    // Si c'est un objet avec propriété 'nom' ou 'nom_faculte'
    if (faculte && typeof faculte === 'object') {
      return faculte.nom_faculte || faculte.nom || faculte.libelle || faculte.name || 
             faculte.nom_complet || faculte.toString() || "N/A";
    }
    
    return "N/A";
  };

  const getNomDomaine = (domaine) => {
    if (!domaine) return "N/A";
    
    if (typeof domaine === 'string') {
      return domaine;
    }
    
    if (typeof domaine === 'number') {
      const dom = domaines.find(d => d.id === domaine);
      return dom ? dom.nom_domaine || dom.nom || dom.libelle || dom.name || `Domaine ${domaine}` : `Domaine ${domaine}`;
    }
    
    if (domaine && typeof domaine === 'object') {
      return domaine.nom_domaine || domaine.nom || domaine.libelle || domaine.name || 
             domaine.toString() || "N/A";
    }
    
    return "N/A";
  };

  const getNomMention = (mention) => {
    if (!mention) return "N/A";
    
    if (typeof mention === 'string') {
      return mention;
    }
    
    if (typeof mention === 'number') {
      const men = mentions.find(m => m.id === mention);
      return men ? men.nom_mention || men.nom || men.libelle || men.name || `Mention ${mention}` : `Mention ${mention}`;
    }
    
    if (mention && typeof mention === 'object') {
      return mention.nom_mention || mention.nom || mention.libelle || mention.name || 
             mention.toString() || "N/A";
    }
    
    return "N/A";
  };

  // Fonction pour obtenir le logo avec les IDs
  const getLogoFaculte = (faculte) => {
    if (!faculte) return logoUnivToliara;
    
    let faculteNom = "";
    
    // Récupérer le nom de la faculté
    if (typeof faculte === 'string') {
      faculteNom = faculte;
    } else if (typeof faculte === 'number') {
      faculteNom = getNomFaculte(faculte);
    } else if (faculte && typeof faculte === 'object') {
      faculteNom = faculte.nom || faculte.nom_faculte || faculte.toString();
    }
    
    const faculteLower = String(faculteNom).toLowerCase();
    
    const logosMap = {
      'sciences': logoFaculteSciences,
      'faculté des sciences': logoFaculteSciences,
      'faculte des sciences': logoFaculteSciences,
      'science': logoFaculteSciences,
      'médecine': logoFaculteMedecine,
      'medecine': logoFaculteMedecine,
      'faculté de médecine': logoFaculteMedecine,
      'faculte de medecine': logoFaculteMedecine,
      'santé': logoFaculteMedecine,
    };
    
    for (const [key, logo] of Object.entries(logosMap)) {
      if (faculteLower.includes(key)) {
        return logo;
      }
    }
    
    return logoUnivToliara;
  };

  // Charger les données depuis l'API
  useEffect(() => {
    fetchEtudiants();
    fetchStats();
    fetchReferences();
  }, []);

  // Fonction pour charger les étudiants
  const fetchEtudiants = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Chargement des étudiants avec params:", params);
      const response = await etudiantApi.getEtudiants(params);
      console.log("Données reçues:", response.data);

      // DEBUG: Vérifiez le premier étudiant
      if (response.data && Array.isArray(response.data.results) && response.data.results.length > 0) {
        const premierEtudiant = response.data.results[0];
        console.log("=== DEBUG PREMIER ÉTUDIANT ===");
        console.log("Structure complète:", premierEtudiant);
        console.log("faculte:", premierEtudiant.faculte);
        console.log("domaine:", premierEtudiant.domaine);
        console.log("mention:", premierEtudiant.mention);
        console.log("Type de faculte:", typeof premierEtudiant.faculte);
        console.log("=== FIN DEBUG ===");
      }

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

  // Fonction pour charger les références (facultés, domaines, mentions)
  const fetchReferences = async () => {
    setLoadingReferences(true);
    try {
      console.log("Chargement des références...");
      
      // Charger les facultés
      const facultesResponse = await faculteApi.getFacultes();
      console.log("Facultés reçues:", facultesResponse.data);
      if (facultesResponse.data && Array.isArray(facultesResponse.data)) {
        setFacultes(facultesResponse.data);
      } else if (Array.isArray(facultesResponse.data.results)) {
        setFacultes(facultesResponse.data.results);
      } else if (facultesResponse.data && typeof facultesResponse.data === 'object') {
        // Si c'est un objet avec une propriété results
        const data = facultesResponse.data.results || facultesResponse.data;
        if (Array.isArray(data)) {
          setFacultes(data);
        }
      }
      
      // Charger les domaines
      const domainesResponse = await domaineApi.getDomaines();
      console.log("Domaines reçus:", domainesResponse.data);
      if (domainesResponse.data && Array.isArray(domainesResponse.data)) {
        setDomaines(domainesResponse.data);
      } else if (Array.isArray(domainesResponse.data.results)) {
        setDomaines(domainesResponse.data.results);
      } else if (domainesResponse.data && typeof domainesResponse.data === 'object') {
        const data = domainesResponse.data.results || domainesResponse.data;
        if (Array.isArray(data)) {
          setDomaines(data);
        }
      }
      
      // Charger les mentions
      const mentionsResponse = await mentionApi.getMentions();
      console.log("Mentions reçues:", mentionsResponse.data);
      if (mentionsResponse.data && Array.isArray(mentionsResponse.data)) {
        setMentions(mentionsResponse.data);
      } else if (Array.isArray(mentionsResponse.data.results)) {
        setMentions(mentionsResponse.data.results);
      } else if (mentionsResponse.data && typeof mentionsResponse.data === 'object') {
        const data = mentionsResponse.data.results || mentionsResponse.data;
        if (Array.isArray(data)) {
          setMentions(data);
        }
      }
      
      console.log("Références chargées:");
      console.log("Facultés:", facultes.length);
      console.log("Domaines:", domaines.length);
      console.log("Mentions:", mentions.length);
      
      // Si aucune donnée, créer des données factices pour le débogage
      if (facultes.length === 0 || domaines.length === 0 || mentions.length === 0) {
        console.warn("Aucune donnée de référence chargée, création de données factices");
        
        const facs = [
          { id: 1, nom_faculte: "Faculté des Sciences", nom: "Faculté des Sciences" },
          { id: 2, nom_faculte: "Faculté de Médecine", nom: "Faculté de Médecine" },
          { id: 3, nom_faculte: "Faculté de Droit", nom: "Faculté de Droit" },
          { id: 4, nom_faculte: "Faculté des Lettres", nom: "Faculté des Lettres" }
        ];
        
        const doms = [
          { id: 1, nom_domaine: "Sciences Exactes", nom: "Sciences Exactes" },
          { id: 2, nom_domaine: "Sciences de la Vie", nom: "Sciences de la Vie" },
          { id: 3, nom_domaine: "Sciences Humaines", nom: "Sciences Humaines" },
          { id: 4, nom_domaine: "Sciences Sociales", nom: "Sciences Sociales" }
        ];
        
        const mens = [
          { id: 1, nom_mention: "Mathématiques", nom: "Mathématiques" },
          { id: 2, nom_mention: "Informatique", nom: "Informatique" },
          { id: 3, nom_mention: "Physique", nom: "Physique" },
          { id: 4, nom_mention: "Chimie", nom: "Chimie" },
          { id: 5, nom_mention: "Biologie", nom: "Biologie" },
          { id: 6, nom_mention: "Médecine", nom: "Médecine" }
        ];
        
        if (facultes.length === 0) setFacultes(facs);
        if (domaines.length === 0) setDomaines(doms);
        if (mentions.length === 0) setMentions(mens);
      }
      
    } catch (error) {
      console.error("Erreur lors du chargement des références:", error);
      
      // Solution de secours : créer des données factices pour le débogage
      const facs = [
        { id: 1, nom_faculte: "Faculté des Sciences", nom: "Faculté des Sciences" },
        { id: 2, nom_faculte: "Faculté de Médecine", nom: "Faculté de Médecine" },
        { id: 3, nom_faculte: "Faculté de Droit", nom: "Faculté de Droit" },
        { id: 4, nom_faculte: "Faculté des Lettres", nom: "Faculté des Lettres" }
      ];
      
      const doms = [
        { id: 1, nom_domaine: "Sciences Exactes", nom: "Sciences Exactes" },
        { id: 2, nom_domaine: "Sciences de la Vie", nom: "Sciences de la Vie" },
        { id: 3, nom_domaine: "Sciences Humaines", nom: "Sciences Humaines" },
        { id: 4, nom_domaine: "Sciences Sociales", nom: "Sciences Sociales" }
      ];
      
      const mens = [
        { id: 1, nom_mention: "Mathématiques", nom: "Mathématiques" },
        { id: 2, nom_mention: "Informatique", nom: "Informatique" },
        { id: 3, nom_mention: "Physique", nom: "Physique" },
        { id: 4, nom_mention: "Chimie", nom: "Chimie" },
        { id: 5, nom_mention: "Biologie", nom: "Biologie" },
        { id: 6, nom_mention: "Médecine", nom: "Médecine" }
      ];
      
      setFacultes(facs);
      setDomaines(doms);
      setMentions(mens);
      console.warn("Utilisation de données factices pour le débogage");
    } finally {
      setLoadingReferences(false);
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
    if (filterDomaine) params.domaine = filterDomaine;
    if (filterMention) params.mention = filterMention;
    if (filterBoursier) params.boursier = filterBoursier;

    setCurrentPage(1);
    fetchEtudiants(params);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setFilterNiveau("");
    setFilterFaculte("");
    setFilterDomaine("");
    setFilterMention("");
    setFilterBoursier("");
    setCurrentPage(1);
    fetchEtudiants();
  };

  // Options pour les filtres (dynamiques depuis les étudiants)
  const niveaux = [...new Set(etudiants.map(e => e.niveau).filter(Boolean))];

  // Filtrer les étudiants localement
  const filteredEtudiants = etudiants.filter(etudiant => {
    const matchesSearch =
      (etudiant.nom && etudiant.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.prenom && etudiant.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.matricule && etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.numero_inscription && etudiant.numero_inscription.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.mention && etudiant.mention.toString().toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesNiveau = filterNiveau ? etudiant.niveau === filterNiveau : true;
    const matchesFaculte = filterFaculte ? getNomFaculte(etudiant.faculte) === filterFaculte : true;
    const matchesDomaine = filterDomaine ? getNomDomaine(etudiant.domaine) === filterDomaine : true;
    const matchesMention = filterMention ? getNomMention(etudiant.mention) === filterMention : true;
    const matchesBoursier = filterBoursier ? etudiant.boursier === filterBoursier : true;

    return matchesSearch && matchesNiveau && matchesFaculte && matchesDomaine && matchesMention && matchesBoursier;
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

  // Fonction helper pour le fallback avec initiales
  const drawInitialsFallback = (doc, etudiant, x, y, width, height) => {
    // Fond du cercle
    doc.setFillColor(240, 240, 240);
    doc.circle(x + width / 2, y + height / 2, (width - 4) / 2, 'F');

    // Bordure du cercle
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.8);
    doc.circle(x + width / 2, y + height / 2, (width - 4) / 2);

    // Calculer les initiales
    const nomInitial = etudiant.nom?.charAt(0)?.toUpperCase() || '';
    const prenomInitial = etudiant.prenom?.charAt(0)?.toUpperCase() || '';
    const initials = nomInitial + prenomInitial || '??';

    // Ajuster la taille de police selon la longueur
    const fontSize = initials.length > 1 ? 9 : 10;
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text(initials, x + width / 2, y + height / 2 + 1, { align: 'center' });
  };

  // Fonction pour obtenir le chemin correct de la photo
  const getCorrectPhotoPath = (photoPath) => {
    if (!photoPath) return null;

    console.log("Chemin photo original:", photoPath);

    // Si c'est déjà une URL complète (http:// ou https://)
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      // Extraire le chemin après le domaine
      const urlObj = new URL(photoPath);
      const path = urlObj.pathname;

      // Si le chemin commence par /media/, le retourner
      if (path.startsWith('/media/')) {
        return path;
      }

      // Sinon, ajouter /media/ devant
      return `/media/${path.startsWith('/') ? path.substring(1) : path}`;
    }

    // Si c'est un chemin commençant par /media/
    if (photoPath.startsWith('/media/')) {
      return photoPath;
    }

    // Si c'est un chemin commençant par media/ (sans slash)
    if (photoPath.startsWith('media/')) {
      return `/${photoPath}`;
    }

    // Si c'est un chemin dans Etudiant/
    if (photoPath.startsWith('Etudiant/') || photoPath.includes('Etudiant/')) {
      return `/media/${photoPath}`;
    }

    // Par défaut, considérer que c'est dans media/Etudiant/
    return `/media/Etudiant/${photoPath}`;
  };

  // Fonction pour obtenir l'URL complète de la photo
  const getPhotoUrl = (photoPath) => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const correctPath = getCorrectPhotoPath(photoPath);

    if (!correctPath) return null;

    // Assurer qu'il n'y a pas de double slash
    const url = `${baseUrl}${correctPath}`;
    console.log("URL photo générée:", url);
    return url;
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
    const margin = 2;

    // Zone de la photo
    const photoWidth = 20;
    const photoHeight = 25;
    const photoX = margin + 2;
    const photoY = 16;

    // Zone des informations
    const infoX = photoX + photoWidth + 3;
    const infoWidth = 38;

    // Zone QR code
    const qrSize = 16;
    const qrX = infoX + infoWidth + 2;
    const qrY = photoY + 2;

    // 1. FOND DE LA CARTE
    doc.setFillColor(230, 240, 255);
    doc.rect(0, 0, cardWidth, cardHeight, 'F');

    // Bande supérieure
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, cardWidth, 10, 'F');

    // Bande inférieure
    doc.setFillColor(0, 102, 204);
    doc.rect(0, cardHeight - 8, cardWidth, 8, 'F');

    // 2. LOGO UNIVERSITÉ
    try {
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

    // 4. LOGO DE LA FACULTÉ
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

    // 5. CADRE PHOTO
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 1, 1, 'F');
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.3);
    doc.roundedRect(photoX + 1, photoY + 1, photoWidth - 2, photoHeight - 2, 0.5, 0.5);

    // Photo de l'étudiant
    if (selectedEtudiant.photo) {
      try {
        const photoUrl = getPhotoUrl(selectedEtudiant.photo);
        console.log("URL utilisée pour PDF:", photoUrl);

        if (photoUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          const loadImage = new Promise((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Échec du chargement de l\'image'));
            img.src = photoUrl;
            setTimeout(() => reject(new Error('Timeout de chargement')), 2000);
          });

          await loadImage;
          doc.addImage(img, 'JPEG', photoX + 2, photoY + 2, photoWidth - 4, photoHeight - 4, undefined, 'FAST');
        }
      } catch (error) {
        console.warn("Impossible de charger la photo de l'étudiant:", error);
        drawInitialsFallback(doc, selectedEtudiant, photoX, photoY, photoWidth, photoHeight);
      }
    } else {
      drawInitialsFallback(doc, selectedEtudiant, photoX, photoY, photoWidth, photoHeight);
    }

    doc.setFontSize(5);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text("PHOTO", photoX + photoWidth / 2, photoY + photoHeight - 2, { align: 'center' });

    // 6. ZONE DES INFORMATIONS
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

    // NOM
    const nom = selectedEtudiant.nom?.toUpperCase() || '';
    const prenom = selectedEtudiant.prenom || '';
    const nomToDisplay = nom.length > 20 ? nom.substring(0, 20) + '...' : nom;

    doc.setFont('helvetica', 'bold');
    doc.text("NOM:", infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(nomToDisplay, infoX + 8, currentY);
    currentY += 3.5;

    // PRÉNOM (si le nom n'est pas tronqué)
    if (nom.length <= 20 && prenom) {
      const prenomDisplay = prenom.length > 15 ? prenom.substring(0, 15) + '...' : prenom;
      doc.setFont('helvetica', 'bold');
      doc.text("PRÉNOM:", infoX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(prenomDisplay, infoX + 12, currentY);
      currentY += 3.5;
    }

    // MATRICULE
    doc.setFont('helvetica', 'bold');
    doc.text("MATRICULE:", infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedEtudiant.matricule || '-', infoX + 14, currentY);
    currentY += 3.5;

    // NIVEAU
    doc.setFont('helvetica', 'bold');
    doc.text("NIVEAU:", infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedEtudiant.niveau || '-', infoX + 12, currentY);
    currentY += 3.5;

    // FACULTÉ
    const faculteNom = getNomFaculte(selectedEtudiant.faculte);
    if (faculteNom) {
      const faculteDisplay = faculteNom.length > 20
        ? faculteNom.substring(0, 20) + '...'
        : faculteNom;

      doc.setFont('helvetica', 'bold');
      doc.text("FACULTÉ:", infoX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(faculteDisplay, infoX + 12, currentY);
      currentY += 3.5;
    }

    // ANNÉE ACADÉMIQUE
    doc.setFont('helvetica', 'bold');
    doc.text("ANNÉE:", infoX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text("2024-2025", infoX + 10, currentY);
    currentY += 3.5;

    // 7. CODE QR
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

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'F');
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

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

    // 8. INFORMATIONS DE CONTACT
    doc.setFontSize(4);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'italic');
    doc.text("www.univ-toliara.mg", margin + 5, cardHeight - 2.5);
    doc.text("contact@univ-toliara.mg", cardWidth - margin - 5, cardHeight - 2.5, { align: 'right' });

    // 9. BORDURE FINALE
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.rect(0.5, 0.5, cardWidth - 1, cardHeight - 1);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(0.7, 0.7, cardWidth - 1.4, cardHeight - 1.4);

    // Enregistrer le PDF
    doc.save(`carte-etudiant-${selectedEtudiant.matricule}-${new Date().getFullYear()}.pdf`);
  };
  
  const getGradeFromNiveau = (niveau) => {
    if (!niveau) return "N/A";

    const niveauLower = niveau.toLowerCase();

    if (niveauLower.includes("licence") || niveauLower.match(/\bL\d\b/i)) {
      return "Licence";
    }

    if (niveauLower.includes("master") || niveauLower.match(/\bM\d\b/i)) {
      return "Master";
    }

    if (niveauLower.includes("doctorat") || niveauLower.includes("phd")) {
      return "Doctorat";
    }

    return "N/A";
  };

  const getParcours = (parcours, mention) => {
    // Si parcours est défini et différent de 'N/A', on le renvoie
    if (parcours && parcours !== 'N/A') return parcours;

    // Si mention est un objet avec la propriété 'nom', on renvoie le nom
    if (mention && typeof mention === 'object' && mention.nom) return mention.nom;

    // Si mention est une chaîne, on la renvoie
    if (mention && typeof mention === 'string' && mention !== 'N/A') return mention;

    // Sinon N/A
    return 'N/A';
  };

  // Générer le certificat de scolarité officiel en PDF
  const genererCertificatScolaritePDF = async () => {
    if (!selectedEtudiant) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Logo de l'université
    doc.addImage(logoUnivToliara, 'PNG', margin, margin, 30, 30);

    // Logo de la faculté
    const logoFaculte = getLogoFaculte(selectedEtudiant.faculte);
    if (logoFaculte) {
      doc.addImage(logoFaculte, 'PNG', pageWidth - margin - 30, margin, 30, 30);
    }

    // Cadre photo
    const photoWidth = 25;
    const photoHeight = 32;
    const photoX = pageWidth - margin - photoWidth;
    const photoY = margin + 35;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoWidth, photoHeight);

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
    doc.text("Fitiavana – Tanindrazana – Fandrosoana", pageWidth / 2, margin + 10, { align: 'center' });

    doc.setFontSize(8);
    doc.text("* * * * * * * * * * * * * * * * * * * * * *", pageWidth / 2, margin + 13, { align: 'center' });

    doc.setFontSize(10);
    doc.text("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA", pageWidth / 2, margin + 18, { align: 'center' });
    doc.text("RECHERCHE SCIENTIFIQUE", pageWidth / 2, margin + 24, { align: 'center' });

    doc.setFontSize(11);
    doc.text("UNIVERSITE DE TOLIARA", pageWidth / 2, margin + 30, { align: 'center' });

    doc.setFontSize(9);
    doc.text("Direction des Systèmes d'Information et du Numérique", pageWidth / 2, margin + 35, { align: 'center' });
    doc.text("Service de la Scolarité Centrale", pageWidth / 2, margin + 40, { align: 'center' });

    // Titre principal
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text("CERTIFICAT DE LA SCOLARITE", pageWidth / 2, margin + 53, { align: 'center' });

    // Référence
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    const currentYear = new Date().getFullYear();
    const refText = `Ref :                    /${currentYear}/MEsupRes/U.U/DSIN/Sco.Cent`;
    doc.text(refText, pageWidth / 2, margin + 61, { align: 'center' });

    // Texte d'introduction
    doc.setFontSize(10);
    doc.text("Le Directeur des Systèmes d'Information et du Numérique certifie par la présente que", margin, margin + 70);

    // Informations de l'étudiant
    let yPosition = margin + 80;

    // Civilité
    let civilite = "Mr/Mme/Mlle";
    if (selectedEtudiant.sexe === 'F') {
      civilite = selectedEtudiant.statut_matrimonial === 'MARIÉ(E)' ? "Mme" : "Mlle";
    } else if (selectedEtudiant.sexe === 'M') {
      civilite = "Mr";
    }
    doc.text(`${civilite} :`, margin, yPosition);
    doc.text(`${selectedEtudiant.nom} ${selectedEtudiant.prenom}`, margin + 25, yPosition);
    yPosition += 10;

    // Date et lieu de naissance
    const formatDateNaissance = (dateString) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        const jour = date.getDate();
        const mois = date.toLocaleDateString('fr-FR', { month: 'long' });
        const annee = date.getFullYear();
        return `${jour} ${mois} ${annee}`;
      } catch (error) {
        return dateString;
      }
    };

    const dateNaissance = formatDateNaissance(selectedEtudiant.date_naissance);
    const lieuNaissance = selectedEtudiant.lieu_naissance || "";
    doc.text(`Date et lieu de naissance : ${dateNaissance} à ${lieuNaissance}`, margin, yPosition);
    yPosition += 10;

    // CIN
    if (selectedEtudiant.cin) {
      doc.text(`CN : ${selectedEtudiant.cin}`, margin, yPosition);
      yPosition += 10;
    }

    // Parents
    doc.text(`Fils/Fille de : ${selectedEtudiant.nom_pere || "[Nom du père]"}`, margin, yPosition);
    yPosition += 10;

    doc.text(`Et de : ${selectedEtudiant.nom_mere || "[Nom de la mère]"}`, margin, yPosition);
    yPosition += 10;

    // Information d'inscription
    doc.text("Est inscrit(e) régulièrement au sein de l'Université de Toliara pour l'Année Universitaire 2024-2025", margin, yPosition);
    yPosition += 10;

    // Informations académiques
    const infoAcademiques = [
      { label: "Faculté/Ecole/Institut :", value: getNomFaculte(selectedEtudiant.faculte) },
      { label: "Domaine :", value: getNomDomaine(selectedEtudiant.domaine) },
      { label: "Mention :", value: getNomMention(selectedEtudiant.mention) },
      { label: "Parcours :", value: getNomMention(selectedEtudiant.mention) },
      { label: "Grade :", value: getGradeFromNiveau(selectedEtudiant.niveau) },
      { label: "Niveau :", value: selectedEtudiant.niveau || 'N/A' }
    ];

    let currentY = yPosition;
    infoAcademiques.forEach((info) => {
      const fullText = `${info.label} ${info.value}`;
      doc.text(fullText, margin, currentY);
      currentY += 8;
    });

    // Signature
    const signatureY = currentY + 2;
    doc.text("En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.", margin, signatureY);

    // Date
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const dateSignatureY = signatureY + 10;
    doc.text(`Fait à Toliara, le ${dateStr}`, pageWidth - margin, dateSignatureY, { align: 'right' });

    // Code QR
    const qrSize = 25;
    const qrX = margin;
    const qrY = dateSignatureY + 10;

    try {
      const qrContent = JSON.stringify({
        universite: "Université de Toliara",
        numero_inscription: selectedEtudiant.numero_inscription,
        matricule: selectedEtudiant.matricule,
        nom: selectedEtudiant.nom,
        prenom: selectedEtudiant.prenom,
        date_emission: new Date().toISOString().split('T')[0]
      });

      const qrDataUrl = await QRCode.toDataURL(qrContent, {
        width: qrSize * 4,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("Code de vérification", qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });

    } catch (error) {
      console.error("Erreur lors de la génération du QR Code :", error);
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
    fetchReferences();
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
                    disabled={loadingReferences}
                  >
                    <option value="">Toutes facultés</option>
                    {facultes.map((faculte, index) => (
                      <option key={index} value={faculte.nom_faculte || faculte.nom}>
                        {faculte.nom_faculte || faculte.nom}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={filterDomaine}
                    onChange={(e) => setFilterDomaine(e.target.value)}
                    disabled={loadingReferences}
                  >
                    <option value="">Tous domaines</option>
                    {domaines.map((domaine, index) => (
                      <option key={index} value={domaine.nom_domaine || domaine.nom}>
                        {domaine.nom_domaine || domaine.nom}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Form.Select
                    value={filterMention}
                    onChange={(e) => setFilterMention(e.target.value)}
                    disabled={loadingReferences}
                  >
                    <option value="">Toutes mentions</option>
                    {mentions.map((mention, index) => (
                      <option key={index} value={mention.nom_mention || mention.nom}>
                        {mention.nom_mention || mention.nom}
                      </option>
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
                  <Button variant="outline-info" className="ms-2" onClick={refreshData}>
                    <FaSync className="me-2" /> Actualiser
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

          {loading || loadingReferences ? (
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
                      <th>Domaine</th>
                      <th>Mention</th>
                      <th className="text-center">Documents</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-5">
                          {etudiants.length === 0 ? (
                            <>
                              <FaDatabase className="text-muted mb-3" size={48} />
                              <p className="text-muted">Aucun étudiant enregistré</p>
                              <p className="text-muted small">Utilisez le formulaire d'inscription pour ajouter des étudiants</p>
                            </>
                          ) : (
                            <>
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
                              {loadingReferences ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                getNomFaculte(etudiant.faculte)
                              )}
                            </td>
                            <td>
                              {loadingReferences ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                getNomDomaine(etudiant.domaine)
                              )}
                            </td>
                            <td>
                              {loadingReferences ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                getNomMention(etudiant.mention)
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
                      <dt className="col-sm-5">Faculté</dt>
                      <dd className="col-sm-7">{getNomFaculte(selectedEtudiant.faculte)}</dd>

                      <dt className="col-sm-5">Domaine</dt>
                      <dd className="col-sm-7">{getNomDomaine(selectedEtudiant.domaine)}</dd>

                      <dt className="col-sm-5">Niveau</dt>
                      <dd className="col-sm-7">{selectedEtudiant.niveau}</dd>

                      <dt className="col-sm-5">Mention</dt>
                      <dd className="col-sm-7">{getNomMention(selectedEtudiant.mention)}</dd>

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
                          <div><strong>Faculté:</strong> {getNomFaculte(selectedEtudiant.faculte)}</div>
                          <div><strong>Mention:</strong> {getNomMention(selectedEtudiant.mention)}</div>
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
                    <p><strong>Faculté/Ecole/Institut :</strong> {getNomFaculte(selectedEtudiant.faculte)}</p>
                    <p><strong>Domaine :</strong> {getNomDomaine(selectedEtudiant.domaine)}</p>
                    <p><strong>Mention :</strong> {getNomMention(selectedEtudiant.mention)}</p>
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