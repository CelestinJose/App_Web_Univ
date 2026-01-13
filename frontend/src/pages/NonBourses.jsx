// src/components/NonBourses.jsx
import React, { useState, useEffect } from 'react';
import {
  FaTimes, FaSearch, FaFilter, FaDownload, FaCheck,
  FaPrint, FaEnvelope, FaUserSlash, FaMoneyCheckAlt,
  FaChartBar, FaCalendarAlt, FaUniversity, FaGraduationCap,
  FaIdCard, FaFileExcel, FaEye, FaRedo, FaTrash, FaSync,
  FaExclamationCircle, FaCommentAlt, FaHistory
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
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from "../api";
import * as XLSX from 'xlsx';

export default function NonBourses() {
  // États pour les données
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsRejetes, setEtudiantsRejetes] = useState([]);
  const [etudiantsNonBoursiers, setEtudiantsNonBoursiers] = useState([]);
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
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showReasonsModal, setShowReasonsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // États pour les données sélectionnées
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [selectedBourse, setSelectedBourse] = useState(null);
  const [rejectionReasons, setRejectionReasons] = useState([]);

  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculte, setFilterFaculte] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterAnnee, setFilterAnnee] = useState("");
  const [filterRaison, setFilterRaison] = useState("");
  const [activeTab, setActiveTab] = useState('rejetees'); // 'rejetees' ou 'nonboursiers'

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // États pour l'exportation
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  // États pour les statistiques
  const [stats, setStats] = useState({
    total_rejetees: 0,
    total_nonboursiers: 0,
    par_faculte: {},
    par_niveau: {},
    par_raison: {},
    par_mois: {}
  });

  // Listes pour les filtres
  const [facultes, setFacultes] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [raisons, setRaisons] = useState([]);

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

    if (typeof faculteData === 'string') {
      // Retourner le nom complet tel quel (ex: "ENS - TUL")
      return faculteData;
    }

    if (typeof faculteData === 'object' && faculteData !== null) {
      const nomComplet = faculteData.nom_faculte || faculteData.nom || faculteData.name || '';
      return nomComplet || "N/A";
    }

    const faculteId = typeof faculteData === 'object' ? faculteData.id : faculteData;
    const faculte = facultesList.find(f => f.id == faculteId);

    if (faculte) {
      const nomComplet = faculte.nom_faculte || faculte.nom || faculte.name || '';
      return nomComplet || `Faculté ${faculteId}`;
    }

    return `Faculté ${faculteId}`;
  };

  const getNomDomaine = (domaineData) => {
    if (!domaineData) return "N/A";

    if (typeof domaineData === 'string') {
      return domaineData;
    }

    if (typeof domaineData === 'object' && domaineData !== null) {
      return domaineData.nom_domaine || domaineData.nom || domaineData.name || "N/A";
    }

    const domaineId = typeof domaineData === 'object' ? domaineData.id : domaineData;
    const domaine = domainesList.find(d => d.id == domaineId);

    if (domaine) {
      return domaine.nom_domaine || domaine.nom || domaine.name || `Domaine ${domaineId}`;
    }

    return `Domaine ${domaineId}`;
  };

  const getNomMention = (mentionData) => {
    if (!mentionData) return "N/A";

    if (typeof mentionData === 'string') {
      return mentionData;
    }

    if (typeof mentionData === 'object' && mentionData !== null) {
      return mentionData.nom_mention || mentionData.nom || mentionData.name || "N/A";
    }

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
        } else if (typeof faculteResponse.data === 'object') {
          facultesData = Object.values(faculteResponse.data);
        }
      }
      setFacultesList(facultesData);

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
      // Charger tous les étudiants (boursiers et non boursiers)
      const etudiantsResponse = await api.get('/etudiants/');

      // Charger toutes les bourses rejetées
      const boursesResponse = await api.get('/bourses/');

      if (etudiantsResponse.data && boursesResponse.data) {
        let etudiantsData = [];
        let boursesData = [];

        // Traiter les données d'étudiants
        if (Array.isArray(etudiantsResponse.data)) {
          etudiantsData = etudiantsResponse.data;
        } else if (etudiantsResponse.data.results && Array.isArray(etudiantsResponse.data.results)) {
          etudiantsData = etudiantsResponse.data.results;
        }

        // Traiter les données de bourses
        if (Array.isArray(boursesResponse.data)) {
          boursesData = boursesResponse.data;
        } else if (boursesResponse.data.results && Array.isArray(boursesResponse.data.results)) {
          boursesData = boursesResponse.data.results;
        }

        console.log("Total étudiants chargés:", etudiantsData.length);
        console.log("Total bourses chargées:", boursesData.length);

        // Filtrer les bourses rejetées
        const boursesRejetees = boursesData.filter(b => b.status === "REJETEE");
        console.log("Bourses rejetées:", boursesRejetees.length);

        // Identifier les étudiants avec bourses rejetées
        const etudiantsAvecBoursesRejetees = [];
        const etudiantsNonBoursiersList = [];

        etudiantsData.forEach(etudiant => {
          // Trouver les bourses rejetées de cet étudiant
          const boursesEtudiant = boursesRejetees.filter(b => {
            if (typeof b.etudiant === 'object' && b.etudiant !== null) {
              return b.etudiant.id === etudiant.id;
            }
            return b.etudiant === etudiant.id;
          });

          if (boursesEtudiant.length > 0) {
            // Étudiant avec bourse rejetée
            etudiantsAvecBoursesRejetees.push({
              ...etudiant,
              bourses: boursesEtudiant,
              has_bourse_rejetee: true
            });
          } else if (etudiant.boursier === 'NON') {
            // Étudiant non boursier (sans bourse)
            etudiantsNonBoursiersList.push({
              ...etudiant,
              bourses: [],
              has_bourse_rejetee: false
            });
          }
        });

        console.log("Étudiants avec bourses rejetées:", etudiantsAvecBoursesRejetees.length);
        console.log("Étudiants non boursiers:", etudiantsNonBoursiersList.length);

        setEtudiantsRejetes(etudiantsAvecBoursesRejetees);
        setEtudiantsNonBoursiers(etudiantsNonBoursiersList);

        // Définir les données selon l'onglet actif
        if (activeTab === 'rejetees') {
          setEtudiants(etudiantsAvecBoursesRejetees);
          setTotalCount(etudiantsAvecBoursesRejetees.length);
        } else {
          setEtudiants(etudiantsNonBoursiersList);
          setTotalCount(etudiantsNonBoursiersList.length);
        }

        setTotalPages(Math.ceil(totalCount / itemsPerPage));

        // Calculer les statistiques
        calculateStats(etudiantsAvecBoursesRejetees, etudiantsNonBoursiersList);

        // Extraire les listes pour les filtres
        extractFilterLists();

        // Extraire les raisons de rejet
        extractRejectionReasons(boursesRejetees);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données. Veuillez réessayer.");
      showNotification("Erreur", "Impossible de charger les données", 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Extraire les raisons de rejet
  const extractRejectionReasons = (boursesRejetees) => {
    const reasonsSet = new Set();

    boursesRejetees.forEach(bourse => {
      if (bourse.conditions) {
        const conditions = bourse.conditions.toLowerCase();

        if (conditions.includes('dossier incomplet')) reasonsSet.add('Dossier incomplet');
        if (conditions.includes('critères non remplis')) reasonsSet.add('Critères non remplis');
        if (conditions.includes('quota atteint')) reasonsSet.add('Quota atteint');
        if (conditions.includes('revenue') || conditions.includes('revenu')) reasonsSet.add('Revenue trop élevée');
        if (conditions.includes('doublon')) reasonsSet.add('Doublon d\'identité');
        if (conditions.includes('note')) reasonsSet.add('Notes insuffisantes');
        if (conditions.includes('absence')) reasonsSet.add('Absence de documents');

        if (!conditions.includes('dossier') && !conditions.includes('critères') &&
          !conditions.includes('quota') && !conditions.includes('revenue') &&
          !conditions.includes('revenu') && !conditions.includes('doublon') &&
          !conditions.includes('note') && !conditions.includes('absence')) {
          reasonsSet.add('Autre raison');
        }
      } else {
        reasonsSet.add('Raison non spécifiée');
      }
    });

    setRaisons(Array.from(reasonsSet).sort());
  };

  // Calculer les statistiques
  const calculateStats = (boursesRejetees, nonBoursiers) => {
    const statsObj = {
      total_rejetees: boursesRejetees.length,
      total_nonboursiers: nonBoursiers.length,
      par_faculte: {},
      par_niveau: {},
      par_raison: {},
      par_mois: {}
    };

    // Statistiques pour les bourses rejetées
    boursesRejetees.forEach(etudiant => {
      const faculteNom = getNomFaculte(etudiant.faculte);
      statsObj.par_faculte[faculteNom] = (statsObj.par_faculte[faculteNom] || 0) + 1;

      const niveau = etudiant.niveau || 'Non spécifié';
      statsObj.par_niveau[niveau] = (statsObj.par_niveau[niveau] || 0) + 1;

      if (etudiant.bourses.length > 0) {
        const bourse = etudiant.bourses[0];
        if (bourse.conditions) {
          const conditions = bourse.conditions.toLowerCase();
          let raison = 'Autre raison';

          if (conditions.includes('dossier incomplet')) raison = 'Dossier incomplet';
          else if (conditions.includes('critères non remplis')) raison = 'Critères non remplis';
          else if (conditions.includes('quota atteint')) raison = 'Quota atteint';
          else if (conditions.includes('revenue') || conditions.includes('revenu')) raison = 'Revenue trop élevée';
          else if (conditions.includes('doublon')) raison = 'Doublon d\'identité';
          else if (conditions.includes('note')) raison = 'Notes insuffisantes';
          else if (conditions.includes('absence')) raison = 'Absence de documents';

          statsObj.par_raison[raison] = (statsObj.par_raison[raison] || 0) + 1;
        }
      }

      etudiant.bourses.forEach(bourse => {
        if (bourse.date_decision) {
          const date = new Date(bourse.date_decision);
          const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          statsObj.par_mois[mois] = (statsObj.par_mois[mois] || 0) + 1;
        }
      });
    });

    // Statistiques pour les non boursiers
    nonBoursiers.forEach(etudiant => {
      const faculteNom = getNomFaculte(etudiant.faculte);
      statsObj.par_faculte[faculteNom] = (statsObj.par_faculte[faculteNom] || 0) + 1;

      const niveau = etudiant.niveau || 'Non spécifié';
      statsObj.par_niveau[niveau] = (statsObj.par_niveau[niveau] || 0) + 1;
    });

    setStats(statsObj);
  };

  // Extraire les listes pour les filtres
  const extractFilterLists = () => {
    const facultesSet = new Set();
    const niveauxSet = new Set();
    const anneesSet = new Set();

    // Pour les bourses rejetées
    etudiantsRejetes.forEach(etudiant => {
      const faculteNom = getNomFaculte(etudiant.faculte);
      if (faculteNom && faculteNom !== "N/A") {
        facultesSet.add(faculteNom);
      }

      if (etudiant.niveau) niveauxSet.add(etudiant.niveau);

      etudiant.bourses.forEach(bourse => {
        if (bourse.annee_academique) {
          anneesSet.add(bourse.annee_academique);
        }
      });
    });

    // Pour les non boursiers
    etudiantsNonBoursiers.forEach(etudiant => {
      const faculteNom = getNomFaculte(etudiant.faculte);
      if (faculteNom && faculteNom !== "N/A") {
        facultesSet.add(faculteNom);
      }

      if (etudiant.niveau) niveauxSet.add(etudiant.niveau);
    });

    setFacultes(Array.from(facultesSet).sort());
    setNiveaux(Array.from(niveauxSet).sort());
    setAnnees(Array.from(anneesSet).sort((a, b) => b.localeCompare(a)));
  };

  // Appliquer les filtres
  const applyFilters = () => {
    let filtered = activeTab === 'rejetees' ? [...etudiantsRejetes] : [...etudiantsNonBoursiers];

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

    // Filtre par faculté
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

    // Filtre par année académique (uniquement pour les rejetés)
    if (activeTab === 'rejetees' && filterAnnee) {
      filtered = filtered.filter(etudiant =>
        etudiant.bourses.some(b => b.annee_academique === filterAnnee)
      );
    }

    // Filtre par raison (uniquement pour les rejetés)
    if (activeTab === 'rejetees' && filterRaison) {
      filtered = filtered.filter(etudiant => {
        if (etudiant.bourses.length === 0) return false;

        const bourse = etudiant.bourses[0];
        if (!bourse.conditions) return filterRaison === 'Raison non spécifiée';

        const conditions = bourse.conditions.toLowerCase();

        switch (filterRaison) {
          case 'Dossier incomplet':
            return conditions.includes('dossier incomplet');
          case 'Critères non remplis':
            return conditions.includes('critères non remplis');
          case 'Quota atteint':
            return conditions.includes('quota atteint');
          case 'Revenue trop élevée':
            return conditions.includes('revenue') || conditions.includes('revenu');
          case 'Doublon d\'identité':
            return conditions.includes('doublon');
          case 'Notes insuffisantes':
            return conditions.includes('note');
          case 'Absence de documents':
            return conditions.includes('absence');
          case 'Autre raison':
            return !conditions.includes('dossier') && !conditions.includes('critères') &&
              !conditions.includes('quota') && !conditions.includes('revenue') &&
              !conditions.includes('revenu') && !conditions.includes('doublon') &&
              !conditions.includes('note') && !conditions.includes('absence');
          case 'Raison non spécifiée':
            return !bourse.conditions || bourse.conditions.trim() === '';
          default:
            return true;
        }
      });
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
    setFilterRaison("");

    if (activeTab === 'rejetees') {
      setEtudiants([...etudiantsRejetes]);
      setTotalCount(etudiantsRejetes.length);
    } else {
      setEtudiants([...etudiantsNonBoursiers]);
      setTotalCount(etudiantsNonBoursiers.length);
    }

    setTotalPages(Math.ceil(totalCount / itemsPerPage));
    setCurrentPage(1);
  };

  // Changer d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);

    if (tab === 'rejetees') {
      setEtudiants([...etudiantsRejetes]);
      setTotalCount(etudiantsRejetes.length);
    } else {
      setEtudiants([...etudiantsNonBoursiers]);
      setTotalCount(etudiantsNonBoursiers.length);
    }

    setTotalPages(Math.ceil(totalCount / itemsPerPage));

    // Réinitialiser les filtres spécifiques à l'onglet
    setFilterAnnee("");
    setFilterRaison("");
  };

  // Afficher les détails d'un étudiant
  const showEtudiantDetails = (etudiant) => {
    setSelectedEtudiant(etudiant);
    setSelectedBourse(etudiant.bourses && etudiant.bourses.length > 0 ? etudiant.bourses[0] : null);
    setShowDetailsModal(true);
  };

  // Afficher les raisons de rejet
  const showRejectionReasons = (etudiant) => {
    setSelectedEtudiant(etudiant);
    setSelectedBourse(etudiant.bourses && etudiant.bourses.length > 0 ? etudiant.bourses[0] : null);
    setShowReasonsModal(true);
  };

// Accepter une bourse (changer son statut)
const handleAcceptBourse = async () => {
  if (!selectedBourse) return;
  
  try {
    // Calculer le montant de bourse selon les règles de l'université
    let montant = 0;
    const niveau = selectedEtudiant.niveau || '';
    const codeRedoublement = selectedEtudiant.code_redoublement || 'N';
    const niveauUpper = niveau.toUpperCase();
    
    // IMPORTANT: L'étudiant devient automatiquement boursier quand on accepte sa bourse
    // Donc on calcule le montant comme si l'étudiant était boursier
    
    // Triplant = pas de bourse
    if (codeRedoublement === 'T') {
      montant = 0;
    } else {
      // Master et Doctorat
      if (niveauUpper.includes("M2") || niveauUpper.includes("M1") || 
          niveauUpper.includes("MASTER") || niveauUpper.includes("DOCTORAT") || 
          niveauUpper.includes("DOT")) {
        montant = codeRedoublement === 'N' ? 48400.00 : 48400.00 / 2;
      }
      // Licence 3
      else if (niveauUpper.includes("LICENCE 3") || niveauUpper.includes("L3")) {
        montant = codeRedoublement === 'N' ? 36300.00 : 36300.00 / 2;
      }
      // Licence 2
      else if (niveauUpper.includes("LICENCE 2") || niveauUpper.includes("L2")) {
        montant = codeRedoublement === 'N' ? 30250.00 : 30250.00 / 2;
      }
      // Licence 1
      else if (niveauUpper.includes("LICENCE 1") || niveauUpper.includes("L1")) {
        montant = codeRedoublement === 'N' ? 24200.00 : 24200.00 / 2;
      }
      // Pour les autres niveaux non spécifiés
      else {
        // Par défaut, on prend le montant de la bourse rejetée
        montant = parseFloat(selectedBourse.montant) || 0;
      }
    }
    
    // Étape 1: Mettre à jour la bourse
    const updatedBourse = { 
      ...selectedBourse, 
      status: 'ACCEPTEE', 
      montant: montant,
      date_decision: new Date().toISOString(),
      conditions: "Bourse acceptée après rejet initial"
    };
    
    const responseBourse = await api.put(`/bourses/${selectedBourse.id}/`, updatedBourse);
    
    if (responseBourse.data) {
      // Étape 2: Mettre à jour l'étudiant pour le rendre boursier
      const updatedEtudiant = {
        ...selectedEtudiant,
        boursier: 'OUI', // IMPORTANT: L'étudiant devient boursier
        bourse: montant   // Mettre à jour le champ bourse dans l'étudiant
      };
      
      try {
        // Mettre à jour l'étudiant dans la base de données
        const responseEtudiant = await api.put(`/etudiants/${selectedEtudiant.id}/`, updatedEtudiant);
        
        if (responseEtudiant.data) {
          // Étape 3: Retirer l'étudiant de la liste actuelle
          const updatedEtudiantsRejetes = etudiantsRejetes.filter(etudiant => 
            etudiant.id !== selectedEtudiant.id
          );
          
          setEtudiantsRejetes(updatedEtudiantsRejetes);
          
          if (activeTab === 'rejetees') {
            setEtudiants(updatedEtudiantsRejetes);
            setTotalCount(updatedEtudiantsRejetes.length);
          }
          
          setShowAcceptModal(false);
          showNotification(
            "Succès", 
            `Bourse acceptée avec succès. L'étudiant est maintenant boursier. Montant: ${montant.toLocaleString('fr-FR')} MGA`, 
            'success', 
            <FaRedo />
          );
        }
      } catch (etudiantError) {
        console.error("Erreur lors de la mise à jour de l'étudiant:", etudiantError);
        showNotification("Avertissement", "Bourse acceptée mais erreur lors de la mise à jour du statut boursier", 'warning');
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'acceptation:", error);
    showNotification("Erreur", "Erreur lors de l'acceptation", 'danger');
  }
};

  // Supprimer une bourse rejetée
  const handleDeleteBourse = async () => {
    if (!selectedBourse) return;

    try {
      await api.delete(`/bourses/${selectedBourse.id}/`);

      // Retirer l'étudiant de la liste
      const updatedEtudiantsRejetes = etudiantsRejetes.filter(etudiant =>
        etudiant.id !== selectedEtudiant.id
      );

      setEtudiantsRejetes(updatedEtudiantsRejetes);

      if (activeTab === 'rejetees') {
        setEtudiants(updatedEtudiantsRejetes);
        setTotalCount(updatedEtudiantsRejetes.length);
      }

      setShowDeleteModal(false);
      showNotification("Succès", "Bourse supprimée avec succès", 'success', <FaTrash />);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showNotification("Erreur", "Erreur lors de la suppression", 'danger');
    }
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
      // Préparer les données selon l'onglet actif
      const exportData = etudiants.map((etudiant, index) => {
        const bourse = etudiant.bourses && etudiant.bourses.length > 0 ? etudiant.bourses[0] : null;

        setExportProgress((index / etudiants.length) * 100);

        const data = {
          'Numéro': index + 1,
          'Matricule': etudiant.matricule || '',
          'Nom': etudiant.nom || '',
          'Prénom': etudiant.prenom || '',
          'CIN': etudiant.cin || '',
          'Date Naissance': etudiant.date_naissance ? formatDate(etudiant.date_naissance) : '',
          'Téléphone': etudiant.telephone || '',
          'Email': etudiant.email || '',
          'Faculté': getNomFaculte(etudiant.faculte),
          'Domaine': getNomDomaine(etudiant.domaine),
          'Mention': getNomMention(etudiant.mention),
          'Niveau': etudiant.niveau || ''
        };

        if (activeTab === 'rejetees' && bourse) {
          data['Montant Bourse'] = `${parseFloat(bourse.montant || 0).toLocaleString('fr-FR')} MGA`;
          data['Année Académique'] = bourse.annee_academique || '';
          data['Date Décision'] = bourse.date_decision ? formatDate(bourse.date_decision) : '';
          data['Statut'] = 'REJETEE';
          data['Raison'] = bourse.conditions || 'Non spécifiée';
        } else if (activeTab === 'nonboursiers') {
          data['Statut'] = 'NON BOURSIER';
          data['Raison'] = 'Pas de demande de bourse';
        }

        return data;
      });

      // Créer le workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeTab === 'rejetees' ? 'Bourses Rejetées' : 'Non Boursiers');

      // Télécharger
      const filename = activeTab === 'rejetees'
        ? `bourses_rejetees_${new Date().toISOString().split('T')[0]}.xlsx`
        : `non_boursiers_${new Date().toISOString().split('T')[0]}.xlsx`;

      XLSX.writeFile(wb, filename);

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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEtudiants = etudiants.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Initialiser les données
  useEffect(() => {
    const init = async () => {
      try {
        await fetchReferences();
      } catch (e) {
        console.warn('Erreur lors du chargement des références', e);
      }

      await fetchData();
    };

    init();
  }, []);

  // Re-extraire les filtres quand facultesList est chargée
  useEffect(() => {
    if (facultesList.length > 0 && (etudiantsRejetes.length > 0 || etudiantsNonBoursiers.length > 0)) {
      extractFilterLists();
    }
  }, [facultesList, etudiantsRejetes, etudiantsNonBoursiers]);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterFaculte, filterNiveau, filterAnnee, filterRaison, activeTab, etudiantsRejetes, etudiantsNonBoursiers]);

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
              <h1 className={activeTab === 'rejetees' ? 'text-danger' : 'text-secondary'}>
                {activeTab === 'rejetees' ? <FaTimes className="me-2" /> : <FaUserSlash className="me-2" />}
                {activeTab === 'rejetees' ? 'Bourses Rejetées' : 'Étudiants Non Boursiers'}
              </h1>
              <p className="text-muted mb-0">
                {activeTab === 'rejetees'
                  ? 'Liste des étudiants dont les demandes de bourse ont été rejetées'
                  : 'Liste des étudiants sans bourse (non boursiers)'}
              </p>
            </div>
            <div>
              <Button
                variant={activeTab === 'rejetees' ? 'outline-danger' : 'outline-secondary'}
                onClick={() => setShowExportModal(true)}
                className="me-2"
                disabled={etudiants.length === 0}
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

      {/* Onglets */}
      <div className="row mb-4">
        <div className="col-12">
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-3"
          >
            <Tab eventKey="rejetees" title={
              <span>
                <FaTimes className="me-1" />
                Bourses Rejetées
                <Badge bg="danger" className="ms-2">
                  {stats.total_rejetees}
                </Badge>
              </span>
            } />
            {/* <Tab eventKey="nonboursiers" title={
              <span>
                <FaUserSlash className="me-1" />
                Non Boursiers
                <Badge bg="secondary" className="ms-2">
                  {stats.total_nonboursiers}
                </Badge>
              </span>
            } /> */}
          </Tabs>
        </div>
      </div>

      {/* Statistiques */}
      {activeTab === 'rejetees' && (
        <div className="row mb-4">
          <div className="col-md-3">
            <Card className="text-center border-danger border-start-3 shadow">
              <Card.Body>
                <FaTimes className="text-danger display-6 mb-3" />
                <Card.Title className="text-danger">Bourses Rejetées</Card.Title>
                <h2 className="text-dark">{stats.total_rejetees}</h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center border-warning border-start-3 shadow">
              <Card.Body>
                <FaUniversity className="text-warning display-6 mb-3" />
                <Card.Title className="text-warning">Facultés</Card.Title>
                <h2 className="text-dark">
                  {Object.keys(stats.par_faculte).length}
                </h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center border-info border-start-3 shadow">
              <Card.Body>
                <FaGraduationCap className="text-info display-6 mb-3" />
                <Card.Title className="text-info">Niveaux</Card.Title>
                <h2 className="text-dark">
                  {Object.keys(stats.par_niveau).length}
                </h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center border-secondary border-start-3 shadow">
              <Card.Body>
                <FaExclamationCircle className="text-secondary display-6 mb-3" />
                <Card.Title className="text-secondary">Raisons</Card.Title>
                <h2 className="text-dark">
                  {Object.keys(stats.par_raison).length}
                </h2>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'nonboursiers' && (
        <div className="row mb-4">
          <div className="col-md-4">
            <Card className="text-center border-secondary border-start-3 shadow">
              <Card.Body>
                <FaUserSlash className="text-secondary display-6 mb-3" />
                <Card.Title className="text-secondary">Non Boursiers</Card.Title>
                <h2 className="text-dark">{stats.total_nonboursiers}</h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-4">
            <Card className="text-center border-warning border-start-3 shadow">
              <Card.Body>
                <FaUniversity className="text-warning display-6 mb-3" />
                <Card.Title className="text-warning">Facultés</Card.Title>
                <h2 className="text-dark">
                  {Object.keys(stats.par_faculte).length}
                </h2>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-4">
            <Card className="text-center border-info border-start-3 shadow">
              <Card.Body>
                <FaGraduationCap className="text-info display-6 mb-3" />
                <Card.Title className="text-info">Niveaux</Card.Title>
                <h2 className="text-dark">
                  {Object.keys(stats.par_niveau).length}
                </h2>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

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
            {activeTab === 'rejetees' && (
              <>
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
                <div className="col-md-2">
                  <Form.Select
                    value={filterRaison}
                    onChange={(e) => setFilterRaison(e.target.value)}
                  >
                    <option value="">Toutes raisons</option>
                    {raisons.map((raison, index) => (
                      <option key={index} value={raison}>{raison}</option>
                    ))}
                  </Form.Select>
                </div>
              </>
            )}
            <div className="col-md-3 text-end">
              <Button
                variant="outline-secondary"
                onClick={clearFilters}
                className="me-2"
              >
                <FaFilter className="me-1" /> Effacer
              </Button>
              <Badge bg={activeTab === 'rejetees' ? 'danger' : 'secondary'} className="align-middle py-2">
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
              <Spinner animation="border" variant={activeTab === 'rejetees' ? 'danger' : 'secondary'} />
              <p className="mt-3 text-muted">
                Chargement des {activeTab === 'rejetees' ? 'bourses rejetées' : 'non boursiers'}...
              </p>
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
              <p className="text-muted">
                {activeTab === 'rejetees'
                  ? 'Aucun étudiant avec bourse rejetée trouvé'
                  : 'Aucun étudiant non boursier trouvé'}
              </p>
              {(searchTerm || filterFaculte || filterNiveau || filterAnnee || filterRaison) ? (
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
                      {activeTab === 'rejetees' && (
                        <>
                          <th>Bourse</th>
                          <th>Décision</th>
                        </>
                      )}
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEtudiants.map((etudiant, index) => {
                      const bourse = etudiant.bourses && etudiant.bourses.length > 0 ? etudiant.bourses[0] : null;

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
                          {activeTab === 'rejetees' && bourse && (
                            <>
                              <td>
                                <div className="fw-bold text-danger">
                                  {bourse.montant ? `${parseFloat(bourse.montant).toLocaleString('fr-FR')} MGA` : '0 MGA'}
                                </div>
                                <div className="text-muted small">
                                  Année: {bourse.annee_academique || '-'}
                                </div>
                                <Badge bg="danger" pill className="mt-1">
                                  REJETEE
                                </Badge>
                              </td>
                              <td>
                                {bourse.date_decision ? (
                                  <div className="small">
                                    <div>
                                      <FaCalendarAlt className="me-1" />
                                      {formatDate(bourse.date_decision)}
                                    </div>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-0"
                                      onClick={() => showRejectionReasons(etudiant)}
                                    >
                                      <FaCommentAlt className="me-1" />
                                      Voir raison
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted">Non spécifié</span>
                                )}
                              </td>
                            </>
                          )}
                          {activeTab === 'nonboursiers' && (
                            <td colSpan="2">
                              <Badge bg="secondary" pill>
                                NON BOURSIER
                              </Badge>
                              <div className="text-muted small mt-1">
                                Pas de demande de bourse
                              </div>
                            </td>
                          )}
                          <td className="text-center">
                            <div className="btn-group btn-group-sm" role="group">
                              <Button
                                variant="outline-info"
                                onClick={() => showEtudiantDetails(etudiant)}
                                title="Voir détails"
                              >
                                <FaEye />
                              </Button>
                              {activeTab === 'rejetees' && bourse && (
                                <>
                                  <Button
                                    variant="outline-success"
                                    onClick={() => {
                                      setSelectedEtudiant(etudiant);
                                      setSelectedBourse(bourse);
                                      setShowAcceptModal(true);
                                    }}
                                    title="Accepter la bourse"
                                  >
                                    <FaRedo />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    onClick={() => {
                                      setSelectedEtudiant(etudiant);
                                      setSelectedBourse(bourse);
                                      setShowDeleteModal(true);
                                    }}
                                    title="Supprimer la bourse"
                                  >
                                    <FaTrash />
                                  </Button>
                                </>
                              )}
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
          <Modal.Title>Détails de l'étudiant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
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
                        {selectedEtudiant.date_naissance
                          ? formatDate(selectedEtudiant.date_naissance)
                          : 'Non spécifié'
                        }
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
                    <tr>
                      <th>Statut boursier:</th>
                      <td>
                        <Badge bg={selectedEtudiant.boursier === 'OUI' ? 'success' : 'secondary'}>
                          {selectedEtudiant.boursier === 'OUI' ? 'BOURSIER' : 'NON BOURSIER'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {activeTab === 'rejetees' && selectedBourse && (
                <div className="col-md-6">
                  <h5 className="text-danger mb-3">Informations bourse rejetée</h5>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <th>Montant:</th>
                        <td className="fw-bold text-danger">
                          {selectedBourse.montant ? `${parseFloat(selectedBourse.montant).toLocaleString('fr-FR')} MGA` : '0 MGA'}
                        </td>
                      </tr>
                      <tr>
                        <th>Année académique:</th>
                        <td>{selectedBourse.annee_academique || 'Non spécifié'}</td>
                      </tr>
                      <tr>
                        <th>Statut:</th>
                        <td>
                          <Badge bg="danger" pill>REJETEE</Badge>
                        </td>
                      </tr>
                      <tr>
                        <th>Date décision:</th>
                        <td>
                          {selectedBourse.date_decision
                            ? formatDate(selectedBourse.date_decision)
                            : 'Non spécifié'
                          }
                        </td>
                      </tr>
                      <tr>
                        <th>Date début:</th>
                        <td>
                          {selectedBourse.date_debut
                            ? formatDate(selectedBourse.date_debut)
                            : 'Non spécifié'
                          }
                        </td>
                      </tr>
                      <tr>
                        <th>Date fin:</th>
                        <td>
                          {selectedBourse.date_fin
                            ? formatDate(selectedBourse.date_fin)
                            : 'Non spécifié'
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

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
                    <div className="col-md-4">
                      <strong>Code redoublement:</strong>
                      <Badge bg={
                        selectedEtudiant.code_redoublement === 'N' ? 'success' :
                          selectedEtudiant.code_redoublement === 'R' ? 'warning' : 'danger'
                      }>
                        {selectedEtudiant.code_redoublement === 'N' ? 'Non redoublant' :
                          selectedEtudiant.code_redoublement === 'R' ? 'Redoublant' : 'Triplant'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {activeTab === 'rejetees' && selectedBourse && selectedBourse.conditions && (
                <div className="col-12 mt-3">
                  <h5 className="text-danger mb-3">Raison du rejet</h5>
                  <div className="bg-light p-3 rounded border border-danger">
                    {selectedBourse.conditions}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Raisons de Rejet */}
      <Modal show={showReasonsModal} onHide={() => setShowReasonsModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Raison du rejet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && selectedBourse && (
            <div className="text-center">
              <FaTimes className="text-danger mb-3" size={48} />
              <h5>{selectedEtudiant.nom} {selectedEtudiant.prenom}</h5>
              <p className="text-muted">Matricule: {selectedEtudiant.matricule}</p>

              <div className="bg-light p-3 rounded mt-3">
                <h6 className="text-danger">Raison principale :</h6>
                <p className="fw-bold">
                  {selectedBourse.conditions
                    ? selectedBourse.conditions.split('.')[0]
                    : 'Raison non spécifiée'}
                </p>

                {selectedBourse.conditions && selectedBourse.conditions.length > 100 && (
                  <>
                    <h6 className="text-danger mt-3">Détails :</h6>
                    <p>{selectedBourse.conditions}</p>
                  </>
                )}
              </div>

              <Alert variant="info" className="mt-3">
                <FaHistory className="me-2" />
                Date de décision: {selectedBourse.date_decision
                  ? formatDate(selectedBourse.date_decision)
                  : 'Non spécifiée'
                }
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReasonsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
{/* Modal Accepter Bourse - CORRIGÉ */}
<Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)}>
  <Modal.Header closeButton className="bg-success text-white">
    <Modal.Title>Accepter la bourse</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedEtudiant && selectedBourse && (
      <div className="text-center">
        <FaRedo className="text-success mb-3" size={48} />
        <h5>Confirmer l'acceptation de la bourse</h5>
        <p className="mt-3">
          <strong>{selectedEtudiant.nom} {selectedEtudiant.prenom}</strong><br />
          <span className="text-muted">Matricule: {selectedEtudiant.matricule}</span>
        </p>
        
        {/* Calculer le montant avant de l'afficher */}
        {(() => {
          // Calculer le montant selon les règles de l'université
          let montant = 0;
          const niveau = selectedEtudiant.niveau || '';
          const codeRedoublement = selectedEtudiant.code_redoublement || 'N';
          const niveauUpper = niveau.toUpperCase();
          
          // IMPORTANT: L'étudiant DEVRAIT être boursier après acceptation
          // Donc on calcule le montant comme s'il était boursier
          
          if (codeRedoublement === 'T') {
            montant = 0;
          } else {
            // Master et Doctorat
            if (niveauUpper.includes("M2") || niveauUpper.includes("M1") ||
                niveauUpper.includes("MASTER") || niveauUpper.includes("DOCTORAT") ||
                niveauUpper.includes("DOT")) {
              montant = codeRedoublement === 'N' ? 48400.00 : 48400.00 / 2;
            }
            // Licence 3
            else if (niveauUpper.includes("LICENCE 3") || niveauUpper.includes("L3")) {
              montant = codeRedoublement === 'N' ? 36300.00 : 36300.00 / 2;
            }
            // Licence 2
            else if (niveauUpper.includes("LICENCE 2") || niveauUpper.includes("L2")) {
              montant = codeRedoublement === 'N' ? 30250.00 : 30250.00 / 2;
            }
            // Licence 1
            else if (niveauUpper.includes("LICENCE 1") || niveauUpper.includes("L1")) {
              montant = codeRedoublement === 'N' ? 24200.00 : 24200.00 / 2;
            }
          }
          
          return (
            <div className="my-4">
              <div className="mb-2">
                <strong>Montant de la bourse à accorder:</strong>
              </div>
              <div className="fs-4 fw-bold text-success">
                {montant.toLocaleString('fr-FR')} MGA
              </div>
              <div className="text-muted small mt-1">
                Ce montant sera attribué automatiquement à l'étudiant.
                <br />
                <strong>Note:</strong> L'étudiant deviendra automatiquement boursier.
              </div>
            </div>
          );
        })()}
        
        {/* Afficher les informations sur le calcul de la bourse */}
        {selectedEtudiant.niveau && selectedEtudiant.code_redoublement && (
          <Alert variant="info" className="text-start">
            <FaGraduationCap className="me-2" />
            <strong>Calcul de la bourse:</strong><br />
            • Niveau: {selectedEtudiant.niveau}<br />
            • Statut: {selectedEtudiant.code_redoublement === 'N' ? 'Non redoublant' :
              selectedEtudiant.code_redoublement === 'R' ? 'Redoublant' : 'Triplant'}<br />
            • <strong>Nouveau statut boursier:</strong> OUI (après acceptation)<br />
            • Montant calculé selon les règles de l'université
          </Alert>
        )}
        
        <Alert variant="success">
          <FaCheck className="me-2" />
          Cette action changera le statut de la bourse de "REJETEE" à "ACCEPTEE".
          L'étudiant deviendra boursier et apparaîtra dans la liste des bourses acceptées.
        </Alert>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowAcceptModal(false)}>
      Annuler
    </Button>
    <Button variant="success" onClick={handleAcceptBourse}>
      <FaRedo className="me-1" /> Accepter la bourse
    </Button>
  </Modal.Footer>
</Modal>

      {/* Modal Supprimer Bourse */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Supprimer la bourse rejetée</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && selectedBourse && (
            <div className="text-center">
              <FaTrash className="text-danger mb-3" size={48} />
              <h5>Confirmer la suppression</h5>
              <p className="mt-3">
                <strong>{selectedEtudiant.nom} {selectedEtudiant.prenom}</strong><br />
                <span className="text-muted">Matricule: {selectedEtudiant.matricule}</span>
              </p>
              <p>
                Montant: <strong className="text-danger">
                  {selectedBourse.montant ? `${parseFloat(selectedBourse.montant).toLocaleString('fr-FR')} MGA` : '0 MGA'}
                </strong>
              </p>
              <Alert variant="warning">
                <FaExclamationCircle className="me-2" />
                Cette action supprimera définitivement la demande de bourse rejetée.
                Cette opération est irréversible.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteBourse}>
            <FaTrash className="me-1" /> Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Exportation */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton className={activeTab === 'rejetees' ? 'bg-danger text-white' : 'bg-secondary text-white'}>
          <Modal.Title>
            Exporter les données - {activeTab === 'rejetees' ? 'Bourses Rejetées' : 'Non Boursiers'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={activeTab === 'rejetees' ? 'danger' : 'secondary'}>
            <FaFileExcel className="me-2" />
            Vous allez exporter {totalCount} étudiant(s) {activeTab === 'rejetees' ? 'avec bourse(s) rejetée(s)' : 'non boursier(s)'}
          </Alert>

          {exporting ? (
            <div className="text-center">
              <Spinner animation="border" variant={activeTab === 'rejetees' ? 'danger' : 'secondary'} className="mb-3" />
              <p>Exportation en cours...</p>
              <ProgressBar
                now={exportProgress}
                animated
                label={`${Math.round(exportProgress)}%`}
                variant={activeTab === 'rejetees' ? 'danger' : 'secondary'}
              />
            </div>
          ) : (
            <p>Cliquez sur le bouton ci-dessous pour télécharger le fichier Excel.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)} disabled={exporting}>
            Annuler
          </Button>
          <Button
            variant={activeTab === 'rejetees' ? 'danger' : 'secondary'}
            onClick={exportToExcel}
            disabled={exporting || totalCount === 0}
          >
            <FaFileExcel className="me-2" />
            Exporter vers Excel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}