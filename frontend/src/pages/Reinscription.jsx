import React, { useState, useEffect, useCallback } from "react";
import { FaEdit, FaTrash, FaSearch, FaArrowUp, FaArrowDown, FaSync } from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Pagination from 'react-bootstrap/Pagination';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import 'bootstrap/dist/css/bootstrap.min.css';
import { etudiantApi } from '../api';

export default function Reinscription() {
  // États pour les données
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    redoublants: 0,
    boursiers: 0,
    total_bourses: 0,
    non_boursiers: 0
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // États pour les modales
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  
  // États pour les formulaires
  const [form, setForm] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    telephone: "",
    cin: "",
    annee_bacc: new Date().getFullYear().toString(),
    code_redoublement: "R", // Par défaut R pour réinscription
    boursier: "OUI",
    faculte: "",
    domaine: "",
    niveau: "Licence 2", // Par défaut Licence 2 car c'est une réinscription
    nationalite: "Malagasy",
    mention: "",
  });

  const [editId, setEditId] = useState(null);
  const [etudiantToDelete, setEtudiantToDelete] = useState(null);
  const [etudiantForPromotion, setEtudiantForPromotion] = useState(null);
  const [promotionDecision, setPromotionDecision] = useState("passe");
  const [newBourse, setNewBourse] = useState(0);
  const [newNiveau, setNewNiveau] = useState("");
  const [newCodeRedoublement, setNewCodeRedoublement] = useState("N");

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Structure des données des facultés
  const facultesData = {
    "FACULTE DES SCIENCES - TUL": {
      domaine: "Sciences et Technologies",
      mentions: [
        "TUL - L - FST - PHYSIQUE ET APPLICATION",
        "TUL - M - FST - PHYSIQUE ET APPLICATION",
        "TUL  - L - MATHEMATIQUES ET INFORMATIQUE",
        "TUL - L - FST - SCIENCES DE LA TERRE",
        "TUL - M - FST - Sciences de la Terre",
        "TUL - L - FST - SCIENCES DE LA VIE",
        "TUL - M - FST - Sciences de la Vie",
        "TUL - L - FST - BIODIVERSITE ET ENVIRONNEMENT",
        "TUL - M - FST - CHIMIE"
      ]
    },
    "FACULTE DE MEDECINE - TUL": {
      domaine: "Sciences de la Santé",
      mentions: [
        "TUL - L - FACMED - MEDECINE HUMAINE",
        "TUL - M - FACMED - MEDECINE HUMAINE",
        "TUL - D - FACMED - MEDECINE HUMAINE"
      ]
    },
    "FACULTE DES LETTRES - TUL": {
      domaine: "Arts, Lettres et Sciences Humaines",
      mentions: [
        "TUL - L - LETTRES - HISTOIRE",
        "TUL - L - LETTRES - GEOGRAPHIE",
        "TUL - L - LETTRES - PHILOSOPHIE",
        "TUL - L - LETTRES - MALAGASY",
        "TUL - L - LETTRES - ETUDES FRANCAISES ET FRANCOPHONES"
      ]
    },
    "DEGS - TUL": {
      domaine: "Sciences de la Société",
      mentions: [
        "TUL - L - DEGS - GESTION",
        "TUL - L - DEGS - ECONOMIE",
        "TUL - M - DEGS - ECONOMIE",
        "TUL - L - DEGS - DROIT"
      ]
    },
    "ENS - TUL": {
      domaine: "Sciences de l'éducation",
      mentions: [
        "TUL - L - ENS - SCIENCES",
        "TUL - M - ENS - SCIENCES",
        "TUL - L - ENS - LETTRES",
        "TUL - M - ENS - LETTRES"
      ]
    },
    "IHSM - TUL": {
      domaine: "Sciences et Technologies",
      mentions: [
        "TUL - L - IHSM - Sciences Marines et Halieutiques"
      ]
    },
    "IES ANOSY - TUL": {
      domaine: "Sciences et Technologies",
      mentions: [
        "TUL  - L - IES ANOSY - TECHNIQUE DE L'ENVIRONNEMENT MARIN ET TERRESTRE"
      ]
    },
    "IES TOLIARA - TUL": {
      domaine: "Sciences et Technologies",
      mentions: [
        "TUL - L - IES TUL - AGRONOMIE"
      ]
    }
  };

  // Fonction pour calculer la bourse selon les règles du backend (avec code T)
  const calculateBourse = (niveau, codeRedoublement, boursier) => {
    let montant = 0.0;
    
    if (boursier !== 'OUI') {
      return montant;
    }
    
    // TRI PLANT : bourse à 0
    if (codeRedoublement === 'T') {
      return 0.0;
    }
    
    const niveauUpper = niveau.toUpperCase();
    
    // Master et Doctorat
    if (niveauUpper.includes("M2") || niveauUpper.includes("M1") || 
        niveauUpper.includes("MASTER") || niveauUpper.includes("DOCTORAT") || 
        niveauUpper.includes("DOT")) {
      if (codeRedoublement === 'N') {
        montant = 48400.00;
      } else if (codeRedoublement === 'R') {
        montant = 48400.00 / 2; // Redoublant: moitié du montant
      }
    }
    // Licence 3
    else if (niveauUpper.includes("LICENCE 3") || niveauUpper.includes("L3")) {
      if (codeRedoublement === 'N') {
        montant = 36300.00;
      } else if (codeRedoublement === 'R') {
        montant = 36300.00 / 2; // Redoublant: moitié du montant
      }
    }
    // Licence 2
    else if (niveauUpper.includes("LICENCE 2") || niveauUpper.includes("L2")) {
      if (codeRedoublement === 'N') {
        montant = 30250.00;
      } else if (codeRedoublement === 'R') {
        montant = 30250.00 / 2; // Redoublant: moitié du montant
      }
    }
    // Licence 1
    else if (niveauUpper.includes("LICENCE 1") || niveauUpper.includes("L1")) {
      if (codeRedoublement === 'N') {
        montant = 24200.00;
      } else if (codeRedoublement === 'R') {
        montant = 24200.00 / 2; // Redoublant: moitié du montant
      }
    }
    
    return montant;
  };

  // Fonctions pour gérer les changements de faculté
  const handleFaculteChange = (selectedFaculte) => {
    const faculteInfo = facultesData[selectedFaculte];
    
    const updatedForm = {
      ...form,
      faculte: selectedFaculte,
      domaine: faculteInfo ? faculteInfo.domaine : "",
      mention: "" // Réinitialiser la mention quand on change de faculté
    };
    
    setForm(updatedForm);
  };

  const getMentionsForFaculte = (faculte) => {
    if (!faculte) return [];
    const faculteInfo = facultesData[faculte];
    return faculteInfo ? faculteInfo.mentions : [];
  };

  // Listes dérivées des données
  const facultes = Object.keys(facultesData);
  const domaines = [...new Set(Object.values(facultesData).map(f => f.domaine))];

  // Fonction pour formater les données
  const formatEtudiantData = (data) => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }

    if (typeof data === 'object') {
      const values = Object.values(data);
      if (values.length > 0 && Array.isArray(values[0])) {
        return values[0];
      }
      return [];
    }

    return [];
  };

  // Charger les étudiants (seulement ceux avec code_redoublement = "R" ou "T")
  const fetchEtudiants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        // Filtrer uniquement les redoublants (R) et triplants (T)
        code_redoublement__in: "R,T",
      };

      if (filterNiveau) {
        params.niveau = filterNiveau;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await etudiantApi.getEtudiants(params);
      const etudiantsData = formatEtudiantData(response.data);
      
      setEtudiants(etudiantsData);
      
      // Pour la pagination
      let count = etudiantsData.length;
      if (response.data && response.data.count) {
        count = response.data.count;
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        count = Object.keys(response.data).length;
      }
      
      setTotalCount(count);
      setTotalPages(Math.ceil(count / itemsPerPage));

    } catch (err) {
      console.error("Erreur lors du fetch:", err);
      
      let errorMessage = "Erreur lors du chargement des données";
      if (err.response) {
        errorMessage = `Erreur ${err.response.status}: ${err.response.statusText}`;
        if (err.response.data) {
          errorMessage += ` - ${JSON.stringify(err.response.data)}`;
        }
      } else if (err.request) {
        errorMessage = "Pas de réponse du serveur. Vérifiez que le serveur Django est en marche.";
      } else {
        errorMessage = `Erreur: ${err.message}`;
      }
      
      setError(errorMessage);
      setEtudiants([]);
      setTotalCount(0);
      setTotalPages(1);
      
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filterNiveau, searchTerm]);

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const response = await etudiantApi.getStats();
      
      if (response.data) {
        setStats(prevStats => ({
          ...prevStats,
          ...response.data
        }));
      }
    } catch (err) {
      console.error("Erreur stats:", err);
    }
  }, []);

  // Charger les données
  useEffect(() => {
    fetchEtudiants();
    fetchStats();
  }, [fetchEtudiants, fetchStats]);

  // Fonction pour montrer les toasts
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Ouvrir modal d'édition
  const openEditModal = (etudiant) => {
    const formattedEtudiant = {
      matricule: etudiant.matricule || "",
      nom: etudiant.nom || "",
      prenom: etudiant.prenom || "",
      date_naissance: etudiant.date_naissance ?
        etudiant.date_naissance.split('T')[0] : "",
      telephone: etudiant.telephone || "",
      cin: etudiant.cin || "",
      annee_bacc: etudiant.annee_bacc ? etudiant.annee_bacc.toString() : "",
      code_redoublement: etudiant.code_redoublement || "R",
      boursier: etudiant.boursier || "OUI",
      faculte: etudiant.faculte || "",
      domaine: etudiant.domaine || "",
      niveau: etudiant.niveau || "Licence 2",
      nationalite: etudiant.nationalite || "Malagasy",
      mention: etudiant.mention || "",
    };

    setForm(formattedEtudiant);
    setEditId(etudiant.id);
    setShowModal(true);
  };

  // Calculer le nouveau niveau, code redoublement et bourse pour la promotion
  const calculatePromotionDetails = (currentNiveau, decision, boursier) => {
    let nouveauNiveau = "";
    let codeRedoublement = "N";
    
    if (decision === "passe") {
      if (currentNiveau.includes("Licence 1")) {
        nouveauNiveau = "Licence 2";
      } else if (currentNiveau.includes("Licence 2")) {
        nouveauNiveau = "Licence 3";
      } else if (currentNiveau.includes("Licence 3")) {
        nouveauNiveau = "Master 1";
      } else if (currentNiveau.includes("Master 1")) {
        nouveauNiveau = "Master 2";
      } else if (currentNiveau.includes("Master 2")) {
        nouveauNiveau = "Doctorat 1";
      } else {
        nouveauNiveau = currentNiveau;
      }
      codeRedoublement = "N"; // Admis = non redoublant
    } else if (decision === "redouble") {
      // Redoublement : garde le même niveau
      nouveauNiveau = currentNiveau;
      codeRedoublement = "R"; // Redoublant
    } else if (decision === "triplant") {
      // Triplant : garde le même niveau
      nouveauNiveau = currentNiveau;
      codeRedoublement = "T"; // Triplant (code T)
    }
    
    // Calculer la bourse selon les règles
    const nouvelleBourse = calculateBourse(nouveauNiveau, codeRedoublement, boursier);
    
    return { nouveauNiveau, codeRedoublement, nouvelleBourse };
  };

  // Ouvrir modal de promotion
  const openPromotionModal = (etudiant) => {
    setEtudiantForPromotion(etudiant);
    setPromotionDecision("passe");
    
    // Calculer les détails initiaux
    const { nouveauNiveau, codeRedoublement, nouvelleBourse } = 
      calculatePromotionDetails(etudiant.niveau, "passe", etudiant.boursier);
    
    setNewNiveau(nouveauNiveau);
    setNewCodeRedoublement(codeRedoublement);
    setNewBourse(nouvelleBourse);
    setShowPromotionModal(true);
  };

  // Effet pour recalculer les détails quand la décision de promotion change
  useEffect(() => {
    if (etudiantForPromotion && showPromotionModal) {
      const { nouveauNiveau, codeRedoublement, nouvelleBourse } = 
        calculatePromotionDetails(etudiantForPromotion.niveau, promotionDecision, etudiantForPromotion.boursier);
      
      setNewNiveau(nouveauNiveau);
      setNewCodeRedoublement(codeRedoublement);
      setNewBourse(nouvelleBourse);
    }
  }, [promotionDecision, etudiantForPromotion, showPromotionModal]);

  // Sauvegarder étudiant (SEULEMENT MODIFICATION)
  const saveEtudiant = async () => {
    if (!editId) {
      showToast("Seule la modification est autorisée", 'warning');
      return;
    }

    // Validation
    const requiredFields = ['matricule', 'nom', 'niveau', 'faculte'];
    const missingFields = requiredFields.filter(field => !form[field]?.trim());

    if (missingFields.length > 0) {
      showToast(`Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`, 'warning');
      return;
    }

    try {
      const dataToSend = { ...form };
      
      // Nettoyer les données
      Object.keys(dataToSend).forEach(key => {
        if (typeof dataToSend[key] === 'string') {
          dataToSend[key] = dataToSend[key].trim();
        }
      });
      
      // Calculer la bourse automatiquement selon les règles
      if (dataToSend.boursier === "OUI") {
        // Utiliser la fonction de calcul qui respecte les règles
        dataToSend.bourse = calculateBourse(
          dataToSend.niveau, 
          dataToSend.code_redoublement, 
          dataToSend.boursier
        );
      } else {
        dataToSend.bourse = 0;
      }
      
      await etudiantApi.updateEtudiant(editId, dataToSend);
      showToast("Étudiant modifié avec succès!", 'success');
      
      setShowModal(false);
      fetchEtudiants();
      fetchStats();

    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de la sauvegarde";
      
      // Afficher les erreurs de validation détaillées
      if (err.response?.data) {
        const errors = [];
        for (const [field, messages] of Object.entries(err.response.data)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(', ')}`);
          } else {
            errors.push(`${field}: ${messages}`);
          }
        }
        showToast(`Erreurs de validation: ${errors.join('; ')}`, 'danger');
      } else {
        showToast(errorMsg, 'danger');
      }
    }
  };

  // Gérer la promotion
  const handlePromotion = async () => {
    if (!etudiantForPromotion) return;

    try {
      const { nouveauNiveau, codeRedoublement } = 
        calculatePromotionDetails(etudiantForPromotion.niveau, promotionDecision, etudiantForPromotion.boursier);
      
      // CRÉER UNE COPIE COMPLÈTE DES DONNÉES DE L'ÉTUDIANT
      const updatedData = {
        matricule: etudiantForPromotion.matricule,
        nom: etudiantForPromotion.nom,
        prenom: etudiantForPromotion.prenom,
        date_naissance: etudiantForPromotion.date_naissance,
        telephone: etudiantForPromotion.telephone || "",
        cin: etudiantForPromotion.cin || "",
        annee_bacc: etudiantForPromotion.annee_bacc || new Date().getFullYear().toString(),
        code_redoublement: codeRedoublement,
        boursier: etudiantForPromotion.boursier || "OUI",
        faculte: etudiantForPromotion.faculte,
        domaine: etudiantForPromotion.domaine || "",
        niveau: nouveauNiveau,
        nationalite: etudiantForPromotion.nationalite || "Malagasy",
        mention: etudiantForPromotion.mention || "",
        bourse: newBourse
      };
      
      console.log("Données envoyées pour promotion:", updatedData);
      
      // Essayer d'abord avec patch (mise à jour partielle)
      try {
        const patchData = {
          niveau: nouveauNiveau,
          code_redoublement: codeRedoublement,
          bourse: newBourse
        };
        
        console.log("Tentative avec PATCH:", patchData);
        await etudiantApi.patchEtudiant(etudiantForPromotion.id, patchData);
      } catch (patchError) {
        console.log("PATCH échoué, tentative avec PUT complet");
        // Si PATCH échoue, essayer avec PUT complet
        await etudiantApi.updateEtudiant(etudiantForPromotion.id, updatedData);
      }
      
      // Afficher un message approprié
      let message = "";
      if (promotionDecision === "passe") {
        message = `Étudiant promu de ${etudiantForPromotion.niveau} à ${nouveauNiveau} - Bourse: ${newBourse.toLocaleString()} MGA`;
      } else if (promotionDecision === "redouble") {
        message = `Étudiant redoublant maintenu en ${etudiantForPromotion.niveau} - Bourse: ${newBourse.toLocaleString()} MGA (moitié)`;
      } else {
        message = `Étudiant triplant maintenu en ${etudiantForPromotion.niveau} - Code: T - Bourse: 0 MGA`;
      }
      
      showToast(message, 'success');
      setShowPromotionModal(false);
      setEtudiantForPromotion(null);
      fetchEtudiants();
      fetchStats();
      
    } catch (err) {
      console.error("Erreur promotion:", err);
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        "Erreur lors de la mise à jour";
      
      // Afficher les erreurs de validation détaillées
      if (err.response?.data) {
        console.error("Données d'erreur:", err.response.data);
        const errors = [];
        for (const [field, messages] of Object.entries(err.response.data)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(', ')}`);
          } else {
            errors.push(`${field}: ${messages}`);
          }
        }
        showToast(`Erreurs: ${errors.join('; ')}`, 'danger');
      } else {
        showToast(errorMsg, 'danger');
      }
    }
  };

  // Ouvrir modal de suppression
  const openDeleteModal = (etudiant) => {
    setEtudiantToDelete(etudiant);
    setShowDeleteModal(true);
  };

  // Confirmer suppression
  const confirmDelete = async () => {
    if (!etudiantToDelete) return;

    try {
      await etudiantApi.deleteEtudiant(etudiantToDelete.id);
      showToast("Étudiant supprimé avec succès!", 'success');
      setShowDeleteModal(false);
      setEtudiantToDelete(null);
      fetchEtudiants();
      fetchStats();
    } catch (err) {
      console.error("Erreur suppression:", err);
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        "Erreur lors de la suppression";
      showToast(errorMsg, 'danger');
    }
  };

  // Gérer la recherche
  const handleSearch = () => {
    setCurrentPage(1);
    fetchEtudiants();
  };

  // Options pour les niveaux
  const niveaux = [
    "Licence 1", "Licence 2", "Licence 3",
    "Master 1", "Master 2", "Doctorat 1"
  ];

  // Pagination
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Générer les numéros de page
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Rafraîchir les données
  const refreshData = () => {
    setCurrentPage(1);
    setSearchTerm("");
    setFilterNiveau("");
    fetchEtudiants();
    fetchStats();
    showToast("Données rafraîchies", 'info');
  };

  // Fonction pour obtenir la couleur du badge selon le code redoublement
  const getCodeBadgeColor = (code) => {
    switch(code) {
      case 'N': return 'success';
      case 'R': return 'danger';
      case 'T': return 'warning';
      default: return 'secondary';
    }
  };

  // Fonction pour obtenir le libellé du code redoublement
  const getCodeLabel = (code) => {
    switch(code) {
      case 'N': return 'Non redoublant';
      case 'R': return 'Redoublant';
      case 'T': return 'Triplant';
      default: return code;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Toasts pour les notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={toast.show} 
          onClose={() => setToast({...toast, show: false})}
          delay={3000} 
          autohide
          bg={toast.type}
        >
          <Toast.Body className="text-white">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="row mb-4">
        <div className="col">
          <h1 className="text-primary">Gestion des Réinscriptions</h1>
          <p className="text-muted">
            Gestion des étudiants redoublants (code redoublement = "R" - Redoublant, "T" - Triplant)
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card border-primary">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total redoublants</h6>
              <h3 className="card-title text-primary">{stats.redoublants || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-danger">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Code R (Redoublant)</h6>
              <h3 className="card-title text-danger">{stats.redoublants || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Boursiers redoublants</h6>
              <h3 className="card-title text-warning">{stats.boursiers || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-success">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Bourses totales</h6>
              <h3 className="card-title text-success">{(stats.total_bourses || 0).toLocaleString()} MGA</h3>
            </div>
          </div>
        </div>
      </div>
      
      <br />

      {/* Barre d'outils */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-8">
              <div className="row g-3">
                <div className="col-md-4">
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
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleSearch}
                    >
                      Rechercher
                    </Button>
                  </InputGroup>
                </div>
                <div className="col-md-4">
                  <Form.Select
                    value={filterNiveau}
                    onChange={(e) => {
                      setFilterNiveau(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Tous les niveaux</option>
                    {niveaux.map((niveau, index) => (
                      <option key={index} value={niveau}>{niveau}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-center h-100">
                    <Badge bg="danger" className="me-2">R = Redoublant</Badge>
                    <Badge bg="warning" className="me-2">T = Triplant</Badge>
                    <Badge bg="success">N = Non redoublant</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <Button
                variant="outline-primary"
                onClick={refreshData}
                className="d-inline-flex align-items-center"
                title="Rafraîchir les données"
              >
                <FaSync className="me-2" /> Rafraîchir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau avec pagination */}
      <div className="card">
        <div className="card-body">
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              <Alert.Heading>Erreur de connexion!</Alert.Heading>
              <p>{error}</p>
              <p className="mb-0">Vérifiez que :</p>
              <ul className="mb-0">
                <li>Le serveur Django est en marche</li>
                <li>L'URL est correcte : http://127.0.0.1:8000/api</li>
                <li>Les endpoints API existent</li>
              </ul>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Chargement...</span>
              </Spinner>
              <p className="mt-3 text-muted">Chargement des données depuis l'API...</p>
            </div>
          ) : (
            <>
              {/* Contrôles de pagination en haut */}
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
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Form.Select>
                    <span className="ms-2">éléments par page</span>
                  </div>

                  <div>
                    <Pagination className="mb-0">
                      <Pagination.First
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                      />
                      <Pagination.Prev
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                      />

                      {getPageNumbers().map((number, index) => (
                        number === '...' ? (
                          <Pagination.Ellipsis key={index} disabled />
                        ) : (
                          <Pagination.Item
                            key={index}
                            active={number === currentPage}
                            onClick={() => paginate(number)}
                          >
                            {number}
                          </Pagination.Item>
                        )
                      ))}

                      <Pagination.Next
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      />
                      <Pagination.Last
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                </div>
              )}

              {/* Tableau */}
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <Table striped hover size="sm">
                  <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>Numéro</th>
                      <th>Matricule</th>
                      <th>Étudiant</th>
                      <th>Date Naiss.</th>
                      <th>Téléphone</th>
                      <th>CIN</th>
                      <th>Code</th>
                      <th>Niveau</th>
                      <th>Mention</th>
                      <th>Boursier</th>
                      <th>Bourse</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etudiants.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="text-center py-5">
                          {/* <FaSearch className="text-muted mb-3" size={48} /> */}
                          <p className="text-muted">Aucun étudiant redoublant ou triplant trouvé</p>
                          {searchTerm && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => {
                                setSearchTerm('');
                                fetchEtudiants();
                              }}
                            >
                              Afficher tous les étudiants
                            </Button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      etudiants.map((etudiant) => (
                        <tr key={etudiant.id}>
                          <td>
                            <small className="font-monospace">{etudiant.numero_inscription || '-'}</small>
                          </td>
                          <td className="font-monospace">{etudiant.matricule}</td>
                          <td>
                            <div className="fw-medium">{etudiant.nom} {etudiant.prenom}</div>
                            <small className="text-muted">
                              {etudiant.faculte ? etudiant.faculte.split(" - ")[0] : ''}
                            </small>
                          </td>
                          <td className="font-monospace">
                            {etudiant.date_naissance ?
                              (etudiant.date_naissance.includes('T') ?
                                etudiant.date_naissance.split('T')[0] :
                                etudiant.date_naissance)
                              : '-'}
                          </td>
                          <td className="font-monospace">{etudiant.telephone || '-'}</td>
                          <td className="font-monospace">{etudiant.cin || '-'}</td>
                          <td>
                            <Badge
                              bg={getCodeBadgeColor(etudiant.code_redoublement)}
                              className="font-monospace"
                              title={getCodeLabel(etudiant.code_redoublement)}
                            >
                              {etudiant.code_redoublement}
                            </Badge>
                          </td>
                          <td>
                            <Badge
                              bg={
                                etudiant.niveau?.includes('Licence 1') ? 'primary' :
                                  etudiant.niveau?.includes('Licence 2') ? 'info' :
                                    etudiant.niveau?.includes('Licence 3') ? 'secondary' :
                                      etudiant.niveau?.includes('Master 1') ? 'warning' :
                                        etudiant.niveau?.includes('Master 2') ? 'success' :
                                          'dark'
                              }
                              className="font-monospace"
                            >
                              {etudiant.niveau}
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted font-monospace text-wrap" style={{ 
                              wordBreak: "break-word",
                              whiteSpace: "normal"
                            }}>
                              {etudiant.mention || '-'}
                            </small>
                          </td>
                          <td>
                            <Badge
                              bg={etudiant.boursier === 'OUI' ? 'success' : 'secondary'}
                              className="font-monospace"
                            >
                              {etudiant.boursier}
                            </Badge>
                          </td>
                          <td className="fw-medium font-monospace">
                            {etudiant.bourse > 0 ? (
                              <span className="text-success">
                                {parseFloat(etudiant.bourse).toLocaleString()} MGA
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="btn-group btn-group-sm" role="group">
                              <Button
                                variant="outline-warning"
                                onClick={() => openEditModal(etudiant)}
                                title="Modifier"
                                size="sm"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-info"
                                onClick={() => openPromotionModal(etudiant)}
                                title="Gérer promotion"
                                size="sm"
                              >
                                <FaArrowUp />
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => openDeleteModal(etudiant)}
                                title="Supprimer"
                                size="sm"
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Contrôles de pagination en bas */}
              {totalCount > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount} étudiants
                  </div>

                  <div>
                    <Pagination className="mb-0">
                      <Pagination.First
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                      />
                      <Pagination.Prev
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                      />

                      {getPageNumbers().map((number, index) => (
                        number === '...' ? (
                          <Pagination.Ellipsis key={index} disabled />
                        ) : (
                          <Pagination.Item
                            key={index}
                            active={number === currentPage}
                            onClick={() => paginate(number)}
                          >
                            {number}
                          </Pagination.Item>
                        )
                      ))}

                      <Pagination.Next
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                      />
                      <Pagination.Last
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>

                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          paginate(page);
                        }
                      }}
                      style={{ width: '70px', marginRight: '10px' }}
                    />
                    <span className="text-muted">sur {totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>Modifier l'étudiant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formMatricule">
                  <Form.Label>Matricule <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={form.matricule}
                    onChange={(e) => setForm({...form, matricule: e.target.value.toUpperCase()})}
                    placeholder="Ex: ETU001234"
                    required
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formCin">
                  <Form.Label>CIN</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.cin}
                    onChange={(e) => setForm({...form, cin: e.target.value.toUpperCase()})}
                    placeholder="Ex: 102345678901"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formNom">
                  <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({...form, nom: e.target.value.toUpperCase()})}
                    placeholder="Nom de famille"
                    required
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formPrenom">
                  <Form.Label>Prénom <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({...form, prenom: e.target.value})}
                    placeholder="Prénom"
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formDateNaissance">
                  <Form.Label>Date de naissance</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => setForm({...form, date_naissance: e.target.value})}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formTelephone">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({...form, telephone: e.target.value})}
                    placeholder="Ex: 0341234567"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formNationalite">
                  <Form.Label>Nationalité</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.nationalite}
                    onChange={(e) => setForm({...form, nationalite: e.target.value})}
                    placeholder="Nationalité"
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formAnneeBacc">
                  <Form.Label>Année Bac</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.annee_bacc}
                    onChange={(e) => setForm({...form, annee_bacc: e.target.value})}
                    placeholder="Ex: 2020"
                    min="1980"
                    max={new Date().getFullYear()}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formFaculte">
                  <Form.Label>Faculté <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={form.faculte}
                    onChange={(e) => handleFaculteChange(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner une faculté</option>
                    {facultes.map((faculte, index) => (
                      <option key={index} value={faculte}>
                        {faculte}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formDomaine">
                  <Form.Label>Domaine</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.domaine}
                    readOnly
                    plaintext
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formMention">
                  <Form.Label>Mention</Form.Label>
                  <Form.Select
                    value={form.mention}
                    onChange={(e) => setForm({...form, mention: e.target.value})}
                    disabled={!form.faculte}
                  >
                    <option value="">Sélectionner une mention</option>
                    {getMentionsForFaculte(form.faculte).map((mention, index) => (
                      <option key={index} value={mention}>
                        {mention}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formNiveau">
                  <Form.Label>Niveau <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={form.niveau}
                    onChange={(e) => setForm({...form, niveau: e.target.value})}
                    required
                  >
                    {niveaux.map((niveau, index) => (
                      <option key={index} value={niveau}>{niveau}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formBoursier">
                  <Form.Label>Statut boursier</Form.Label>
                  <Form.Select
                    value={form.boursier}
                    onChange={(e) => setForm({...form, boursier: e.target.value})}
                  >
                  <option value="OUI">Boursier</option>
                  <option value="NON">Non boursier</option>
                  </Form.Select>
                </Form.Group>
              </div>
              
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formCodeRedoublement">
                  <Form.Label>Code redoublement</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.code_redoublement}
                    readOnly
                    plaintext
                    className="font-monospace fw-bold"
                  />
                  <Form.Text className="text-muted">
                    Code R = Redoublant, T = Triplant (fixe pour réinscription)
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            {form.boursier === "OUI" && (
              <div className="row">
                <div className="col-md-12 mb-3">
                  <Alert variant="info" className="mb-0">
                    <Alert.Heading>Information Bourse</Alert.Heading>
                    <p>
                      La bourse sera calculée automatiquement en fonction du niveau et du statut de redoublement:<br/>
                      <strong>Licence 1 Non redoublant:</strong> 24,200 MGA<br/>
                      <strong>Licence 1 Redoublant:</strong> 12,100 MGA<br/>
                      <strong>Licence 2 Non redoublant:</strong> 30,250 MGA<br/>
                      <strong>Licence 2 Redoublant:</strong> 15,125 MGA<br/>
                      <strong>Licence 3 Non redoublant:</strong> 36,300 MGA<br/>
                      <strong>Licence 3 Redoublant:</strong> 18,150 MGA<br/>
                      <strong>Master 1/2 Non redoublant:</strong> 48,400 MGA<br/>
                      <strong>Master 1/2 Redoublant:</strong> 24,200 MGA<br/>
                      <strong>Triplant (T):</strong> 0 MGA
                    </p>
                  </Alert>
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="warning" 
            onClick={saveEtudiant}
          >
            Modifier
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {etudiantToDelete && (
            <>
              <p>Êtes-vous sûr de vouloir supprimer cet étudiant ?</p>
              <div className="alert alert-warning">
                <strong>{etudiantToDelete.nom} {etudiantToDelete.prenom}</strong><br/>
                Matricule: <code>{etudiantToDelete.matricule}</code><br/>
                Niveau: {etudiantToDelete.niveau}<br/>
                Code: {etudiantToDelete.code_redoublement} ({getCodeLabel(etudiantToDelete.code_redoublement)})<br/>
                Faculté: {etudiantToDelete.faculte}
              </div>
              <p className="text-danger">
                <strong>Attention :</strong> Cette action est irréversible !
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de promotion */}
      <Modal show={showPromotionModal} onHide={() => setShowPromotionModal(false)} centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>Gestion de la promotion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {etudiantForPromotion && (
            <>
              <div className="alert alert-info">
                <h6 className="alert-heading">Étudiant concerné</h6>
                <p className="mb-1">
                  <strong>{etudiantForPromotion.nom} {etudiantForPromotion.prenom}</strong><br/>
                  Matricule: <code>{etudiantForPromotion.matricule}</code><br/>
                  Niveau actuel: <Badge bg="primary">{etudiantForPromotion.niveau}</Badge><br/>
                  Code actuel: <Badge bg={getCodeBadgeColor(etudiantForPromotion.code_redoublement)}>
                    {etudiantForPromotion.code_redoublement} ({getCodeLabel(etudiantForPromotion.code_redoublement)})
                  </Badge><br/>
                  Bourse actuelle: <strong>{etudiantForPromotion.bourse ? etudiantForPromotion.bourse.toLocaleString() + ' MGA' : 'Non boursier'}</strong>
                </p>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Décision de fin d'année</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      id="passe"
                      name="promotionDecision"
                      label="Admis - Passe au niveau supérieur"
                      value="passe"
                      checked={promotionDecision === "passe"}
                      onChange={(e) => setPromotionDecision(e.target.value)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="redouble"
                      name="promotionDecision"
                      label="Redouble - Maintenu dans le même niveau"
                      value="redouble"
                      checked={promotionDecision === "redouble"}
                      onChange={(e) => setPromotionDecision(e.target.value)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="triplant"
                      name="promotionDecision"
                      label="Triplant - Maintenu (3ème année dans le même niveau)"
                      value="triplant"
                      checked={promotionDecision === "triplant"}
                      onChange={(e) => setPromotionDecision(e.target.value)}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nouveau niveau</Form.Label>
                  <Form.Control
                    type="text"
                    value={newNiveau}
                    readOnly
                    plaintext
                    className="font-monospace fw-bold"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nouveau code redoublement</Form.Label>
                  <Form.Control
                    type="text"
                    value={`${newCodeRedoublement} (${getCodeLabel(newCodeRedoublement)})`}
                    readOnly
                    plaintext
                    className={
                      newCodeRedoublement === 'N' ? "text-success fw-bold" :
                      newCodeRedoublement === 'R' ? "text-danger fw-bold" :
                      "text-warning fw-bold"
                    }
                  />
                  <Form.Text className="text-muted">
                    {promotionDecision === "passe" 
                      ? "Après promotion, l'étudiant n'est plus considéré comme redoublant"
                      : promotionDecision === "redouble"
                      ? "L'étudiant reste dans la liste des redoublants"
                      : "L'étudiant est marqué comme triplant (pas de bourse)"}
                  </Form.Text>
                </Form.Group>

                {etudiantForPromotion.boursier === "OUI" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Nouvelle bourse</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="number"
                        value={newBourse}
                        onChange={(e) => setNewBourse(parseInt(e.target.value) || 0)}
                        min="0"
                        step="100"
                        // disabled={promotionDecision === "triplant"}
                        disabled
                      />
                      <span className="input-group-text">MGA</span>
                    </div>
                    <Form.Text className="text-muted">
                      {promotionDecision === "passe" 
                        ? "Montant plein pour non redoublant"
                        : promotionDecision === "redouble"
                        ? "Montant réduit de moitié pour redoublant"
                        : "Bourse supprimée pour triplant (0 MGA)"}
                    </Form.Text>
                  </Form.Group>
                )}

                {promotionDecision === "passe" && (
                  <Alert variant="success" className="mt-3">
                    <FaArrowUp className="me-2" />
                    <strong>Information :</strong> L'étudiant sera marqué comme "Non redoublant" (code N) après promotion et recevra la bourse complète.
                  </Alert>
                )}

                {promotionDecision === "redouble" && (
                  <Alert variant="warning" className="mt-3">
                    <FaArrowDown className="me-2" />
                    <strong>Information :</strong> L'étudiant restera marqué comme "Redoublant" (code R) et recevra la moitié de la bourse normale.
                  </Alert>
                )}

                {promotionDecision === "triplant" && (
                  <Alert variant="danger" className="mt-3">
                    <FaArrowDown className="me-2" />
                    <strong>Information :</strong> L'étudiant est triplant (3ème année dans le même niveau), code: T, bourse: 0 MGA.
                  </Alert>
                )}
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPromotionModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handlePromotion}>
            Appliquer la décision
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bouton de rafraîchissement en bas à droite */}
      <Button
        variant="outline-primary"
        onClick={refreshData}
        className="position-fixed"
        style={{
          bottom: '20px',
          right: '20px',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
        title="Rafraîchir les données"
      >
        <FaSync />
      </Button>

      {/* Pied de page */}
      <footer className="mt-5 pt-3 border-top">
        <div className="row">
          <div className="col-md-6">
            <small className="text-muted">
              Système de gestion des réinscriptions - TUL {new Date().getFullYear()}
            </small>
          </div>
        </div>
      </footer>
    </div>
  );
}