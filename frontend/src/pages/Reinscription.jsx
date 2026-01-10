import React, { useState, useEffect, useCallback } from "react";
import { FaEdit, FaTrash, FaSearch, FaArrowUp, FaArrowDown, FaSync, FaInfoCircle } from "react-icons/fa";
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
import { etudiantApi, faculteApi, domaineApi, mentionApi } from '../api';

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
  const [userInfo, setUserInfo] = useState({
    role: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // États pour les modales
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  // États pour les données de référence
  const [facultes, setFacultes] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [filteredMentions, setFilteredMentions] = useState([]);

  // États pour les formulaires
  const [form, setForm] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    telephone: "",
    cin: "",
    annee_bacc: new Date().getFullYear().toString(),
    code_redoublement: "R",
    boursier: "OUI",
    faculte: "",
    domaine: "",
    niveau: "Licence 2",
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
  const [filterCode, setFilterCode] = useState(""); // Nouveau filtre pour le code redoublement

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fonctions pour récupérer les données de référence
  const fetchFacultes = async () => {
    try {
      const response = await faculteApi.getFacultes();
      setFacultes(response.data.results || response.data);
    } catch (err) {
      console.error("Erreur chargement facultés:", err);
    }
  };

  const fetchDomaines = async () => {
    try {
      const response = await domaineApi.getDomaines();
      setDomaines(response.data.results || response.data);
    } catch (err) {
      console.error("Erreur chargement domaines:", err);
    }
  };

  const fetchMentions = async () => {
    try {
      const response = await mentionApi.getMentions();
      setMentions(response.data.results || response.data);
    } catch (err) {
      console.error("Erreur chargement mentions:", err);
    }
  };

  // Fonction pour filtrer les mentions par domaine
  const filterMentionsByDomaine = (domaineId) => {
    if (!domaineId) {
      setFilteredMentions([]);
      return;
    }
    const filtered = mentions.filter(mention => mention.domaine == domaineId);
    setFilteredMentions(filtered);
  };

  const fetchUserInfo = async () => {
    try {
      const response = await etudiantApi.getCurrentUser();
      if (response.data) {
        setUserInfo({
          role: response.data.role || ''
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des informations utilisateur:", err);
      const storedRole = localStorage.getItem("user_role");
      setUserInfo({
        role: storedRole || ''
      });
    }
  };

  // Fonction pour calculer la bourse
  const calculateBourse = (niveau, codeRedoublement, boursier) => {
    let montant = 0.0;

    if (boursier !== 'OUI') {
      return montant;
    }

    if (codeRedoublement === 'T') {
      return 0.0;
    }

    const niveauUpper = niveau.toUpperCase();

    if (niveauUpper.includes("M2") || niveauUpper.includes("M1") ||
      niveauUpper.includes("MASTER") || niveauUpper.includes("DOCTORAT") ||
      niveauUpper.includes("DOT")) {
      if (codeRedoublement === 'N') {
        montant = 48400.00;
      } else if (codeRedoublement === 'R') {
        montant = 48400.00 / 2;
      }
    } else if (niveauUpper.includes("LICENCE 3") || niveauUpper.includes("L3")) {
      if (codeRedoublement === 'N') {
        montant = 36300.00;
      } else if (codeRedoublement === 'R') {
        montant = 36300.00 / 2;
      }
    } else if (niveauUpper.includes("LICENCE 2") || niveauUpper.includes("L2")) {
      if (codeRedoublement === 'N') {
        montant = 30250.00;
      } else if (codeRedoublement === 'R') {
        montant = 30250.00 / 2;
      }
    } else if (niveauUpper.includes("LICENCE 1") || niveauUpper.includes("L1")) {
      if (codeRedoublement === 'N') {
        montant = 24200.00;
      } else if (codeRedoublement === 'R') {
        montant = 24200.00 / 2;
      }
    }

    return montant;
  };

  // Fonction pour gérer les changements de faculté
  const handleFaculteChange = async (selectedFaculteId) => {
    const updatedForm = {
      ...form,
      faculte: selectedFaculteId,
      domaine: "",
      mention: ""
    };

    setForm(updatedForm);

    if (selectedFaculteId) {
      try {
        const response = await domaineApi.getDomaines({ faculte: selectedFaculteId });
        setDomaines(response.data.results || response.data);
      } catch (err) {
        console.error("Erreur chargement domaines:", err);
      }
    } else {
      // Si aucune faculté sélectionnée, charger tous les domaines
      fetchDomaines();
    }
  };

  // Fonction pour gérer les changements de domaine
  const handleDomaineChange = (selectedDomaineId) => {
    const updatedForm = {
      ...form,
      domaine: selectedDomaineId,
      mention: ""
    };

    setForm(updatedForm);

    if (selectedDomaineId) {
      filterMentionsByDomaine(selectedDomaineId);
    } else {
      setFilteredMentions([]);
    }
  };

  // Formatage des données d'étudiants
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

  // CORRIGÉ : Charger les étudiants - Recherche TOUS les étudiants, pas seulement redoublants
  const fetchEtudiants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      // Recherche dans tous les étudiants
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Filtre par niveau si spécifié
      if (filterNiveau) {
        params.niveau = filterNiveau;
      }

      // Filtre par code redoublement si spécifié
      if (filterCode) {
        if (filterCode === 'R_T') {
          // Filtrer R et T
          params.code_redoublement__in = 'R,T';
        } else {
          params.code_redoublement = filterCode;
        }
      } else {
        // Par défaut, montrer tous les codes (N, R, T)
        params.code_redoublement__in = 'N,R,T';
      }

      const response = await etudiantApi.getEtudiants(params);
      const etudiantsData = formatEtudiantData(response.data);

      setEtudiants(etudiantsData);

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
  }, [currentPage, itemsPerPage, filterNiveau, searchTerm, filterCode]);

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

  // Charger toutes les données
  useEffect(() => {
    fetchUserInfo();
    fetchFacultes();
    fetchDomaines();
    fetchMentions();
  }, []);

  // Recharger les étudiants quand les critères de recherche changent
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchEtudiants();
    }, 300); // Délai de 300ms pour éviter trop d'appels API

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterNiveau, filterCode, itemsPerPage]);

  // Charger les stats après le chargement initial
  useEffect(() => {
    if (!loading) {
      fetchStats();
    }
  }, [loading]);

  // Fonction pour montrer les toasts
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const isAdmin = () => {
    return userInfo.role === 'administrateur';
  };

  // Fonction pour obtenir le nom d'une relation
  const getRelationName = (relation, relationList) => {
    if (!relation) return '-';
    
    if (typeof relation === 'object' && relation !== null) {
      return relation.nom || relation.nom_faculte || relation.nom_domaine || relation.nom_mention || relation.code || '-';
    }
    
    if (relationList) {
      const found = relationList.find(item => item.id == relation || item.id === relation);
      return found ? (found.nom || found.nom_faculte || found.nom_domaine || found.nom_mention || found.code) : relation;
    }
    
    return relation;
  };

  // CORRIGÉ : Ouvrir modal d'édition - récupère correctement les données
  const openEditModal = async (etudiant) => {
    console.log("Étudiant à modifier:", etudiant);
    
    // Récupérer les IDs des relations
    let faculteId = "";
    let domaineId = "";
    let mentionId = "";
    
    // Récupérer l'ID de la faculté
    if (etudiant.faculte) {
      if (typeof etudiant.faculte === 'object') {
        faculteId = etudiant.faculte.id;
      } else if (etudiant.faculte_id) {
        faculteId = etudiant.faculte_id;
      } else {
        faculteId = etudiant.faculte;
      }
    }
    
    // Récupérer l'ID du domaine
    if (etudiant.domaine) {
      if (typeof etudiant.domaine === 'object') {
        domaineId = etudiant.domaine.id;
      } else if (etudiant.domaine_id) {
        domaineId = etudiant.domaine_id;
      } else {
        domaineId = etudiant.domaine;
      }
    }
    
    // Récupérer l'ID de la mention
    if (etudiant.mention) {
      if (typeof etudiant.mention === 'object') {
        mentionId = etudiant.mention.id;
      } else if (etudiant.mention_id) {
        mentionId = etudiant.mention_id;
      } else {
        mentionId = etudiant.mention;
      }
    }
    
    console.log("IDs récupérés:", { faculteId, domaineId, mentionId });
    
    // Charger les domaines pour cette faculté
    if (faculteId) {
      try {
        const response = await domaineApi.getDomaines({ faculte: faculteId });
        setDomaines(response.data.results || response.data);
      } catch (err) {
        console.error("Erreur chargement domaines:", err);
      }
    }
    
    // Filtrer les mentions pour ce domaine
    if (domaineId) {
      filterMentionsByDomaine(domaineId);
    }
    
    // Préparer les données du formulaire
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
      faculte: faculteId || "",
      domaine: domaineId || "",
      niveau: etudiant.niveau || "Licence 2",
      nationalite: etudiant.nationalite || "Malagasy",
      mention: mentionId || "",
    };
    
    console.log("Données du formulaire:", formattedEtudiant);
    
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
      codeRedoublement = "N";
    } else if (decision === "redouble") {
      nouveauNiveau = currentNiveau;
      codeRedoublement = "R";
    } else if (decision === "triplant") {
      nouveauNiveau = currentNiveau;
      codeRedoublement = "T";
    }

    const nouvelleBourse = calculateBourse(nouveauNiveau, codeRedoublement, boursier);
    return { nouveauNiveau, codeRedoublement, nouvelleBourse };
  };

  // Ouvrir modal de promotion
  const openPromotionModal = (etudiant) => {
    setEtudiantForPromotion(etudiant);
    setPromotionDecision("passe");

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

  // Sauvegarder étudiant
  const saveEtudiant = async () => {
    if (!editId) {
      showToast("Seule la modification est autorisée", 'warning');
      return;
    }

    const requiredFields = ['matricule', 'nom', 'niveau', 'faculte'];
    const missingFields = requiredFields.filter(field => !form[field]?.trim());

    if (missingFields.length > 0) {
      showToast(`Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`, 'warning');
      return;
    }

    try {
      const dataToSend = { ...form };

      Object.keys(dataToSend).forEach(key => {
        if (typeof dataToSend[key] === 'string') {
          dataToSend[key] = dataToSend[key].trim();
        }
      });

      if (dataToSend.boursier === "OUI") {
        dataToSend.bourse = calculateBourse(
          dataToSend.niveau,
          dataToSend.code_redoublement,
          dataToSend.boursier
        );
      } else {
        dataToSend.bourse = 0;
      }

      console.log("Données à envoyer:", dataToSend);
      
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

      // Récupérer les IDs des relations
      let faculteId = "";
      let domaineId = "";
      let mentionId = "";
      
      if (etudiantForPromotion.faculte) {
        if (typeof etudiantForPromotion.faculte === 'object') {
          faculteId = etudiantForPromotion.faculte.id;
        } else if (etudiantForPromotion.faculte_id) {
          faculteId = etudiantForPromotion.faculte_id;
        } else {
          faculteId = etudiantForPromotion.faculte;
        }
      }
      
      if (etudiantForPromotion.domaine) {
        if (typeof etudiantForPromotion.domaine === 'object') {
          domaineId = etudiantForPromotion.domaine.id;
        } else if (etudiantForPromotion.domaine_id) {
          domaineId = etudiantForPromotion.domaine_id;
        } else {
          domaineId = etudiantForPromotion.domaine;
        }
      }
      
      if (etudiantForPromotion.mention) {
        if (typeof etudiantForPromotion.mention === 'object') {
          mentionId = etudiantForPromotion.mention.id;
        } else if (etudiantForPromotion.mention_id) {
          mentionId = etudiantForPromotion.mention_id;
        } else {
          mentionId = etudiantForPromotion.mention;
        }
      }

      const updatedData = {
        matricule: etudiantForPromotion.matricule,
        nom: etudiantForPromotion.nom,
        prenom: etudiantForPromotion.prenom,
        niveau: nouveauNiveau,
        code_redoublement: codeRedoublement,
        bourse: newBourse,
        boursier: etudiantForPromotion.boursier || "OUI",
        faculte: faculteId,
        domaine: domaineId,
        mention: mentionId,
      };

      console.log("Données de promotion à envoyer:", updatedData);
      
      try {
        await etudiantApi.patchEtudiant(etudiantForPromotion.id, updatedData);
      } catch (patchError) {
        const putData = {
          ...etudiantForPromotion,
          ...updatedData
        };
        await etudiantApi.updateEtudiant(etudiantForPromotion.id, putData);
      }

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

      if (err.response?.data) {
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

  // Gérer la touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchTerm("");
    setFilterNiveau("");
    setFilterCode("");
    setCurrentPage(1);
    fetchEtudiants();
    showToast("Filtres réinitialisés", 'info');
  };

  // Options pour les niveaux
  const niveaux = [
    "Licence 1", "Licence 2", "Licence 3",
    "Master 1", "Master 2", "Doctorat 1"
  ];

  // Options pour les codes redoublement
  const codeOptions = [
    { value: "", label: "Tous les codes" },
    { value: "N", label: "N - Non redoublant" },
    { value: "R", label: "R - Redoublant" },
    { value: "T", label: "T - Triplant" },
    { value: "R_T", label: "R et T (Redoublants et Triplants)" }
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
    fetchEtudiants();
    fetchStats();
    showToast("Données rafraîchies", 'info');
  };

  // Fonction pour obtenir la couleur du badge selon le code redoublement
  const getCodeBadgeColor = (code) => {
    switch (code) {
      case 'N': return 'success';
      case 'R': return 'danger';
      case 'T': return 'warning';
      default: return 'secondary';
    }
  };

  // Fonction pour obtenir le libellé du code redoublement
  const getCodeLabel = (code) => {
    switch (code) {
      case 'N': return 'Non redoublant';
      case 'R': return 'Redoublant';
      case 'T': return 'Triplant';
      default: return code;
    }
  };

  // Fonction utilitaire pour obtenir le nom d'une faculté
  const getFaculteName = (faculte) => {
    return getRelationName(faculte, facultes);
  };

  // Fonction utilitaire pour obtenir le nom d'un domaine
  const getDomaineName = (domaine) => {
    return getRelationName(domaine, domaines);
  };

  // Fonction utilitaire pour obtenir le nom d'une mention
  const getMentionName = (mention) => {
    return getRelationName(mention, mentions);
  };

  return (
    <div className="container-fluid py-4">
      {/* Toasts pour les notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
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
            Gestion de tous les étudiants avec filtres par niveau et code redoublement
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card border-primary">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total étudiants</h6>
              <h3 className="card-title text-primary">{stats.total || totalCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-danger">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Redoublants (R)</h6>
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

      {/* Barre d'outils CORRIGÉE */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-9">
              <div className="row g-3">
                <div className="col-md-4">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Rechercher (matricule, nom, prénom, CIN...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={handleSearch}
                      disabled={loading}
                    >
                      {loading ? '...' : 'Rechercher'}
                    </Button>
                  </InputGroup>
                </div>
                <div className="col-md-3">
                  <Form.Select
                    value={filterNiveau}
                    onChange={(e) => {
                      setFilterNiveau(e.target.value);
                      setCurrentPage(1);
                    }}
                    disabled={loading}
                  >
                    <option value="">Tous les niveaux</option>
                    {niveaux.map((niveau, index) => (
                      <option key={index} value={niveau}>{niveau}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Select
                    value={filterCode}
                    onChange={(e) => {
                      setFilterCode(e.target.value);
                      setCurrentPage(1);
                    }}
                    disabled={loading}
                  >
                    {codeOptions.map((option, index) => (
                      <option key={index} value={option.value}>{option.label}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Button
                    variant="outline-danger"
                    onClick={resetFilters}
                    disabled={loading}
                    className="w-100"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-md-3 text-end">
              <Button
                variant="outline-primary"
                onClick={refreshData}
                className="d-inline-flex align-items-center"
                title="Rafraîchir les données"
                disabled={loading}
              >
                <FaSync className={loading ? "fa-spin me-2" : "me-2"} /> 
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </Button>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg="info" className="me-2">
                    {filterNiveau ? `Niveau: ${filterNiveau}` : 'Tous niveaux'}
                  </Badge>
                  <Badge bg="warning" className="me-2">
                    {filterCode ? codeOptions.find(opt => opt.value === filterCode)?.label || 'Tous codes' : 'Tous codes'}
                  </Badge>
                  <Badge bg={searchTerm ? "success" : "secondary"}>
                    {searchTerm ? `Recherche: "${searchTerm}"` : 'Pas de recherche'}
                  </Badge>
                </div>
                <div className="text-muted">
                  {loading ? (
                    <Spinner animation="border" size="sm" className="me-2" />
                  ) : (
                    <Badge bg="primary">
                      {totalCount} étudiant(s) trouvé(s)
                    </Badge>
                  )}
                </div>
              </div>
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
                      disabled={loading}
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
                        disabled={currentPage === 1 || loading}
                      />
                      <Pagination.Prev
                        onClick={goToPrevPage}
                        disabled={currentPage === 1 || loading}
                      />

                      {getPageNumbers().map((number, index) => (
                        number === '...' ? (
                          <Pagination.Ellipsis key={index} disabled />
                        ) : (
                          <Pagination.Item
                            key={index}
                            active={number === currentPage}
                            onClick={() => !loading && paginate(number)}
                            disabled={loading}
                          >
                            {number}
                          </Pagination.Item>
                        )
                      ))}

                      <Pagination.Next
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || loading}
                      />
                      <Pagination.Last
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages || loading}
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
                          {searchTerm || filterNiveau || filterCode ? (
                            <>
                              <p className="text-muted">Aucun étudiant trouvé avec ces critères</p>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={resetFilters}
                                className="mt-2"
                              >
                                <FaSync className="me-2" />
                                Réinitialiser les filtres
                              </Button>
                            </>
                          ) : (
                            <p className="text-muted">Aucun étudiant trouvé</p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      etudiants.map((etudiant, index) => (
                        <tr key={etudiant.id}>
                          <td>
                            <small className="font-monospace">
                              {((currentPage - 1) * itemsPerPage) + index + 1}
                            </small>
                          </td>
                          <td className="font-monospace">{etudiant.matricule}</td>
                          <td>
                            <div className="fw-medium">{etudiant.nom} {etudiant.prenom}</div>
                            <small className="text-muted">
                              {getFaculteName(etudiant.faculte)}
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
                              {getMentionName(etudiant.mention)}
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
                              {isAdmin() && (
                                <Button
                                  variant="outline-success"
                                  onClick={() => openEditModal(etudiant)}
                                  title="Modifier"
                                  size="sm"
                                  disabled={loading}
                                >
                                  <FaEdit />
                                </Button>
                              )}

                              <Button
                                variant="outline-info"
                                onClick={() => openPromotionModal(etudiant)}
                                title="Gérer promotion"
                                size="sm"
                                disabled={loading}
                              >
                                <FaArrowUp />
                              </Button>
                              {isAdmin() && (
                                <Button
                                  variant="outline-danger"
                                  onClick={() => openDeleteModal(etudiant)}
                                  title="Supprimer"
                                  size="sm"
                                  disabled={loading}
                                >
                                  <FaTrash />
                                </Button>
                              )}
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
                        disabled={currentPage === 1 || loading}
                      />
                      <Pagination.Prev
                        onClick={goToPrevPage}
                        disabled={currentPage === 1 || loading}
                      />

                      {getPageNumbers().map((number, index) => (
                        number === '...' ? (
                          <Pagination.Ellipsis key={index} disabled />
                        ) : (
                          <Pagination.Item
                            key={index}
                            active={number === currentPage}
                            onClick={() => !loading && paginate(number)}
                            disabled={loading}
                          >
                            {number}
                          </Pagination.Item>
                        )
                      ))}

                      <Pagination.Next
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages || loading}
                      />
                      <Pagination.Last
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages || loading}
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
                      disabled={loading}
                    />
                    <span className="text-muted">sur {totalPages}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Ajout/Modification CORRIGÉ */}
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
                    onChange={(e) => setForm({ ...form, matricule: e.target.value.toUpperCase() })}
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
                    onChange={(e) => setForm({ ...form, cin: e.target.value.toUpperCase() })}
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
                    onChange={(e) => setForm({ ...form, nom: e.target.value.toUpperCase() })}
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
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Group controlId="formTelephone">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, nationalite: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, annee_bacc: e.target.value })}
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
                    {facultes.map((faculte) => (
                      <option key={faculte.id} value={faculte.id}>
                        {faculte.code} - {faculte.nom_faculte || faculte.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Group controlId="formDomaine">
                  <Form.Label>Domaine</Form.Label>
                  <Form.Select
                    value={form.domaine}
                    onChange={(e) => handleDomaineChange(e.target.value)}
                    disabled={!form.faculte}
                  >
                    <option value="">Sélectionner un domaine</option>
                    {domaines.map((domaine) => (
                      <option key={domaine.id} value={domaine.id}>
                        {domaine.code} - {domaine.nom_domaine || domaine.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group controlId="formMention">
                  <Form.Label>Mention</Form.Label>
                  <Form.Select
                    value={form.mention}
                    onChange={(e) => setForm({ ...form, mention: e.target.value })}
                    disabled={!form.domaine}
                  >
                    <option value="">Sélectionner une mention</option>
                    {filteredMentions.map((mention) => (
                      <option key={mention.id} value={mention.id}>
                        {mention.code} - {mention.nom_mention || mention.nom}
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
                    onChange={(e) => setForm({ ...form, niveau: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, boursier: e.target.value })}
                  >
                    <option value="OUI">Boursier</option>
                    <option value="NON">Non boursier</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Group controlId="formCodeRedoublement">
                  <Form.Label>Code redoublement</Form.Label>
                  <Form.Select
                    value={form.code_redoublement}
                    onChange={(e) => setForm({ ...form, code_redoublement: e.target.value })}
                  >
                    <option value="N">N - Non redoublant</option>
                    <option value="R">R - Redoublant</option>
                    <option value="T">T - Triplant</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    N = Non redoublant, R = Redoublant, T = Triplant
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
                      La bourse sera calculée automatiquement en fonction du niveau et du statut de redoublement:<br />
                      <strong>Licence 1 Non redoublant:</strong> 24,200 MGA<br />
                      <strong>Licence 1 Redoublant:</strong> 12,100 MGA<br />
                      <strong>Licence 2 Non redoublant:</strong> 30,250 MGA<br />
                      <strong>Licence 2 Redoublant:</strong> 15,125 MGA<br />
                      <strong>Licence 3 Non redoublant:</strong> 36,300 MGA<br />
                      <strong>Licence 3 Redoublant:</strong> 18,150 MGA<br />
                      <strong>Master 1/2 Non redoublant:</strong> 48,400 MGA<br />
                      <strong>Master 1/2 Redoublant:</strong> 24,200 MGA<br />
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
                <strong>{etudiantToDelete.nom} {etudiantToDelete.prenom}</strong><br />
                Matricule: <code>{etudiantToDelete.matricule}</code><br />
                Niveau: {etudiantToDelete.niveau}<br />
                Code: {etudiantToDelete.code_redoublement} ({getCodeLabel(etudiantToDelete.code_redoublement)})<br />
                Faculté: {getFaculteName(etudiantToDelete.faculte)}
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
          <Modal.Title>Passage à niveaux</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {etudiantForPromotion && (
            <>
              <div className="alert alert-info">
                <h6 className="alert-heading">Étudiant concerné</h6>
                <p className="mb-1">
                  <strong>{etudiantForPromotion.nom} {etudiantForPromotion.prenom}</strong><br />
                  Matricule: <code>{etudiantForPromotion.matricule}</code><br />
                  Niveau actuel: <Badge bg="primary">{etudiantForPromotion.niveau}</Badge><br />
                  Code actuel: <Badge bg={getCodeBadgeColor(etudiantForPromotion.code_redoublement)}>
                    {etudiantForPromotion.code_redoublement} ({getCodeLabel(etudiantForPromotion.code_redoublement)})
                  </Badge><br />
                  Bourse actuelle: <strong>{etudiantForPromotion.bourse ? etudiantForPromotion.bourse.toLocaleString() + ' MGA' : 'Non boursier'}</strong><br />
                  Faculté: {getFaculteName(etudiantForPromotion.faculte)}<br />
                  Mention: {getMentionName(etudiantForPromotion.mention)}
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
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}
        title="Rafraîchir les données"
        disabled={loading}
      >
        <FaSync className={loading ? "fa-spin" : ""} />
      </Button>

      {/* Pied de page */}
      <footer className="mt-5 pt-3 border-top">
        <div className="row">
          <div className="col-md-6">
            <small className="text-muted">
              Système de gestion des réinscriptions - TUL {new Date().getFullYear()}
            </small>
          </div>
          <div className="col-md-6 text-end">
            <small className="text-muted">
              {searchTerm && `Recherche: "${searchTerm}"`}
              {filterNiveau && ` | Filtre: ${filterNiveau}`}
              {filterCode && ` | Code: ${filterCode}`}
            </small>
          </div>
        </div>
      </footer>
    </div>
  );
}