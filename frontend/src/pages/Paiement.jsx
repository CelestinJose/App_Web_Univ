import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Pending as PendingIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Checkbox,
  FormControlLabel
} from "@mui/material";


// Import de votre API configurée
import api, { etudiantApi } from '../api';

// Créer les endpoints API pour les paiements
const paiementApi = {
  // Récupérer tous les paiements
  getPaiements: async (params = {}) => {
    try {
      console.log("API: Récupération paiements avec params:", params);
      const response = await api.get('/paiements/', { params });
      console.log("API: Réponse brute paiements:", response.data);
      return response;
    } catch (error) {
      console.error("Erreur API getPaiements:", error);
      throw error;
    }
  },

  // Récupérer un paiement spécifique
  getPaiement: (id) => api.get(`/paiements/${id}/`),



  // Mettre à jour un paiement (PUT)
  updatePaiement: async (id, data) => {
    try {
      console.log(`API: Mise à jour paiement ${id} avec data:`, data);
      const response = await api.put(`/paiements/${id}/`, data);
      console.log("API: Réponse mise à jour paiement:", response.data);
      return response;
    } catch (error) {
      console.error("Erreur API updatePaiement:", error);
      throw error;
    }
  },

  // Mettre à jour partiellement un paiement (PATCH)
  patchPaiement: async (id, data) => {
    try {
      console.log(`API: Patch paiement ${id} avec data:`, data);
      const response = await api.patch(`/paiements/${id}/`, data);
      console.log("API: Réponse patch paiement:", response.data);
      return response;
    } catch (error) {
      console.error("Erreur API patchPaiement:", error);
      throw error;
    }
  },

  // Supprimer un paiement
  deletePaiement: (id) => api.delete(`/paiements/${id}/`),
};

// API pour les échéanciers - CORRIGÉ selon votre modèle Django
const echeancierApi = {
  getEcheanciers: async (params = {}) => {
    try {
      const response = await api.get('/Echeance/', { params });
      return response;
    } catch (error) {
      console.error("Erreur API getEcheanciers:", error);
      throw error;
    }
  },
  
  createEcheancier: async (data) => {
    try {
      console.log("API: Création échéancier avec data:", data);
      const response = await api.post('/echeanciers/', data);
      console.log("API: Réponse création échéancier:", response.data);
      return response;
    } catch (error) {
      console.error("Erreur API createEcheancier:", error);
      throw error;
    }
  },
  
  updateEcheancier: async (id, data) => {
    try {
      const response = await api.put(`/echeanciers/${id}/`, data);
      return response;
    } catch (error) {
      console.error("Erreur API updateEcheancier:", error);
      throw error;
    }
  },
  
  deleteEcheancier: async (id) => {
    try {
      const response = await api.delete(`/echeanciers/${id}/`);
      return response;
    } catch (error) {
      console.error("Erreur API deleteEcheancier:", error);
      throw error;
    }
  }
};

// API pour les versements - CORRIGÉ selon votre modèle Django
const versementApi = {
  getVersements: async (params = {}) => {
    try {
      const response = await api.get('/versements/', { params });
      return response;
    } catch (error) {
      console.error("Erreur API getVersements:", error);
      throw error;
    }
  },
  
  createVersement: async (data) => {
    try {
      console.log("API: Création versement avec data:", data);
      const response = await api.post('/versements/', data);
      console.log("API: Réponse création versement:", response.data);
      return response;
    } catch (error) {
      console.error("Erreur API createVersement:", error);
      throw error;
    }
  },
  
  updateVersement: async (id, data) => {
    try {
      const response = await api.put(`/versements/${id}/`, data);
      return response;
    } catch (error) {
      console.error("Erreur API updateVersement:", error);
      throw error;
    }
  },
  
  deleteVersement: async (id) => {
    try {
      const response = await api.delete(`/versements/${id}/`);
      return response;
    } catch (error) {
      console.error("Erreur API deleteVersement:", error);
      throw error;
    }
  }
};

export default function Paiement() {
  // États pour les données
  const [paiements, setPaiements] = useState([]);
  const [echeanciers, setEcheanciers] = useState([]);
  const [versements, setVersements] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterMontantMin, setFilterMontantMin] = useState("");
  const [filterMontantMax, setFilterMontantMax] = useState("");
  const [filterEtudiant, setFilterEtudiant] = useState("");
  
  // États pour les filtres échéanciers
  const [filterEcheancierEtudiant, setFilterEcheancierEtudiant] = useState("");
  
  // États pour les filtres versements
  const [filterVersementEtudiant, setFilterVersementEtudiant] = useState("");
  const [filterVersementStatus, setFilterVersementStatus] = useState("");
  
  // États pour les modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateEcheancierModal, setShowCreateEcheancierModal] = useState(false);
  const [showCreateVersementModal, setShowCreateVersementModal] = useState(false);
  
  // États pour les données modales
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [selectedEcheancier, setSelectedEcheancier] = useState(null);
  const [selectedVersement, setSelectedVersement] = useState(null);


  const [typePaiement, setTypePaiement] = useState("etudiant"); // etudiant | faculte
  const [isRenouvellement, setIsRenouvellement] = useState(false);

  const facultes = [
    { id: 1, nom: "Faculté des Sciences" },
    { id: 2, nom: "Faculté de Droit" },
    { id: 3, nom: "Faculté d'Économie" },
    { id: 4, nom: "Faculté d'Informatique" }
  ]; 

  const createPaiement = async () => {
  try {
    const url =
      typePaiement === "etudiant"
        ? "http://localhost:8000/api/paiement-individuel/"
        : "http://localhost:8000/api/paiement-collectif/";

    const payload =
      typePaiement === "etudiant"
        ? {
            etudiant: newPaiementData.etudiant,
            nombre_echeances: Number(newPaiementData.nombre_echeance),
            date_paiement: newPaiementData.date_paiement,
            notes: newPaiementData.notes,
          }
        : {
            faculte: newPaiementData.faculte,
            niveau: newPaiementData.niveau,
            nombre_echeances: Number(newPaiementData.nombre_echeance),
            notes: newPaiementData.notes,
          };
 console.log("Payload envoyé :", payload);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(data.message || "Paiement créé !");
    setShowCreateModal(false);
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la création du paiement.");
  }
};

  
  const [editData, setEditData] = useState({
    montant: "",
    status: "EN_ATTENTE",
    date_paiement: "",
    mode_paiement: "",
    notes: "",
    etudiant: "",
    montant_restant: ""
  });

  // CORRIGÉ: Modèle correspondant à EcheancierPaiement Django
  const [newPaiementData, setNewPaiementData] = useState({
    montant: "",
    montant_restant: "",
    status: "EN_ATTENTE",
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: "",
    notes: "",
    etudiant: ""
  });

  // CORRIGÉ: Modèle correspondant à EcheancierPaiement Django
  const [newEcheancierData, setNewEcheancierData] = useState({
    etudiant: "",
    nombre_echeances: "3",  // 3 par défaut comme dans votre modèle
    montant_par_echeance: "",
  });

  // CORRIGÉ: Modèle correspondant à VersementEcheance Django
  const [newVersementData, setNewVersementData] = useState({
    echeancier: "",
    numero_echeance: "1",
    montant: "",
    date_echeance: new Date().toISOString().split('T')[0],
    date_paiement: "",
    status: "EN_ATTENTE",
    reference_paiement: ""
  });

  // Statuts de paiement
  const statutsPaiement = [
    { value: "EN_ATTENTE", label: "En attente", color: "warning", icon: <PendingIcon /> },
    { value: "CONFIRME", label: "Confirmé", color: "success", icon: <CheckIcon /> },
    { value: "ECHOUE", label: "Échoué", color: "error", icon: <WarningIcon /> },
    { value: "REMBOURSÉ", label: "Remboursé", color: "info", icon: <ReceiptIcon /> },
  ];

  // CORRIGÉ: Statuts de versement selon votre modèle Django
  const statutsVersement = [
    { value: "EN_ATTENTE", label: "En attente", color: "warning", icon: <PendingIcon /> },
    { value: "PAYE", label: "Payé", color: "success", icon: <CheckIcon /> },
    { value: "RETARD", label: "En retard", color: "error", icon: <WarningIcon /> },
  ];

  // Modes de paiement
  const modesPaiement = [
    "ESPÈCES",
    "MOBILE MONEY",
    "VIREMENT",
    "CHEQUE",
    "CARTE",
  ];

  // Gestion des toasts (notifications)
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("success");

  const showNotification = (message, severity = "success") => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
    
    setTimeout(() => {
      setToastOpen(false);
    }, 5000);
  };

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Début du chargement des données...");

      // Charger les étudiants
      const etudiantsResponse = await etudiantApi.getEtudiants();
      console.log("Réponse étudiants:", etudiantsResponse);
      
      let etudiantsData = [];
      if (etudiantsResponse && etudiantsResponse.data) {
        if (Array.isArray(etudiantsResponse.data)) {
          etudiantsData = etudiantsResponse.data;
        } else if (typeof etudiantsResponse.data === 'object') {
          etudiantsData = etudiantsResponse.data.results || etudiantsResponse.data.data || [];
        }
      }
      
      console.log("Étudiants chargés:", etudiantsData.length);
      setEtudiants(etudiantsData);

      // Charger les paiements
      const paiementsResponse = await paiementApi.getPaiements();
      console.log("Réponse paiements:", paiementsResponse);
      
      let paiementsData = [];
      if (paiementsResponse && paiementsResponse.data) {
        if (Array.isArray(paiementsResponse.data)) {
          paiementsData = paiementsResponse.data;
        } else if (typeof paiementsResponse.data === 'object') {
          paiementsData = paiementsResponse.data.results || paiementsResponse.data.data || [];
        }
      }
      
      console.log("Paiements chargés:", paiementsData.length);
      setPaiements(paiementsData);

      // Charger les échéanciers
      try {
        const echeanciersResponse = await echeancierApi.getEcheanciers();
        let echeanciersData = [];
        if (echeanciersResponse && echeanciersResponse.data) {
          if (Array.isArray(echeanciersResponse.data)) {
            echeanciersData = echeanciersResponse.data;
          } else if (typeof echeanciersResponse.data === 'object') {
            echeanciersData = echeanciersResponse.data.results || echeanciersResponse.data.data || [];
          }
        }
        console.log("Échéanciers chargés:", echeanciersData);
        setEcheanciers(echeanciersData);
      } catch (echeancierError) {
        console.warn("Impossible de charger les échéanciers:", echeancierError.message);
        setEcheanciers([]);
      }

      // Charger les versements
      try {
        const versementsResponse = await versementApi.getVersements();
        let versementsData = [];
        if (versementsResponse && versementsResponse.data) {
          if (Array.isArray(versementsResponse.data)) {
            versementsData = versementsResponse.data;
          } else if (typeof versementsResponse.data === 'object') {
            versementsData = versementsResponse.data.results || versementsResponse.data.data || [];
          }
        }
        console.log("Versements chargés:", versementsData);
        setVersements(versementsData);
      } catch (versementError) {
        console.warn("Impossible de charger les versements:", versementError.message);
        setVersements([]);
      }

    } catch (error) {
      console.error("Erreur complète lors du chargement:", error);
      setError(`Impossible de charger les données: ${error.message}`);
      
      setEtudiants([]);
      setPaiements([]);
      setEcheanciers([]);
      setVersements([]);
    } finally {
      setLoading(false);
    }
  };

  // Trouver l'étudiant par ID
  const findEtudiantById = (etudiantId) => {
    if (!etudiantId) return null;
    return etudiants.find(e => e.id == etudiantId);
  };

  // Trouver l'échéancier par ID
  const findEcheancierById = (echeancierId) => {
    if (!echeancierId) return null;
    return echeanciers.find(e => e.id == echeancierId);
  };

  // Obtenir le nom complet de l'étudiant
  const getEtudiantName = (etudiantId) => {
    const etudiant = findEtudiantById(etudiantId);
    if (!etudiant) return `Étudiant #${etudiantId}`;
    return `${etudiant.nom || ''} ${etudiant.prenom || ''}`.trim();
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  // Formater le montant
  const formatMontant = (montant) => {
    if (!montant) return "0,00";
    return parseFloat(montant).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Obtenir le statut avec style pour paiements
  const getStatutStyle = (statut) => {
    const found = statutsPaiement.find(s => s.value === statut);
    return found || { label: statut || "Inconnu", color: "default", icon: <WarningIcon /> };
  };

  // CORRIGÉ: Obtenir le statut avec style pour versements
  const getVersementStatutStyle = (statut) => {
    const found = statutsVersement.find(s => s.value === statut);
    return found || { label: statut || "Inconnu", color: "default", icon: <WarningIcon /> };
  };

  // Filtrer les paiements
  const filteredPaiements = paiements.filter(paiement => {
    if (!paiement) return false;
    
    const etudiantName = getEtudiantName(paiement.etudiant).toLowerCase();
    const matchesSearch = 
      etudiantName.includes(searchTerm.toLowerCase()) ||
      (paiement.id && paiement.id.toString().includes(searchTerm)) ||
      (paiement.mode_paiement && paiement.mode_paiement.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatut = filterStatut ? paiement.status === filterStatut : true;
    const matchesMode = filterMode ? paiement.mode_paiement === filterMode : true;
    const matchesEtudiant = filterEtudiant ? paiement.etudiant == filterEtudiant : true;
    
    const montant = parseFloat(paiement.montant || 0);
    const matchesMontantMin = filterMontantMin ? montant >= parseFloat(filterMontantMin) : true;
    const matchesMontantMax = filterMontantMax ? montant <= parseFloat(filterMontantMax) : true;

    return matchesSearch && matchesStatut && matchesMode && matchesEtudiant && matchesMontantMin && matchesMontantMax;
  });

  // CORRIGÉ: Filtrer les échéanciers selon votre modèle
  const filteredEcheanciers = echeanciers.filter(echeancier => {
    if (!echeancier) return false;
    
    const etudiantName = getEtudiantName(echeancier.etudiant).toLowerCase();
    const matchesSearch = 
      etudiantName.includes(searchTerm.toLowerCase()) ||
      (echeancier.id && echeancier.id.toString().includes(searchTerm));
    
    const matchesEtudiant = filterEcheancierEtudiant ? echeancier.etudiant == filterEcheancierEtudiant : true;

    return matchesSearch && matchesEtudiant;
  });

  // CORRIGÉ: Filtrer les versements selon votre modèle
  const filteredVersements = versements.filter(versement => {
    if (!versement) return false;
    
    const etudiant = findEtudiantById(versement.echeancier?.etudiant);
    const etudiantName = etudiant ? `${etudiant.nom} ${etudiant.prenom}`.toLowerCase() : "";
    
    const matchesSearch = 
      etudiantName.includes(searchTerm.toLowerCase()) ||
      (versement.id && versement.id.toString().includes(searchTerm));
    
    const matchesEtudiant = filterVersementEtudiant ? 
      (versement.echeancier && versement.echeancier.etudiant == filterVersementEtudiant) : true;
    
    const matchesStatus = filterVersementStatus ? versement.status === filterVersementStatus : true;

    return matchesSearch && matchesEtudiant && matchesStatus;
  });

  // CORRIGÉ: Calculer les statistiques
  const calculateStats = () => {
    // Paiements
    const totalPaiements = paiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const paiementsConfirmes = paiements.filter(p => p.status === "CONFIRME");
    const totalConfirmes = paiementsConfirmes.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const paiementsEnAttente = paiements.filter(p => p.status === "EN_ATTENTE").length;
    const paiementsEchoues = paiements.filter(p => p.status === "ECHOUE").length;
    const montantRestantTotal = paiements.reduce((sum, p) => sum + parseFloat(p.montant_restant || 0), 0);
    const etudiantsAvecPaiement = [...new Set(paiements.map(p => p.etudiant).filter(Boolean))].length;

    // CORRIGÉ: Statistiques échéanciers selon votre modèle
    const totalEcheanciers = echeanciers.length;
    const totalMontantEcheances = echeanciers.reduce((sum, e) => {
      return sum + (parseFloat(e.montant_par_echeance || 0) * parseInt(e.nombre_echeances || 0));
    }, 0);

    // CORRIGÉ: Statistiques versements selon votre modèle
    const totalVersements = versements.length;
    const versementsPayes = versements.filter(v => v.status === "PAYE").length;
    const totalMontantVersements = versements.reduce((sum, v) => sum + parseFloat(v.montant || 0), 0);
    const versementsEnRetard = versements.filter(v => v.status === "RETARD").length;

    return {
      // Paiements
      totalPaiements,
      totalConfirmes,
      paiementsEnAttente,
      paiementsEchoues,
      montantRestantTotal,
      etudiantsAvecPaiement,
      tauxConfirmation: paiements.length > 0 ? (paiementsConfirmes.length / paiements.length * 100).toFixed(1) : 0,
      
      // Échéanciers
      totalEcheanciers,
      totalMontantEcheances,
      
      // Versements
      totalVersements,
      versementsPayes,
      totalMontantVersements,
      versementsEnRetard,
      tauxPaiementVersements: totalVersements > 0 ? ((versementsPayes / totalVersements) * 100).toFixed(1) : 0,
    };
  };

  const stats = calculateStats();

  // Ouvrir modal de détail paiement
  const openDetailModal = (paiement) => {
    setSelectedPaiement(paiement);
    const etudiant = findEtudiantById(paiement.etudiant);
    setSelectedEtudiant(etudiant);
    setShowDetailModal(true);
  };

  // Ouvrir modal d'édition paiement
  const openEditModal = (paiement) => {
    setSelectedPaiement(paiement);
    const etudiant = findEtudiantById(paiement.etudiant);
    setSelectedEtudiant(etudiant);
    
    setEditData({
      montant: paiement.montant || "",
      status: paiement.status || "EN_ATTENTE",
      date_paiement: paiement.date_paiement ? paiement.date_paiement.split('T')[0] : "",
      mode_paiement: paiement.mode_paiement || "",
      notes: paiement.notes || "",
      etudiant: paiement.etudiant || "",
      montant_restant: paiement.montant_restant || ""
    });
    setShowEditModal(true);
  };

  // Ouvrir modal de création de paiement
  const openCreateModal = () => {
    setNewPaiementData({
      montant: "",
      montant_restant: "",
      status: "EN_ATTENTE",
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: "",
      notes: "",
      etudiant: etudiants.length > 0 ? etudiants[0].id : ""
    });
    setShowCreateModal(true);
  };

  // CORRIGÉ: Ouvrir modal de création d'échéancier selon votre modèle
  const openCreateEcheancierModal = () => {
    setNewEcheancierData({
      etudiant: etudiants.length > 0 ? etudiants[0].id : "",
      nombre_echeances: "3",  // 3 par défaut comme dans votre modèle
      montant_par_echeance: "",
    });
    setShowCreateEcheancierModal(true);
  };

  // CORRIGÉ: Ouvrir modal de création de versement selon votre modèle
  const openCreateVersementModal = () => {
    setNewVersementData({
      echeancier: echeanciers.length > 0 ? echeanciers[0].id : "",
      numero_echeance: "1",
      montant: "",
      date_echeance: new Date().toISOString().split('T')[0],
      date_paiement: "",
      status: "EN_ATTENTE",
      reference_paiement: ""
    });
    setShowCreateVersementModal(true);
  };

  // Sauvegarder les modifications paiement
  const saveModifications = async () => {
    try {
      await paiementApi.updatePaiement(selectedPaiement.id, editData);
      
      showNotification("Paiement modifié avec succès!", "success");
      setShowEditModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      showNotification("Erreur lors de la modification", "error");
    }
  };

  // Créer un nouveau paiement
  // const createPaiement = async () => {
  //   try {
  //     if (!newPaiementData.etudiant) {
  //       showNotification("Veuillez sélectionner un étudiant", "error");
  //       return;
  //     }
      
  //     if (!newPaiementData.montant || parseFloat(newPaiementData.montant) <= 0) {
  //       showNotification("Veuillez entrer un montant valide", "error");
  //       return;
  //     }

  //     await paiementApi.createPaiement(newPaiementData);
      
  //     showNotification("Paiement créé avec succès!", "success");
  //     setShowCreateModal(false);
  //     loadData();
      
  //   } catch (error) {
  //     console.error("Erreur lors de la création:", error);
  //     showNotification("Erreur lors de la création: " + error.message, "error");
  //   }
  // };

  // CORRIGÉ: Créer un nouvel échéancier selon votre modèle
  const createEcheancier = async () => {
    try {
      console.log("Données à envoyer pour création d'échéancier:", newEcheancierData);
      
      if (!newEcheancierData.etudiant) {
        showNotification("Veuillez sélectionner un étudiant", "error");
        return;
      }
      
      if (!newEcheancierData.montant_par_echeance || parseFloat(newEcheancierData.montant_par_echeance) <= 0) {
        showNotification("Veuillez entrer un montant par échéance valide", "error");
        return;
      }

      // Préparer les données selon votre modèle Django
      const dataToSend = {
        etudiant: newEcheancierData.etudiant,
        nombre_echeances: parseInt(newEcheancierData.nombre_echeances || 3),
        montant_par_echeance: parseFloat(newEcheancierData.montant_par_echeance),
      };

      console.log("Données formatées pour API:", dataToSend);

      const response = await echeancierApi.createEcheancier(dataToSend);
      console.log("Réponse API création échéancier:", response.data);
      
      showNotification("Échéancier créé avec succès!", "success");
      setShowCreateEcheancierModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur complète lors de la création de l'échéancier:", error);
      
      if (error.response && error.response.data) {
        console.error("Détails de l'erreur du backend:", error.response.data);
        let errorMessage = "Erreur lors de la création";
        
        if (typeof error.response.data === 'object') {
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors.join(', ');
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
        
        showNotification(`Erreur: ${errorMessage}`, "error");
      } else {
        showNotification("Erreur de connexion au serveur", "error");
      }
    }
  };

  // CORRIGÉ: Créer un nouveau versement selon votre modèle
  const createVersement = async () => {
    try {
      console.log("Données à envoyer pour création de versement:", newVersementData);
      
      if (!newVersementData.echeancier) {
        showNotification("Veuillez sélectionner un échéancier", "error");
        return;
      }
      
      if (!newVersementData.montant || parseFloat(newVersementData.montant) <= 0) {
        showNotification("Veuillez entrer un montant valide", "error");
        return;
      }

      // Préparer les données selon votre modèle Django
      const dataToSend = {
        echeancier: newVersementData.echeancier,
        numero_echeance: parseInt(newVersementData.numero_echeance || 1),
        montant: parseFloat(newVersementData.montant),
        date_echeance: newVersementData.date_echeance,
        status: newVersementData.status,
        reference_paiement: newVersementData.reference_paiement || "",
      };

      // Ajouter date_paiement si elle existe
      if (newVersementData.date_paiement) {
        dataToSend.date_paiement = newVersementData.date_paiement;
      }

      console.log("Données formatées pour API:", dataToSend);

      const response = await versementApi.createVersement(dataToSend);
      console.log("Réponse API création versement:", response.data);
      
      showNotification("Versement créé avec succès!", "success");
      setShowCreateVersementModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur complète lors de la création du versement:", error);
      
      if (error.response && error.response.data) {
        console.error("Détails de l'erreur du backend:", error.response.data);
        let errorMessage = "Erreur lors de la création";
        
        if (typeof error.response.data === 'object') {
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors.join(', ');
        }
        
        showNotification(`Erreur: ${errorMessage}`, "error");
      } else {
        showNotification("Erreur de connexion au serveur", "error");
      }
    }
  };

  // Supprimer un paiement
  const deletePaiement = async () => {
    try {
      await paiementApi.deletePaiement(selectedPaiement.id);
      
      showNotification("Paiement supprimé avec succès!", "success");
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showNotification("Erreur lors de la suppression", "error");
    }
  };

  // Exporter les données
  const exportData = () => {
    let dataToExport = [];
    
    if (tabValue === 0) {
      // Exporter les paiements
      dataToExport = filteredPaiements.map(paiement => {
        const etudiant = findEtudiantById(paiement.etudiant);
        return {
          "ID": paiement.id,
          "Étudiant ID": paiement.etudiant,
          "Nom Étudiant": etudiant ? `${etudiant.nom} ${etudiant.prenom}` : "Inconnu",
          "Matricule": etudiant?.matricule || "-",
          "Montant": paiement.montant,
          "Montant Restant": paiement.montant_restant || 0,
          "Statut": getStatutStyle(paiement.status).label,
          "Date Paiement": formatDate(paiement.date_paiement),
          "Mode Paiement": paiement.mode_paiement || "-",
          "Notes": paiement.notes || "-"
        };
      });
    } else if (tabValue === 1) {
      // CORRIGÉ: Exporter les échéanciers selon votre modèle
      dataToExport = filteredEcheanciers.map(echeancier => {
        const etudiant = findEtudiantById(echeancier.etudiant);
        const montantTotal = parseFloat(echeancier.montant_par_echeance || 0) * parseInt(echeancier.nombre_echeances || 0);
        
        return {
          "ID": echeancier.id,
          "Étudiant ID": echeancier.etudiant,
          "Nom Étudiant": etudiant ? `${etudiant.nom} ${etudiant.prenom}` : "Inconnu",
          "Nombre d'échéances": echeancier.nombre_echeances,
          "Montant par échéance": echeancier.montant_par_echeance,
          "Montant Total": montantTotal,
          "Date Création": formatDate(echeancier.created_at),
        };
      });
    } else if (tabValue === 2) {
      // CORRIGÉ: Exporter les versements selon votre modèle
      dataToExport = filteredVersements.map(versement => {
        const echeancier = findEcheancierById(versement.echeancier);
        const etudiant = echeancier ? findEtudiantById(echeancier.etudiant) : null;
        
        return {
          "ID": versement.id,
          "Échéancier ID": versement.echeancier || "-",
          "Nom Étudiant": etudiant ? `${etudiant.nom} ${etudiant.prenom}` : "Inconnu",
          "Numéro Échéance": versement.numero_echeance,
          "Montant": versement.montant,
          "Statut": getVersementStatutStyle(versement.status).label,
          "Date Échéance": formatDate(versement.date_echeance),
          "Date Paiement": formatDate(versement.date_paiement) || "-",
          "Référence Paiement": versement.reference_paiement || "-",
        };
      });
    }

    const csv = convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tabValue === 0 ? 'paiements' : tabValue === 1 ? 'echeanciers' : 'versements'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && (value.includes(',') || value.includes('"')) ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  // CORRIGÉ: Rendu des statistiques selon l'onglet
  const renderStats = () => {
    if (tabValue === 0) {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Paiements
                </Typography>
                <Typography variant="h5" component="div" color="primary">
                  {formatMontant(stats.totalPaiements)} MGA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Confirmés
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {formatMontant(stats.totalConfirmes)} MGA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  En Attente
                </Typography>
                <Typography variant="h5" component="div" color="warning.main">
                  {stats.paiementsEnAttente}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Étudiants payés
                </Typography>
                <Typography variant="h5" component="div" color="info.main">
                  {stats.etudiantsAvecPaiement}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    } else if (tabValue === 1) {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Échéanciers
                </Typography>
                <Typography variant="h5" component="div" color="primary">
                  {stats.totalEcheanciers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Montant Total
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {formatMontant(stats.totalMontantEcheances)} MGA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Échéances totales
                </Typography>
                <Typography variant="h5" component="div" color="info.main">
                  {echeanciers.reduce((sum, e) => sum + parseInt(e.nombre_echeances || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Étudiants avec échéancier
                </Typography>
                <Typography variant="h5" component="div" color="warning.main">
                  {[...new Set(echeanciers.map(e => e.etudiant).filter(Boolean))].length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    } else if (tabValue === 2) {
      return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Versements
                </Typography>
                <Typography variant="h5" component="div" color="primary">
                  {stats.totalVersements}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Montant Total
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {formatMontant(stats.totalMontantVersements)} MGA
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Payés
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {stats.versementsPayes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  En retard
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {stats.versementsEnRetard}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
  };

  // CORRIGÉ: Rendu des filtres selon l'onglet
  const renderFilters = () => {
    if (tabValue === 0) {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                label="Statut"
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                {statutsPaiement.map((statut) => (
                  <MenuItem key={statut.value} value={statut.value}>
                    {statut.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Mode de paiement</InputLabel>
              <Select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                label="Mode de paiement"
              >
                <MenuItem value="">Tous les modes</MenuItem>
                {modesPaiement.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Étudiant</InputLabel>
              <Select
                value={filterEtudiant}
                onChange={(e) => setFilterEtudiant(e.target.value)}
                label="Étudiant"
              >
                <MenuItem value="">Tous les étudiants</MenuItem>
                {etudiants.map((etudiant) => (
                  <MenuItem key={etudiant.id} value={etudiant.id}>
                    {etudiant.nom} {etudiant.prenom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    } else if (tabValue === 1) {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Étudiant</InputLabel>
              <Select
                value={filterEcheancierEtudiant}
                onChange={(e) => setFilterEcheancierEtudiant(e.target.value)}
                label="Étudiant"
              >
                <MenuItem value="">Tous les étudiants</MenuItem>
                {etudiants.map((etudiant) => (
                  <MenuItem key={etudiant.id} value={etudiant.id}>
                    {etudiant.nom} {etudiant.prenom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    } else if (tabValue === 2) {
      return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filterVersementStatus}
                onChange={(e) => setFilterVersementStatus(e.target.value)}
                label="Statut"
              >
                <MenuItem value="">Tous les statuts</MenuItem>
                {statutsVersement.map((statut) => (
                  <MenuItem key={statut.value} value={statut.value}>
                    {statut.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Étudiant</InputLabel>
              <Select
                value={filterVersementEtudiant}
                onChange={(e) => setFilterVersementEtudiant(e.target.value)}
                label="Étudiant"
              >
                <MenuItem value="">Tous les étudiants</MenuItem>
                {etudiants.map((etudiant) => (
                  <MenuItem key={etudiant.id} value={etudiant.id}>
                    {etudiant.nom} {etudiant.prenom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      );
    }
  };

  // Rendu du bouton "Nouveau" selon l'onglet
  const renderNewButton = () => {
    if (tabValue === 0) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateModal}
          sx={{ mr: 2 }}
          disabled={etudiants.length === 0}
        >
          Nouveau Paiement
        </Button>
      );
    } else if (tabValue === 1) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateEcheancierModal}
          sx={{ mr: 2 }}
          disabled={etudiants.length === 0}
        >
          Nouvel Échéancier
        </Button>
      );
    } else if (tabValue === 2) {
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateVersementModal}
          sx={{ mr: 2 }}
          disabled={etudiants.length === 0 || echeanciers.length === 0}
        >
          Nouveau Versement
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement des données...</Typography>
      </Box>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Toast Notification */}
      {toastOpen && (
        <Alert 
          severity={toastSeverity} 
          onClose={() => setToastOpen(false)}
          sx={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 9999,
            minWidth: 300 
          }}
        >
          {toastMessage}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
          <PaymentIcon sx={{ mr: 2 }} />
          Gestion des Paiements
        </Typography>
        <Typography color="textSecondary">
          {tabValue === 0 && `${paiements.length} paiements enregistrés • ${etudiants.length} étudiants`}
          {tabValue === 1 && `${echeanciers.length} échéanciers enregistrés`}
          {tabValue === 2 && `${versements.length} versements enregistrés`}
        </Typography>
      </Box>

      {/* Statistiques */}
      {renderStats()}

      {/* Barre d'outils */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              {renderFilters()}
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
              {renderNewButton()}
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DownloadIcon />}
                onClick={exportData}
                disabled={
                  (tabValue === 0 && filteredPaiements.length === 0) ||
                  (tabValue === 1 && filteredEcheanciers.length === 0) ||
                  (tabValue === 2 && filteredVersements.length === 0)
                }
              >
                Exporter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)} 
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Paiements" icon={<PaymentIcon />} />
          <Tab label="Échéanciers" icon={<ScheduleIcon />} />
          <Tab label="Versements" icon={<ReceiptIcon />} />
        </Tabs>
      </Paper>

      {/* Affichage des erreurs */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button variant="outlined" size="small" sx={{ ml: 2 }} onClick={loadData}>
            Réessayer
          </Button>
        </Alert>
      )}

      {/* Avertissement si pas d'étudiants */}
      {etudiants.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Aucun étudiant trouvé. Veuillez d'abord créer des étudiants dans le système.
        </Alert>
      )}

      {/* Contenu des Tabs - Paiements */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Étudiant</strong></TableCell>
                <TableCell align="right"><strong>Montant</strong></TableCell>
                <TableCell align="right"><strong>Restant</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Date Paiement</strong></TableCell>
                <TableCell><strong>Mode</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPaiements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm || filterStatut || filterMode || filterEtudiant ? 
                        "Aucun paiement ne correspond aux filtres" : 
                        "Aucun paiement enregistré"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPaiements.map((paiement) => {
                  const statut = getStatutStyle(paiement.status);
                  const etudiant = findEtudiantById(paiement.etudiant);
                  
                  return (
                    <TableRow key={paiement.id} hover>
                      <TableCell>{paiement.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : `Étudiant #${paiement.etudiant}`}
                          </Typography>
                          {etudiant && (
                            <Typography variant="caption" color="textSecondary">
                              {etudiant.matricule} • {etudiant.niveau}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary">
                          {formatMontant(paiement.montant)} MGA
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color={paiement.montant_restant > 0 ? "error" : "success"}>
                          {formatMontant(paiement.montant_restant || 0)} MGA
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statut.icon}
                          label={statut.label}
                          color={statut.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(paiement.date_paiement)}</TableCell>
                      <TableCell>
                        {paiement.mode_paiement || (
                          <Typography color="textSecondary" variant="caption">
                            Non spécifié
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => openDetailModal(paiement)}
                            title="Détails"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => openEditModal(paiement)}
                            title="Modifier"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* CORRIGÉ: Contenu des Tabs - Échéanciers selon votre modèle */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Étudiant</strong></TableCell>
                <TableCell align="center"><strong>Nombre d'échéances</strong></TableCell>
                <TableCell align="right"><strong>Montant par échéance</strong></TableCell>
                <TableCell align="right"><strong>Montant total</strong></TableCell>
                <TableCell><strong>Date création</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEcheanciers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm || filterEcheancierEtudiant ? 
                        "Aucun échéancier ne correspond aux filtres" : 
                        "Aucun échéancier enregistré"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEcheanciers.map((echeancier) => {
                  const etudiant = findEtudiantById(echeancier.etudiant);
                  const montantTotal = parseFloat(echeancier.montant_par_echeance || 0) * parseInt(echeancier.nombre_echeances || 0);
                  
                  return (
                    <TableRow key={echeancier.id} hover>
                      <TableCell>{echeancier.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : `Étudiant #${echeancier.etudiant}`}
                          </Typography>
                          {etudiant && (
                            <Typography variant="caption" color="textSecondary">
                              {etudiant.matricule}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {echeancier.nombre_echeances} échéances
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary">
                          {formatMontant(echeancier.montant_par_echeance)} MGA
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="success.main">
                          {formatMontant(montantTotal)} MGA
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(echeancier.created_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* CORRIGÉ: Contenu des Tabs - Versements selon votre modèle */}
      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Étudiant</strong></TableCell>
                <TableCell><strong>Échéancier</strong></TableCell>
                <TableCell><strong>N° Échéance</strong></TableCell>
                <TableCell align="right"><strong>Montant</strong></TableCell>
                <TableCell><strong>Statut</strong></TableCell>
                <TableCell><strong>Date Échéance</strong></TableCell>
                <TableCell><strong>Date Paiement</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVersements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm || filterVersementStatus || filterVersementEtudiant ? 
                        "Aucun versement ne correspond aux filtres" : 
                        "Aucun versement enregistré"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVersements.map((versement) => {
                  const statut = getVersementStatutStyle(versement.status);
                  const echeancier = findEcheancierById(versement.echeancier);
                  const etudiant = echeancier ? findEtudiantById(echeancier.etudiant) : null;
                  
                  return (
                    <TableRow key={versement.id} hover>
                      <TableCell>{versement.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : "Inconnu"}
                          </Typography>
                          {etudiant && (
                            <Typography variant="caption" color="textSecondary">
                              {etudiant.matricule}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {echeancier ? `Échéancier #${echeancier.id}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {versement.numero_echeance}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary">
                          {formatMontant(versement.montant)} MGA
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statut.icon}
                          label={statut.label}
                          color={statut.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(versement.date_echeance)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={versement.date_paiement ? "success.main" : "text.secondary"}>
                          {versement.date_paiement ? formatDate(versement.date_paiement) : "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Détails Paiement */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PaymentIcon sx={{ mr: 2 }} />
            Détails du Paiement
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPaiement && selectedEtudiant && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Informations de l'Étudiant
                </Typography>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Nom complet</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedEtudiant.nom} {selectedEtudiant.prenom}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="textSecondary">Matricule</Typography>
                      <Typography variant="body1">{selectedEtudiant.matricule}</Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Informations du Paiement
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">ID Paiement</Typography>
                    <Typography variant="body1">{selectedPaiement.id}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Statut</Typography>
                    <Chip
                      icon={getStatutStyle(selectedPaiement.status).icon}
                      label={getStatutStyle(selectedPaiement.status).label}
                      color={getStatutStyle(selectedPaiement.status).color}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Montant Total</Typography>
                    <Typography variant="h5" color="primary">
                      {formatMontant(selectedPaiement.montant)} MGA
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Montant Restant</Typography>
                    <Typography variant="h5" color={selectedPaiement.montant_restant > 0 ? "error" : "success"}>
                      {formatMontant(selectedPaiement.montant_restant || 0)} MGA
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Date Paiement</Typography>
                    <Typography variant="body1">{formatDate(selectedPaiement.date_paiement)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                    <Typography variant="body1" sx={{ 
                      whiteSpace: 'pre-wrap',
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}>
                      {selectedPaiement.notes || "Aucune note"}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailModal(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Édition Paiement */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le Paiement</DialogTitle>
        <DialogContent>
          {selectedEtudiant ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Étudiant : <strong>{selectedEtudiant.nom} {selectedEtudiant.prenom}</strong>
                <br />
                Matricule : {selectedEtudiant.matricule}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Montant (MGA)"
                    type="number"
                    value={editData.montant}
                    onChange={(e) => setEditData({ ...editData, montant: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Montant Restant (MGA)"
                    type="number"
                    value={editData.montant_restant}
                    onChange={(e) => setEditData({ ...editData, montant_restant: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      label="Statut"
                    >
                      {statutsPaiement.map((statut) => (
                        <MenuItem key={statut.value} value={statut.value}>
                          {statut.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date Paiement"
                    type="date"
                    value={editData.date_paiement}
                    onChange={(e) => setEditData({ ...editData, date_paiement: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography color="error" sx={{ mt: 2 }}>
              Étudiant non trouvé
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)}>Annuler</Button>
          <Button color="error" onClick={() => setShowDeleteConfirm(true)}>
            Supprimer
          </Button>
          <Button variant="contained" onClick={saveModifications}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

 <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Nouveau Paiement</DialogTitle>

  <DialogContent>
    <Box sx={{ mt: 2 }}>

      {/* Choix type paiement */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          variant={typePaiement === "etudiant" ? "contained" : "outlined"}
          onClick={() => setTypePaiement("etudiant")}
        >
          Paiement par Étudiant
        </Button>

        <Button
          variant={typePaiement === "faculte" ? "contained" : "outlined"}
          onClick={() => setTypePaiement("faculte")}
        >
          Paiement par Faculté
        </Button>
      </Box>

      <Grid container spacing={2}>

        {/* ===== Paiement par ETUDIANT ===== */}
        {typePaiement === "etudiant" && (
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Étudiant *</InputLabel>
              <Select
                value={newPaiementData.etudiant}
                onChange={(e) =>
                  setNewPaiementData({ ...newPaiementData, etudiant: e.target.value })
                }
                label="Étudiant *"
              >
                {etudiants.map((etudiant) => (
                  <MenuItem key={etudiant.id} value={etudiant.id}>
                    {etudiant.nom} {etudiant.prenom} ({etudiant.matricule})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* ===== Paiement par FACULTE ===== */}
        {typePaiement === "faculte" && (
          <>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Faculté *</InputLabel>
                <Select
                  value={newPaiementData.faculte}
                  onChange={(e) =>
                    setNewPaiementData({ ...newPaiementData, faculte: e.target.value })
                  }
                  label="Faculté *"
                >
                  {facultes.map((fac) => (
                    <MenuItem key={fac.id} value={fac.id}>
                      {fac.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Niveau */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Niveau *</InputLabel>
                <Select
                  value={newPaiementData.niveau}
                  onChange={(e) =>
                    setNewPaiementData({ ...newPaiementData, niveau: e.target.value })
                  }
                  label="Niveau *"
                >
                  <MenuItem value="L1">Licence 1 (L1)</MenuItem>
                  <MenuItem value="L2">Licence 2 (L2)</MenuItem>
                  <MenuItem value="L3">Licence 3 (L3)</MenuItem>
                  <MenuItem value="M1">Master 1 (M1)</MenuItem>
                  <MenuItem value="M2">Master 2 (M2)</MenuItem>
                  <MenuItem value="DOCTORAT">Doctorat</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </>
        )}

        {/* ===== Nombre d'échéances ===== */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nombre d'échéances"
            type="number"
            inputProps={{ min: 1 }}
            value={newPaiementData.nombre_echeance}
            onChange={(e) =>
              setNewPaiementData({
                ...newPaiementData,
                nombre_echeance: e.target.value
              })
            }
            required
          />
        </Grid>

        {/* Date */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Date Paiement"
            type="date"
            value={newPaiementData.date_paiement}
            onChange={(e) =>
              setNewPaiementData({
                ...newPaiementData,
                date_paiement: e.target.value
              })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>

      </Grid>
    </Box>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setShowCreateModal(false)}>Annuler</Button>
    <Button
      variant="contained"
      onClick={createPaiement}
      disabled={
        (typePaiement === "etudiant" && !newPaiementData.etudiant) ||
        (typePaiement === "faculte" && (!newPaiementData.faculte || !newPaiementData.niveau)) ||
        !newPaiementData.nombre_echeance ||
        !newPaiementData.date_paiement
      }
    >
      Créer
    </Button>
  </DialogActions>
</Dialog>





      {/* CORRIGÉ: Modal Création Échéancier selon votre modèle */}
      <Dialog open={showCreateEcheancierModal} onClose={() => setShowCreateEcheancierModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvel Échéancier</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {etudiants.length === 0 ? (
              <Alert severity="warning">
                Aucun étudiant disponible. Veuillez d'abord créer des étudiants.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Étudiant *</InputLabel>
                    <Select
                      value={newEcheancierData.etudiant}
                      onChange={(e) => setNewEcheancierData({ ...newEcheancierData, etudiant: e.target.value })}
                      label="Étudiant *"
                      error={!newEcheancierData.etudiant}
                    >
                      {etudiants.map((etudiant) => (
                        <MenuItem key={etudiant.id} value={etudiant.id}>
                          {etudiant.nom} {etudiant.prenom} ({etudiant.matricule})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre d'échéances"
                    type="number"
                    value={newEcheancierData.nombre_echeances}
                    onChange={(e) => setNewEcheancierData({ ...newEcheancierData, nombre_echeances: e.target.value })}
                    helperText="Nombre de versements (3 par défaut)"
                    InputProps={{
                      inputProps: { min: 1, max: 12 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Montant par échéance (MGA) *"
                    type="number"
                    value={newEcheancierData.montant_par_echeance}
                    onChange={(e) => setNewEcheancierData({ ...newEcheancierData, montant_par_echeance: e.target.value })}
                    required
                    error={!newEcheancierData.montant_par_echeance || parseFloat(newEcheancierData.montant_par_echeance) <= 0}
                    helperText={!newEcheancierData.montant_par_echeance ? "Ce champ est requis" : parseFloat(newEcheancierData.montant_par_echeance) <= 0 ? "Le montant doit être positif" : ""}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      Montant total calculé : <strong>
                        {formatMontant(
                          (parseFloat(newEcheancierData.montant_par_echeance || 0) * 
                           parseInt(newEcheancierData.nombre_echeances || 3))
                        )} MGA
                      </strong>
                    </Typography>
                    <Typography variant="caption">
                      ({newEcheancierData.nombre_echeances || 3} échéances × {formatMontant(newEcheancierData.montant_par_echeance || 0)} MGA)
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateEcheancierModal(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={createEcheancier}
            disabled={!newEcheancierData.etudiant || !newEcheancierData.montant_par_echeance || parseFloat(newEcheancierData.montant_par_echeance) <= 0}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* CORRIGÉ: Modal Création Versement selon votre modèle */}
      <Dialog open={showCreateVersementModal} onClose={() => setShowCreateVersementModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau Versement</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {etudiants.length === 0 || echeanciers.length === 0 ? (
              <Alert severity="warning">
                {etudiants.length === 0 ? "Aucun étudiant disponible." : "Aucun échéancier disponible."}
                <br />
                Veuillez d'abord créer des étudiants et des échéanciers.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Échéancier *</InputLabel>
                    <Select
                      value={newVersementData.echeancier}
                      onChange={(e) => setNewVersementData({ ...newVersementData, echeancier: e.target.value })}
                      label="Échéancier *"
                      error={!newVersementData.echeancier}
                    >
                      {echeanciers.map((echeancier) => {
                        const etudiant = findEtudiantById(echeancier.etudiant);
                        const montantTotal = parseFloat(echeancier.montant_par_echeance || 0) * parseInt(echeancier.nombre_echeances || 0);
                        
                        return (
                          <MenuItem key={echeancier.id} value={echeancier.id}>
                            Échéancier #{echeancier.id} - {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : `Étudiant #${echeancier.etudiant}`} ({echeancier.nombre_echeances} × {formatMontant(echeancier.montant_par_echeance)} MGA = {formatMontant(montantTotal)} MGA)
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Numéro d'échéance"
                    type="number"
                    value={newVersementData.numero_echeance}
                    onChange={(e) => setNewVersementData({ ...newVersementData, numero_echeance: e.target.value })}
                    InputProps={{
                      inputProps: { min: 1, max: 12 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Montant (MGA) *"
                    type="number"
                    value={newVersementData.montant}
                    onChange={(e) => setNewVersementData({ ...newVersementData, montant: e.target.value })}
                    required
                    error={!newVersementData.montant || parseFloat(newVersementData.montant) <= 0}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date d'échéance"
                    type="date"
                    value={newVersementData.date_echeance}
                    onChange={(e) => setNewVersementData({ ...newVersementData, date_echeance: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date de paiement (optionnel)"
                    type="date"
                    value={newVersementData.date_paiement}
                    onChange={(e) => setNewVersementData({ ...newVersementData, date_paiement: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={newVersementData.status}
                      onChange={(e) => setNewVersementData({ ...newVersementData, status: e.target.value })}
                      label="Statut"
                    >
                      {statutsVersement.map((statut) => (
                        <MenuItem key={statut.value} value={statut.value}>
                          {statut.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Référence de paiement (optionnel)"
                    value={newVersementData.reference_paiement}
                    onChange={(e) => setNewVersementData({ ...newVersementData, reference_paiement: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateVersementModal(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={createVersement}
            disabled={!newVersementData.echeancier || !newVersementData.montant || parseFloat(newVersementData.montant) <= 0}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Confirmation Suppression */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce paiement ?
            <br />
            <strong>Cette action est irréversible.</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={deletePaiement}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}