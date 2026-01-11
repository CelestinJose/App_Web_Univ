// src/pages/AccepBourses.jsx
import React, { useState, useEffect } from 'react';
import {
  FaCheck, FaTimes, FaSearch, FaFilter, FaDownload,
  FaPrint, FaEnvelope, FaUserCheck, FaMoneyCheckAlt, FaExclamationTriangle,
  FaChartBar, FaCalendarAlt, FaUniversity, FaGraduationCap,
  FaIdCard, FaFileExcel, FaFilePdf, FaEye, FaEdit, FaTrash, FaSync
} from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Pagination from 'react-bootstrap/Pagination';
import ProgressBar from 'react-bootstrap/ProgressBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import api, { etudiantApi, bourseApi } from '../api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AccepBourses() {
  // États pour les données
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsBoursesAcceptees, setEtudiantsBoursesAcceptees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // États pour les données de référence
  const [facultesList, setFacultesList] = useState([]);
  const [domainesList, setDomainesList] = useState([]);
  const [mentionsList, setMentionsList] = useState([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  
  // États pour les notifications Toast
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    title: '',
    message: '',
    variant: 'success',
    icon: null
  });
  
  // États pour les modales
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  
  // États pour les données sélectionnées
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [selectedBourse, setSelectedBourse] = useState(null);
  
  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculte, setFilterFaculte] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterAnnee, setFilterAnnee] = useState("");
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // États pour l'exportation
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportError, setExportError] = useState(null);
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    total_acceptees: 0,
    montant_total: 0,
    par_faculte: {},
    par_niveau: {},
    par_mois: {}
  });
  
  // Listes pour les filtres
  const [facultes, setFacultes] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [annees, setAnnees] = useState([]);
  
  // Fonction pour afficher les notifications
  const showNotification = (title, message, variant = 'success', icon = null) => {
    setToastConfig({
      title,
      message,
      variant,
      icon
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };
  
  // Fonctions pour obtenir les noms à partir des IDs
  const getNomFaculte = (faculteData) => {
    if (!faculteData) return "N/A";
    
    // Si c'est déjà une chaîne, la nettoyer
    if (typeof faculteData === 'string') {
      // Enlever le code si présent (ex: "FASEG - Faculté Administration et Sciences Économiques")
      const cleaned = faculteData.replace(/^[A-Z]+ - /, '');
      return cleaned || faculteData;
    }
    
    // Si c'est un objet avec propriété 'nom'
    if (typeof faculteData === 'object' && faculteData !== null) {
      const nomComplet = faculteData.nom_faculte || faculteData.nom || faculteData.name || '';
      const cleaned = nomComplet.replace(/^[A-Z]+ - /, '');
      return cleaned || nomComplet || "N/A";
    }
    
    // Si c'est un ID numérique, chercher dans la liste
    const faculteId = typeof faculteData === 'object' ? faculteData.id : faculteData;
    const faculte = facultesList.find(f => f.id == faculteId);
    
    if (faculte) {
      const nomComplet = faculte.nom_faculte || faculte.nom || faculte.name || '';
      const cleaned = nomComplet.replace(/^[A-Z]+ - /, '');
      return cleaned || nomComplet || `Faculté ${faculteId}`;
    }
    
    return `Faculté ${faculteId}`;
  };

  const getNomDomaine = (domaineData) => {
    if (!domaineData) return "N/A";
    
    // Si c'est déjà une chaîne
    if (typeof domaineData === 'string') {
      return domaineData;
    }
    
    // Si c'est un objet
    if (typeof domaineData === 'object' && domaineData !== null) {
      return domaineData.nom_domaine || domaineData.nom || domaineData.name || "N/A";
    }
    
    // Si c'est un ID numérique
    const domaineId = typeof domaineData === 'object' ? domaineData.id : domaineData;
    const domaine = domainesList.find(d => d.id == domaineId);
    
    if (domaine) {
      return domaine.nom_domaine || domaine.nom || domaine.name || `Domaine ${domaineId}`;
    }
    
    return `Domaine ${domaineId}`;
  };

  const getNomMention = (mentionData) => {
    if (!mentionData) return "N/A";
    
    // Si c'est déjà une chaîne
    if (typeof mentionData === 'string') {
      return mentionData;
    }
    
    // Si c'est un objet
    if (typeof mentionData === 'object' && mentionData !== null) {
      return mentionData.nom_mention || mentionData.nom || mentionData.name || "N/A";
    }
    
    // Si c'est un ID numérique
    const mentionId = typeof mentionData === 'object' ? mentionData.id : mentionData;
    const mention = mentionsList.find(m => m.id == mentionId);
    
    if (mention) {
      return mention.nom_mention || mention.nom || mention.name || `Mention ${mentionId}`;
    }
    
    return `Mention ${mentionId}`;
  };
  
  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    setUserRole(role);
    
    if (role !== 'administrateur' && role !== 'bourse') {
      showNotification("Accès refusé", "Vous n'avez pas les permissions pour accéder à cette page", 'danger');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }
  }, []);
  
  // Fonction pour charger les données de référence
  const fetchReferences = async () => {
    setLoadingReferences(true);
    try {
      // Charger les facultés
      const faculteResponse = await api.get('/facultes/');
      let facultesData = [];
      if (faculteResponse.data) {
        if (Array.isArray(faculteResponse.data)) {
          facultesData = faculteResponse.data;
        } else if (faculteResponse.data.results && Array.isArray(faculteResponse.data.results)) {
          facultesData = faculteResponse.data.results;
        }
      }
      setFacultesList(facultesData);
      console.log("Facultés chargées:", facultesData.length);
      
      // Charger les domaines
      const domaineResponse = await api.get('/domaines/');
      let domainesData = [];
      if (domaineResponse.data) {
        if (Array.isArray(domaineResponse.data)) {
          domainesData = domaineResponse.data;
        } else if (domaineResponse.data.results && Array.isArray(domaineResponse.data.results)) {
          domainesData = domaineResponse.data.results;
        }
      }
      setDomainesList(domainesData);
      console.log("Domaines chargés:", domainesData.length);
      
      // Charger les mentions
      const mentionResponse = await api.get('/mentions/');
      let mentionsData = [];
      if (mentionResponse.data) {
        if (Array.isArray(mentionResponse.data)) {
          mentionsData = mentionResponse.data;
        } else if (mentionResponse.data.results && Array.isArray(mentionResponse.data.results)) {
          mentionsData = mentionResponse.data.results;
        }
      }
      setMentionsList(mentionsData);
      console.log("Mentions chargées:", mentionsData.length);
      
    } catch (error) {
      console.error("Erreur lors du chargement des références:", error);
    } finally {
      setLoadingReferences(false);
    }
  };
  
  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Charger les étudiants avec bourses acceptées
      const [etudiantsResponse, boursesResponse] = await Promise.all([
        api.get('/etudiants/?boursier=OUI'),
        api.get('/bourses/')
      ]);
      
      if (etudiantsResponse.data && boursesResponse.data) {
        const etudiantsData = Array.isArray(etudiantsResponse.data) 
          ? etudiantsResponse.data 
          : etudiantsResponse.data.results || [];
        
        const boursesData = Array.isArray(boursesResponse.data)
          ? boursesResponse.data
          : boursesResponse.data.results || [];
        
        // Filtrer pour garder seulement les bourses acceptées
        const boursesAcceptees = boursesData.filter(b => b.status === 'ACCEPTEE');
        
        // Associer les étudiants avec leurs bourses acceptées
        const etudiantsAvecBourses = etudiantsData
          .map(etudiant => {
            const boursesEtudiant = boursesAcceptees.filter(b => b.etudiant === etudiant.id);
            return {
              ...etudiant,
              bourses: boursesEtudiant,
              has_bourse_acceptee: boursesEtudiant.length > 0
            };
          })
          .filter(etudiant => etudiant.has_bourse_acceptee);
        
        setEtudiants(etudiantsAvecBourses);
        setEtudiantsBoursesAcceptees(etudiantsAvecBourses);
        setTotalCount(etudiantsAvecBourses.length);
        setTotalPages(Math.ceil(etudiantsAvecBourses.length / itemsPerPage));
        
        // Calculer les statistiques
        calculateStats(etudiantsAvecBourses);
        
        // Extraire les listes pour les filtres
        extractFilterLists(etudiantsAvecBourses);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données. Veuillez réessayer.");
      showNotification("Erreur", "Impossible de charger les données", 'danger');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculer les statistiques
  const calculateStats = (etudiantsData) => {
    const statsObj = {
      total_acceptees: etudiantsData.length,
      montant_total: 0,
      par_faculte: {},
      par_niveau: {},
      par_mois: {}
    };
    
    etudiantsData.forEach(etudiant => {
      // Montant total
      const montantBourses = etudiant.bourses.reduce((sum, b) => sum + parseFloat(b.montant || 0), 0);
      statsObj.montant_total += montantBourses;
      
      // Par faculté (en utilisant getNomFaculte)
      const faculteNom = getNomFaculte(etudiant.faculte);
      statsObj.par_faculte[faculteNom] = (statsObj.par_faculte[faculteNom] || 0) + 1;
      
      // Par niveau
      const niveau = etudiant.niveau || 'Non spécifié';
      statsObj.par_niveau[niveau] = (statsObj.par_niveau[niveau] || 0) + 1;
      
      // Par mois (basé sur la date de décision)
      etudiant.bourses.forEach(bourse => {
        if (bourse.date_decision) {
          const date = new Date(bourse.date_decision);
          const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          statsObj.par_mois[mois] = (statsObj.par_mois[mois] || 0) + 1;
        }
      });
    });
    
    setStats(statsObj);
  };
  
  // Extraire les listes pour les filtres
  const extractFilterLists = (etudiantsData) => {
    const facultesSet = new Set();
    const niveauxSet = new Set();
    const anneesSet = new Set();
    
    etudiantsData.forEach(etudiant => {
      // Utiliser getNomFaculte pour avoir le nom propre
      const faculteNom = getNomFaculte(etudiant.faculte);
      if (faculteNom && faculteNom !== "N/A") {
        facultesSet.add(faculteNom);
      }
      
      if (etudiant.niveau) niveauxSet.add(etudiant.niveau);
      
      // Extraire l'année académique des bourses
      etudiant.bourses.forEach(bourse => {
        if (bourse.annee_academique) {
          anneesSet.add(bourse.annee_academique);
        }
      });
    });
    
    // Trier alphabétiquement
    setFacultes(Array.from(facultesSet).sort());
    setNiveaux(Array.from(niveauxSet).sort());
    setAnnees(Array.from(anneesSet).sort((a, b) => b.localeCompare(a)));
  };
  
  // Appliquer les filtres
  const applyFilters = () => {
    let filtered = [...etudiantsBoursesAcceptees];
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(etudiant => 
        (etudiant.nom && etudiant.nom.toLowerCase().includes(term)) ||
        (etudiant.prenom && etudiant.prenom.toLowerCase().includes(term)) ||
        (etudiant.matricule && etudiant.matricule.toLowerCase().includes(term)) ||
        (etudiant.cin && etudiant.cin.toLowerCase().includes(term))
      );
    }
    
    // Filtre par faculté (utiliser getNomFaculte pour la comparaison)
    if (filterFaculte) {
      filtered = filtered.filter(etudiant => {
        const faculteNom = getNomFaculte(etudiant.faculte);
        return faculteNom === filterFaculte;
      });
    }
    
    // Filtre par niveau
    if (filterNiveau) {
      filtered = filtered.filter(etudiant => 
        etudiant.niveau === filterNiveau
      );
    }
    
    // Filtre par année académique
    if (filterAnnee) {
      filtered = filtered.filter(etudiant =>
        etudiant.bourses.some(b => b.annee_academique === filterAnnee)
      );
    }
    
    setEtudiants(filtered);
    setTotalCount(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };
  
  // Effacer les filtres
  const clearFilters = () => {
    setSearchTerm("");
    setFilterFaculte("");
    setFilterNiveau("");
    setFilterAnnee("");
    setEtudiants([...etudiantsBoursesAcceptees]);
    setTotalCount(etudiantsBoursesAcceptees.length);
    setTotalPages(Math.ceil(etudiantsBoursesAcceptees.length / itemsPerPage));
    setCurrentPage(1);
  };
  
  // Afficher les détails d'un étudiant
  const showEtudiantDetails = (etudiant) => {
    setSelectedEtudiant(etudiant);
    setSelectedBourse(etudiant.bourses[0]); // Prendre la première bourse acceptée
    setShowDetailsModal(true);
  };
  
  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return dateString;
    }
  };
  
  // Exporter en Excel
  const exportToExcel = () => {
    setExporting(true);
    setExportProgress(0);
    
    try {
      // Préparer les données
      const exportData = etudiants.map((etudiant, index) => {
        const bourse = etudiant.bourses[0]; // Prendre la première bourse acceptée
        
        setExportProgress((index / etudiants.length) * 100);
        
        return {
          'Numéro': index + 1,
          'Matricule': etudiant.matricule || '',
          'Nom': etudiant.nom || '',
          'Prénom': etudiant.prenom || '',
          'CIN': etudiant.cin || '',
          'Date Naissance': etudiant.date_naissance ? new Date(etudiant.date_naissance).toLocaleDateString('fr-FR') : '',
          'Téléphone': etudiant.telephone || '',
          'Email': etudiant.email || '',
          'Faculté': getNomFaculte(etudiant.faculte), // Utiliser getNomFaculte
          'Domaine': getNomDomaine(etudiant.domaine), // Utiliser getNomDomaine
          'Mention': getNomMention(etudiant.mention), // Utiliser getNomMention
          'Niveau': etudiant.niveau || '',
          'Montant Bourse': bourse ? `${parseFloat(bourse.montant).toLocaleString('fr-FR')} MGA` : '0 MGA',
          'Année Académique': bourse ? bourse.annee_academique : '',
          'Date Début': bourse && bourse.date_debut ? new Date(bourse.date_debut).toLocaleDateString('fr-FR') : '',
          'Date Fin': bourse && bourse.date_fin ? new Date(bourse.date_fin).toLocaleDateString('fr-FR') : '',
          'Statut': 'ACCEPTEE',
          'Date Décision': bourse && bourse.date_decision ? new Date(bourse.date_decision).toLocaleDateString('fr-FR') : '',
          'Conditions': bourse ? bourse.conditions || '' : ''
        };
      });
      
      // Créer le workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bourses Acceptées');
      
      // Télécharger
      XLSX.writeFile(wb, `bourses_acceptees_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setExportProgress(100);
      showNotification("Succès", "Exportation Excel terminée", 'success', <FaFileExcel />);
      
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      showNotification("Erreur", "Erreur lors de l'exportation", 'danger');
    } finally {
      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };
  
  // Exporter en PDF
  const exportToPDF = () => {
    setExportingPDF(true);
    setExportError(null);

    try {
      // Récupérer les données filtrées
      const filteredEtudiants = etudiants;
      
      // Créer un nouveau document PDF
      const doc = new jsPDF('landscape'); // Orientation paysage pour plus d'espace
      const date = new Date().toLocaleDateString('fr-FR');

      // En-tête institutionnel
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("REPOBLIKAN'NY MADAGASIKARA", 145, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text("FITIAVANA - TANINDRAZANA - FANDROSOANA", 145, 22, { align: 'center' });

      doc.setFontSize(11);
      doc.text("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE", 145, 30, { align: 'center' });
      doc.text("UNIVERSITE DE TOLIARA", 145, 37, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("LISTE DES BOURSES ACCEPTÉES", 145, 47, { align: 'center' });

      // Informations générales
      const firstStudent = filteredEtudiants[0] || {};
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Informations à gauche
      doc.text(`Faculté: ${filterFaculte || 'Toutes facultés'}`, 15, 60);
      doc.text(`Niveau: ${filterNiveau || 'Tous niveaux'}`, 15, 67);
      doc.text(`Année académique: ${filterAnnee || 'Toutes années'}`, 15, 74);
      
      // Statistiques à droite
      doc.text(`Nombre d'étudiants: ${filteredEtudiants.length}`, 240, 60, { align: 'right' });
      doc.text(`Montant total: ${stats.montant_total.toLocaleString('fr-FR')}`, 240, 67, { align: 'right' });
      doc.text(`Date: ${currentDate}`, 240, 74, { align: 'right' });

      // Tableau des bourses acceptées
      const tableColumn = [
        { header: "Matricule", dataKey: "matricule", width: 25 },
        { header: "Nom et Prénoms", dataKey: "nom_complet", width: 50 },
        { header: "Faculté", dataKey: "faculte", width: 40 },
        { header: "Niveau", dataKey: "niveau", width: 25 },
        { header: "Mention", dataKey: "mention", width: 40 },
        { header: "Montant Bourse", dataKey: "montant", width: 25 },
        { header: "Année Acad.", dataKey: "annee_academique", width: 20 },
        { header: "Période", dataKey: "periode", width: 30 },
      ];

      const tableRows = filteredEtudiants.map((etudiant, index) => {
        const bourse = etudiant.bourses[0]; // Prendre la première bourse acceptée
        
        // Formater le montant
        let montantFormatted = '-';
        if (bourse && bourse.montant > 0) {
          const montantNum = parseFloat(bourse.montant);
          montantFormatted = montantNum.toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).replace(/\u202f/g, ' ');
        }
        
        // Formater la période
        let periode = '-';
        if (bourse && bourse.date_debut && bourse.date_fin) {
          periode = `${formatDate(bourse.date_debut)} - ${formatDate(bourse.date_fin)}`;
        }
        
        return {
          matricule: etudiant.matricule || '-',
          nom_complet: `${etudiant.nom || ''} ${etudiant.prenom || ''}`.trim(),
          faculte: getNomFaculte(etudiant.faculte), // Utiliser getNomFaculte
          niveau: etudiant.niveau || '-',
          mention: getNomMention(etudiant.mention), // Utiliser getNomMention
          montant: montantFormatted + ' MGA',
          annee_academique: bourse ? bourse.annee_academique || '-' : '-',
          periode: periode,
        };
      });

      const startY = 85;

      autoTable(doc, {
        columns: tableColumn,
        body: tableRows,
        startY: startY,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185], // Bleu pour l'en-tête
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'center'
        },
        columnStyles: {
          numero: { halign: 'center', cellWidth: 12 },
          montant: { halign: 'right', cellWidth: 25 },
          periode: { halign: 'center', cellWidth: 35 },
          nom_complet: { halign: 'left', cellWidth: 50 },
          signature: { halign: 'center', cellWidth: 25 }
        },
        margin: { left: 10, right: 10 },
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: function (data) {
          // Pied de page avec numérotation
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} sur ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );

          // Mention de bas de page
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.text(
            "Bourses accordées par l'Université de Toliara - Service des Bourses",
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 20,
            { align: 'center' }
          );

          // Ligne de compte des bourses à la fin
          if (data.pageNumber === pageCount) {
            const totalY = doc.internal.pageSize.height - 30;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(
              `Arrêtée la présente liste au nombre de ${filteredEtudiants.length} étudiants boursiers acceptés`,
              doc.internal.pageSize.width / 2,
              totalY,
              { align: 'center' }
            );
            
            // Ajouter les signatures
            const signatureY = doc.internal.pageSize.height - 50;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("Chef de Service", 50, signatureY, { align: 'center' });
            doc.text("Le Responsable des Bourses", 200, signatureY, { align: 'center' });
            
            // Lignes de signature
            doc.line(40, signatureY + 5, 100, signatureY + 5);
            doc.line(180, signatureY + 5, 220, signatureY + 5);
          }
        }
      });

      // Nom du fichier avec date et mention
      const fileName = `Bourses_Acceptees_${filterFaculte?.replace(/\s+/g, '_') || getNomFaculte(firstStudent.faculte)?.replace(/\s+/g, '_') || 'TUL'}_${filterAnnee || new Date().getFullYear()}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      showNotification("Succès", "Exportation PDF terminée", 'success', <FaFilePdf />);

    } catch (error) {
      console.error("Erreur export PDF:", error);
      setExportError("Erreur lors de l'export PDF : " + error.message);
      showNotification("Erreur", "Erreur lors de l'export PDF", 'danger');
    } finally {
      setExportingPDF(false);
      setShowExportModal(false);
    }
  };

  // Modifier une bourse
  const handleModifyBourse = async () => {
    if (!selectedBourse) return;
    
    try {
      const response = await api.put(`/bourses/${selectedBourse.id}/`, selectedBourse);
      
      if (response.data) {
        // Mettre à jour la liste
        const updatedEtudiants = etudiants.map(etudiant => {
          if (etudiant.id === selectedEtudiant.id) {
            return {
              ...etudiant,
              bourses: etudiant.bourses.map(b => 
                b.id === selectedBourse.id ? response.data : b
              )
            };
          }
          return etudiant;
        });
        
        setEtudiants(updatedEtudiants);
        setEtudiantsBoursesAcceptees(updatedEtudiants);
        setShowModifyModal(false);
        showNotification("Succès", "Bourse modifiée avec succès", 'success', <FaCheck />);
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      showNotification("Erreur", "Erreur lors de la modification", 'danger');
    }
  };
  
  // Rejeter une bourse
  const handleRejectBourse = async () => {
    if (!selectedBourse) return;
    
    try {
      const updatedBourse = { ...selectedBourse, status: 'REJETEE', date_decision: new Date().toISOString() };
      const response = await api.put(`/bourses/${selectedBourse.id}/`, updatedBourse);
      
      if (response.data) {
        // Retirer l'étudiant de la liste (puisqu'il n'a plus de bourse acceptée)
        const updatedEtudiants = etudiants.filter(etudiant => 
          etudiant.id !== selectedEtudiant.id
        );
        
        setEtudiants(updatedEtudiants);
        setEtudiantsBoursesAcceptees(updatedEtudiants);
        setShowRejectModal(false);
        showNotification("Succès", "Bourse rejetée avec succès", 'success', <FaTimes />);
      }
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      showNotification("Erreur", "Erreur lors du rejet", 'danger');
    }
  };
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEtudiants = etudiants.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Initialiser les données
  useEffect(() => {
    fetchData();
    fetchReferences();
  }, []);
  
  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterFaculte, filterNiveau, filterAnnee]);
  
  return (
    <div className="container-fluid py-4">
      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={5000}
          autohide
          bg={toastConfig.variant}
          className="text-white"
        >
          <Toast.Header closeButton className={`bg-${toastConfig.variant} text-white`}>
            {toastConfig.icon && <span className="me-2">{toastConfig.icon}</span>}
            <strong className="me-auto">{toastConfig.title}</strong>
          </Toast.Header>
          <Toast.Body>{toastConfig.message}</Toast.Body>
        </Toast>
      </ToastContainer>
      
      {/* En-tête */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-success">
                <FaMoneyCheckAlt className="me-2" />
                Bourses Acceptées
              </h1>
              <p className="text-muted mb-0">
                Liste des étudiants avec bourses accordées
              </p>
            </div>
            <div>
              <Button
                variant="outline-danger"
                onClick={() => setShowExportModal(true)}
                className="me-2"
              >
                <FaFilePdf className="me-1" /> Exporter PDF
              </Button>
              <Button
                variant="outline-success"
                onClick={exportToExcel}
                disabled={exporting || totalCount === 0}
                className="me-2"
              >
                <FaFileExcel className="me-1" /> Exporter Excel
              </Button>
              <Button
                variant="outline-primary"
                onClick={fetchData}
                disabled={loading}
              >
                <FaSync className={loading ? "fa-spin me-1" : "me-1"} />
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barre de filtres */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
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
                value={filterAnnee}
                onChange={(e) => setFilterAnnee(e.target.value)}
              >
                <option value="">Toutes années</option>
                {annees.map((annee, index) => (
                  <option key={index} value={annee}>{annee}</option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-3 text-end">
              <Button
                variant="outline-secondary"
                onClick={clearFilters}
                className="me-2"
              >
                <FaFilter className="me-1" /> Effacer filtres
              </Button>
              {/* Bouton debug temporaire */}
              <Button
                variant="outline-warning"
                onClick={() => {
                  console.log("=== DEBUG ===");
                  console.log("FacultesList:", facultesList);
                  console.log("Premier étudiant:", etudiants[0]);
                  if (etudiants[0]) {
                    console.log("Faculté ID:", etudiants[0].faculte);
                    console.log("Faculté Nom:", getNomFaculte(etudiants[0].faculte));
                  }
                }}
                className="me-2"
              >
                Debug
              </Button>
              <Badge bg="info" className="align-middle py-2">
                {totalCount} étudiant(s) trouvé(s)
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tableau principal */}
      <div className="card">
        <div className="card-body">
          {loading || loadingReferences ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Chargement des bourses acceptées...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <Alert.Heading>Erreur de chargement</Alert.Heading>
              <p>{error}</p>
              <Button variant="outline-danger" onClick={fetchData}>
                Réessayer
              </Button>
            </Alert>
          ) : etudiants.length === 0 ? (
            <div className="text-center py-5">
              <FaSearch className="text-muted mb-3" size={48} />
              <p className="text-muted">Aucun étudiant avec bourse acceptée trouvé</p>
              {searchTerm || filterFaculte || filterNiveau || filterAnnee ? (
                <Button variant="outline-primary" onClick={clearFilters}>
                  Afficher tous les étudiants
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              {/* Pagination en haut */}
              {totalCount > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <span className="me-2">Afficher :</span>
                    <Form.Select
                      style={{ width: '80px' }}
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Form.Select>
                    <span className="ms-2">éléments</span>
                  </div>
                  
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    
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
                      
                      return pageNumber > 0 && pageNumber <= totalPages ? (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      ) : null;
                    })}
                    
                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
              
              {/* Tableau */}
              <div className="table-responsive">
                <Table striped hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Étudiant</th>
                      <th>Informations</th>
                      <th>Formation</th>
                      <th>Bourse</th>
                      <th>Période</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEtudiants.map((etudiant, index) => {
                      const bourse = etudiant.bourses[0];
                      return (
                        <tr key={etudiant.id}>
                          <td>{indexOfFirstItem + index + 1}</td>
                          <td>
                            <div className="fw-medium">{etudiant.nom} {etudiant.prenom}</div>
                            <div className="text-muted small">
                              <FaIdCard className="me-1" /> {etudiant.matricule}
                              {etudiant.cin && ` • CIN: ${etudiant.cin}`}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              {etudiant.date_naissance && (
                                <div>
                                  <FaCalendarAlt className="me-1" />
                                  {formatDate(etudiant.date_naissance)}
                                </div>
                              )}
                              {etudiant.telephone && (
                                <div>📞 {etudiant.telephone}</div>
                              )}
                              {etudiant.email && (
                                <div>
                                  <FaEnvelope className="me-1" />
                                  {etudiant.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              <div className="fw-medium">{getNomFaculte(etudiant.faculte)}</div>
                              <div>{getNomMention(etudiant.mention)}</div>
                              <Badge bg="info" className="mt-1">
                                {etudiant.niveau}
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold text-success">
                              {bourse ? `${parseFloat(bourse.montant).toLocaleString('fr-FR')} MGA` : '0 MGA'}
                            </div>
                            <div className="text-muted small">
                              Année: {bourse ? bourse.annee_academique : '-'}
                            </div>
                            <Badge bg="success" pill className="mt-1">
                              ACCEPTEE
                            </Badge>
                          </td>
                          <td>
                            {bourse && bourse.date_debut && bourse.date_fin ? (
                              <div className="small">
                                <div>
                                  <FaCalendarAlt className="me-1" />
                                  Début: {formatDate(bourse.date_debut)}
                                </div>
                                <div>
                                  <FaCalendarAlt className="me-1" />
                                  Fin: {formatDate(bourse.date_fin)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">Non spécifié</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm" role="group">
                              <Button
                                variant="outline-info"
                                onClick={() => showEtudiantDetails(etudiant)}
                                title="Voir détails"
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="outline-success"
                                onClick={() => {
                                  setSelectedEtudiant(etudiant);
                                  setSelectedBourse(bourse);
                                  setShowModifyModal(true);
                                }}
                                title="Modifier"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => {
                                  setSelectedEtudiant(etudiant);
                                  setSelectedBourse(bourse);
                                  setShowRejectModal(true);
                                }}
                                title="Rejeter"
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              
              {/* Pagination en bas */}
              {totalCount > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, totalCount)} sur {totalCount} étudiants
                  </div>
                  <Pagination>
                    <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                    
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
                      
                      return pageNumber > 0 && pageNumber <= totalPages ? (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      ) : null;
                    })}
                    
                    <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modal Détails */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>Détails de l'étudiant et de la bourse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && selectedBourse && (
            <div className="row">
              <div className="col-md-6">
                <h5 className="text-primary mb-3">Informations étudiant</h5>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Nom complet:</th>
                      <td>{selectedEtudiant.nom} {selectedEtudiant.prenom}</td>
                    </tr>
                    <tr>
                      <th>Matricule:</th>
                      <td>{selectedEtudiant.matricule}</td>
                    </tr>
                    <tr>
                      <th>CIN:</th>
                      <td>{selectedEtudiant.cin || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>Date naissance:</th>
                      <td>
                        {formatDate(selectedEtudiant.date_naissance) || 'Non spécifié'}
                      </td>
                    </tr>
                    <tr>
                      <th>Téléphone:</th>
                      <td>{selectedEtudiant.telephone || 'Non spécifié'}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{selectedEtudiant.email || 'Non spécifié'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-md-6">
                <h5 className="text-success mb-3">Informations bourse</h5>
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <th>Montant:</th>
                      <td className="fw-bold text-success">
                        {parseFloat(selectedBourse.montant).toLocaleString('fr-FR')} MGA
                      </td>
                    </tr>
                    <tr>
                      <th>Année académique:</th>
                      <td>{selectedBourse.annee_academique}</td>
                    </tr>
                    <tr>
                      <th>Date début:</th>
                      <td>
                        {formatDate(selectedBourse.date_debut)}
                      </td>
                    </tr>
                    <tr>
                      <th>Date fin:</th>
                      <td>
                        {formatDate(selectedBourse.date_fin)}
                      </td>
                    </tr>
                    <tr>
                      <th>Statut:</th>
                      <td>
                        <Badge bg="success" pill>ACCEPTEE</Badge>
                      </td>
                    </tr>
                    <tr>
                      <th>Date décision:</th>
                      <td>
                        {formatDate(selectedBourse.date_decision) || 'Non spécifié'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-12 mt-3">
                <h5 className="text-warning mb-3">Formation</h5>
                <div className="bg-light p-3 rounded">
                  <div className="row">
                    <div className="col-md-4">
                      <strong>Faculté:</strong>
                      <p>{getNomFaculte(selectedEtudiant.faculte)}</p>
                    </div>
                    <div className="col-md-4">
                      <strong>Domaine:</strong>
                      <p>{getNomDomaine(selectedEtudiant.domaine)}</p>
                    </div>
                    <div className="col-md-4">
                      <strong>Mention:</strong>
                      <p>{getNomMention(selectedEtudiant.mention)}</p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <strong>Niveau:</strong>
                      <Badge bg="info">{selectedEtudiant.niveau}</Badge>
                    </div>
                    <div className="col-md-8">
                      <strong>Code redoublement:</strong>
                      <Badge bg={selectedEtudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                        {selectedEtudiant.code_redoublement}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedBourse.conditions && (
                <div className="col-12 mt-3">
                  <h5 className="text-info mb-3">Conditions de la bourse</h5>
                  <div className="bg-light p-3 rounded">
                    {selectedBourse.conditions}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal Exportation */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Exporter les données</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-6">
              <Card className="h-100 border-success">
                <Card.Body className="text-center">
                  <FaFileExcel className="text-success display-4 mb-3" />
                  <Card.Title>Export Excel</Card.Title>
                  <Card.Text>
                    Exporter les données au format Excel (.xlsx) pour traitement et analyse.
                  </Card.Text>
                  <Alert variant="info" className="small">
                    Inclut toutes les colonnes visibles dans le tableau
                  </Alert>
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button 
                    variant="success" 
                    onClick={exportToExcel} 
                    disabled={exporting || totalCount === 0}
                    className="w-100"
                  >
                    <FaFileExcel className="me-2" />
                    Exporter vers Excel
                  </Button>
                </Card.Footer>
              </Card>
            </div>
            
            <div className="col-md-6">
              <Card className="h-100 border-danger">
                <Card.Body className="text-center">
                  <FaFilePdf className="text-danger display-4 mb-3" />
                  <Card.Title>Export PDF</Card.Title>
                  <Card.Text>
                    Générer un document PDF formatté avec en-tête institutionnel.
                  </Card.Text>
                  <Alert variant="info" className="small">
                    Format officiel avec en-tête, statistiques
                  </Alert>
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button 
                    variant="danger" 
                    onClick={exportToPDF} 
                    disabled={exportingPDF || totalCount === 0}
                    className="w-100"
                  >
                    <FaFilePdf className="me-2" />
                    Exporter vers PDF
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          </div>
          
          {exportError && (
            <Alert variant="danger" className="mt-3">
              <FaExclamationTriangle className="me-2" />
              {exportError}
            </Alert>
          )}
          
          {(exporting || exportingPDF) && (
            <div className="mt-3">
              <ProgressBar 
                animated 
                now={exportProgress} 
                label={`${Math.round(exportProgress)}%`} 
                className="mb-2"
              />
              <p className="text-center text-muted small">
                Préparation du fichier en cours...
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowExportModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal Rejeter Bourse */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Rejeter la bourse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && selectedBourse && (
            <div className="text-center">
              <FaTimes className="text-danger mb-3" size={48} />
              <h5>Confirmer le rejet de la bourse</h5>
              <p className="mt-3">
                <strong>{selectedEtudiant.nom} {selectedEtudiant.prenom}</strong><br />
                <span className="text-muted">Matricule: {selectedEtudiant.matricule}</span>
              </p>
              <p>
                Montant: <strong className="text-success">{parseFloat(selectedBourse.montant).toLocaleString('fr-FR')} MGA</strong>
              </p>
              <Alert variant="warning">
                <FaExclamationTriangle className="me-2" />
                Cette action marquera la bourse comme "REJETEE". L'étudiant disparaîtra de cette liste.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleRejectBourse}>
            <FaTimes className="me-1" /> Confirmer le rejet
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal Modifier Bourse */}
      <Modal show={showModifyModal} onHide={() => setShowModifyModal(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-dark">
          <Modal.Title>Modifier la bourse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBourse && (
            <Form>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Montant (MGA)</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedBourse.montant}
                      onChange={(e) => setSelectedBourse({
                        ...selectedBourse,
                        montant: parseFloat(e.target.value)
                      })}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Année académique</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedBourse.annee_academique}
                      onChange={(e) => setSelectedBourse({
                        ...selectedBourse,
                        annee_academique: e.target.value
                      })}
                    />
                  </Form.Group>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date début</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedBourse.date_debut ? selectedBourse.date_debut.split('T')[0] : ''}
                      onChange={(e) => setSelectedBourse({
                        ...selectedBourse,
                        date_debut: e.target.value
                      })}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedBourse.date_fin ? selectedBourse.date_fin.split('T')[0] : ''}
                      onChange={(e) => setSelectedBourse({
                        ...selectedBourse,
                        date_fin: e.target.value
                      })}
                    />
                  </Form.Group>
                </div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedBourse.conditions || ''}
                  onChange={(e) => setSelectedBourse({
                    ...selectedBourse,
                    conditions: e.target.value
                  })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowModifyModal(false)}>
            Annuler
          </Button>
          <Button variant="success" onClick={handleModifyBourse}>
            <FaEdit className="me-1" /> Mettre à jour
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}