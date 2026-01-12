import React, { useState, useEffect } from "react";
import {
  FaEdit, FaTrash, FaPlus, FaSearch, FaEye, FaFileExport, FaDownload,
  FaMoneyBillWave, FaCalendarAlt, FaReceipt, FaSchool, FaFilter,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaFilePdf,PendingIcon
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
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import 'bootstrap/dist/css/bootstrap.min.css';
import api, { etudiantApi } from '../api';

// Créer les endpoints API pour les paiements
const paiementApi = {
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

  getPaiement: (id) => api.get(`/paiements/${id}/`),

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

  deletePaiement: (id) => api.delete(`/paiements/${id}/`),
};

// API pour les échéanciers
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

// API pour les versements
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
  const [activeTab, setActiveTab] = useState('paiements');

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterEtudiant, setFilterEtudiant] = useState("");

  // États pour les notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // États pour les modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // États pour les données modales
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [facultes, setFacultes] = useState([]);
  const [typePaiement, setTypePaiement] = useState("etudiant");
  const [selectedFaculteExport, setSelectedFaculteExport] = useState("");
  const [selectedNiveauExport, setSelectedNiveauExport] = useState("");

  // Formulaires
  const [editData, setEditData] = useState({
    status: "EN_ATTENTE",
    date_paiement: "",
  });

  const [newPaiementData, setNewPaiementData] = useState({
    etudiant: "",
    faculte: "",
    niveau: "",
    nombre_echeance: "",
    date_paiement: new Date().toISOString().split('T')[0],
    notes: "",
    paiementEquipement: 0
  });

  // Options
  const statutsPaiement = [
    { value: "EN_ATTENTE", label: "En attente", color: "warning" },
    { value: "CONFIRME", label: "Confirmé", color: "success" },
    { value: "ECHOUE", label: "Échoué", color: "danger" },
    { value: "REMBOURSÉ", label: "Remboursé", color: "info" }
  ];

  const statutsVersement = [
    { value: "EN_ATTENTE", label: "En attente", color: "warning" },
    { value: "PAYE", label: "Payé", color: "success" },
    { value: "RETARD", label: "En retard", color: "danger" }
  ];

  const niveaux = ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Doctorat"];

  // Fonction pour montrer les toasts
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Début du chargement des données...");

      // Charger les étudiants
      const etudiantsResponse = await etudiantApi.getEtudiants();
      let etudiantsData = [];
      if (etudiantsResponse && etudiantsResponse.data) {
        if (Array.isArray(etudiantsResponse.data)) {
          etudiantsData = etudiantsResponse.data;
        } else if (typeof etudiantsResponse.data === 'object') {
          etudiantsData = etudiantsResponse.data.results || etudiantsResponse.data.data || [];
        }
      }
      setEtudiants(etudiantsData);

      // Charger les paiements
      const paiementsResponse = await paiementApi.getPaiements();
      let paiementsData = [];
      if (paiementsResponse && paiementsResponse.data) {
        if (Array.isArray(paiementsResponse.data)) {
          paiementsData = paiementsResponse.data;
        } else if (typeof paiementsResponse.data === 'object') {
          paiementsData = paiementsResponse.data.results || paiementsResponse.data.data || [];
        }
      }
      setPaiements(paiementsData);

      // Charger les facultés
      const fetchFacultes = async () => {
        try {
          const res = await fetch("http://localhost:8000/api/facultes/");
          if (!res.ok) throw new Error("Erreur lors du chargement des facultés");
          const data = await res.json();
          if (Array.isArray(data)) {
            setFacultes(data);
          } else if (data.results && Array.isArray(data.results)) {
            setFacultes(data.results);
          } else {
            setFacultes([]);
          }
        } catch (err) {
          console.error("Erreur fetch facultés :", err);
          setFacultes([]);
        }
      };
      await fetchFacultes();

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
      showToast("Erreur lors du chargement des données", "danger");
    } finally {
      setLoading(false);
    }
  };

  // Charger au démarrage
  useEffect(() => {
    loadData();
  }, []);

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

  // Formater le montant
  const formatMontant = (montant) => {
    if (!montant) return "0,00";
    return parseFloat(montant).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  };

  // Obtenir le statut avec style pour paiements
  const getStatutStyle = (statut) => {
    const found = statutsPaiement.find(s => s.value === statut);
    return found || { label: statut || "Inconnu", color: "secondary" };
  };

  // Obtenir le statut avec style pour versements
  const getVersementStatutStyle = (statut) => {
    const found = statutsVersement.find(s => s.value === statut);
    return found || { label: statut || "Inconnu", color: "secondary" };
  };

  // Filtrer les paiements
  const filteredPaiements = paiements.filter(paiement => {
    if (!paiement) return false;
    
    const etudiant = findEtudiantById(paiement.etudiant);
    const etudiantName = etudiant ? `${etudiant.nom} ${etudiant.prenom}`.toLowerCase() : "";
    
    const matchesSearch = etudiantName.includes(searchTerm.toLowerCase()) ||
      (paiement.id && paiement.id.toString().includes(searchTerm));
    
    const matchesStatut = filterStatut ? paiement.status === filterStatut : true;
    const matchesEtudiant = filterEtudiant ? paiement.etudiant == filterEtudiant : true;
    
    return matchesSearch && matchesStatut && matchesEtudiant;
  });

  // Filtrer les échéanciers
  const filteredEcheanciers = echeanciers.filter(echeancier => {
    if (!echeancier) return false;
    
    const etudiant = findEtudiantById(echeancier.etudiant);
    const etudiantName = etudiant ? `${etudiant.nom} ${etudiant.prenom}`.toLowerCase() : "";
    
    const matchesSearch = etudiantName.includes(searchTerm.toLowerCase());
    const matchesEtudiant = filterEtudiant ? echeancier.etudiant == filterEtudiant : true;
    
    return matchesSearch && matchesEtudiant;
  });

  // Filtrer les versements
  const filteredVersements = versements.filter(versement => {
    if (!versement) return false;
    
    const echeancier = findEcheancierById(versement.echeancier);
    const etudiant = echeancier ? findEtudiantById(echeancier.etudiant) : null;
    const etudiantName = etudiant ? `${etudiant.nom} ${etudiant.prenom}`.toLowerCase() : "";
    
    const matchesSearch = etudiantName.includes(searchTerm.toLowerCase());
    const matchesEtudiant = filterEtudiant ? 
      (echeancier && echeancier.etudiant == filterEtudiant) : true;
    
    return matchesSearch && matchesEtudiant;
  });

  // Calculer les statistiques
  const calculateStats = () => {
    const totalPaiements = paiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const paiementsConfirmes = paiements.filter(p => p.status === "CONFIRME");
    const totalConfirmes = paiementsConfirmes.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const paiementsEnAttente = paiements.filter(p => p.status === "EN_ATTENTE").length;
    const etudiantsAvecPaiement = [...new Set(paiements.map(p => p.etudiant).filter(Boolean))].length;

    return {
      totalPaiements,
      totalConfirmes,
      paiementsEnAttente,
      etudiantsAvecPaiement,
    };
  };

  const stats = calculateStats();

  // Ouvrir modal de détails
  const openDetailModal = (paiement) => {
    setSelectedPaiement(paiement);
    const etudiant = findEtudiantById(paiement.etudiant);
    setSelectedEtudiant(etudiant);
    setShowDetailModal(true);
  };

  // Ouvrir modal d'édition
  const openEditModal = (paiement) => {
    setSelectedPaiement(paiement);
    const etudiant = findEtudiantById(paiement.etudiant);
    setSelectedEtudiant(etudiant);
    
    setEditData({
      status: paiement.status || "EN_ATTENTE",
      date_paiement: paiement.date_paiement ? paiement.date_paiement.split('T')[0] : "",
    });
    
    setShowEditModal(true);
  };

  // Ouvrir modal de création
  const openCreateModal = () => {
    setNewPaiementData({
      etudiant: etudiants.length > 0 ? etudiants[0].id : "",
      faculte: "",
      niveau: "",
      nombre_echeance: "",
      date_paiement: new Date().toISOString().split('T')[0],
      notes: "",
      paiementEquipement: 0
    });
    setShowCreateModal(true);
  };

  // Créer un paiement
  const createPaiement = async () => {
    try {
      const url = typePaiement === "etudiant"
        ? "http://localhost:8000/api/paiement-individuel/"
        : "http://localhost:8000/api/paiement-collectif/";

      const payload = typePaiement === "etudiant"
        ? {
            etudiant: newPaiementData.etudiant,
            nombre_echeances: Number(newPaiementData.nombre_echeance),
            date_paiement: newPaiementData.date_paiement,
            notes: newPaiementData.notes,
            paiement_equipement: Number(newPaiementData.paiementEquipement || 0),
          }
        : {
            faculte: newPaiementData.faculte,
            niveau: newPaiementData.niveau,
            nombre_echeances: Number(newPaiementData.nombre_echeance),
            date_paiement: newPaiementData.date_paiement,
            notes: newPaiementData.notes,
            paiement_equipement: Number(newPaiementData.paiementEquipement || 0),
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
      showToast(data.message || "Paiement créé avec succès!", "success");
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la création du paiement", "danger");
    }
  };

  // Sauvegarder les modifications
  const saveModifications = async () => {
    try {
      await paiementApi.updatePaiement(selectedPaiement.id, editData);
      showToast("Paiement modifié avec succès!", "success");
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      showToast("Erreur lors de la modification", "danger");
    }
  };

  // Ouvrir modal de suppression
  const openDeleteModal = (paiement) => {
    setSelectedPaiement(paiement);
    setShowDeleteModal(true);
  };

  // Confirmer suppression
  const confirmDelete = async () => {
    if (!selectedPaiement) return;
    try {
      await paiementApi.deletePaiement(selectedPaiement.id);
      showToast("Paiement supprimé avec succès!", "success");
      setShowDeleteModal(false);
      setSelectedPaiement(null);
      loadData();
    } catch (err) {
      console.error("Erreur suppression:", err);
      showToast("Erreur lors de la suppression", "danger");
    }
  };

  // Exporter les données
  const exportData = (faculteId, niveau) => {
    const url = `http://localhost:8000/api/exportPdf_urls/exportPdf/?faculte=${faculteId}&niveau=${niveau}`;
    window.open(url, "_blank");
  };

  // Rendu des statistiques
  const renderStats = () => {
    if (activeTab !== 'paiements') return null;

    return (
      <Row className="mt-4">
        <Col md={3}>
          <Card border="primary">
            <Card.Body>
              <h6 className="card-subtitle mb-2 text-muted">Total Paiements</h6>
              <h3 className="card-title text-primary">
                {formatMontant(stats.totalPaiements)} MGA
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card border="success">
            <Card.Body>
              <h6 className="card-subtitle mb-2 text-muted">Confirmés</h6>
              <h3 className="card-title text-success">
                {formatMontant(stats.totalConfirmes)} MGA
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card border="warning">
            <Card.Body>
              <h6 className="card-subtitle mb-2 text-muted">En Attente</h6>
              <h3 className="card-title text-warning">
                {stats.paiementsEnAttente}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card border="info">
            <Card.Body>
              <h6 className="card-subtitle mb-2 text-muted">Étudiants payés</h6>
              <h3 className="card-title text-info">
                {stats.etudiantsAvecPaiement}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  // Filtres
  const renderFilters = () => {
    if (activeTab === 'paiements') {
      return (
        <Row className="g-2">
          <Col md={3}>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </InputGroup>
          </Col>
          
          <Col md={3}>
            <Form.Select 
              value={filterStatut} 
              onChange={(e) => setFilterStatut(e.target.value)}
              size="sm"
            >
              <option value="">Tous les statuts</option>
              {statutsPaiement.map((statut) => (
                <option key={statut.value} value={statut.value}>
                  {statut.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={3}>
            <Form.Select 
              value={filterEtudiant} 
              onChange={(e) => setFilterEtudiant(e.target.value)}
              size="sm"
            >
              <option value="">Tous les étudiants</option>
              {etudiants.map((etudiant) => (
                <option key={etudiant.id} value={etudiant.id}>
                  {etudiant.nom} {etudiant.prenom}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      );
    }
  };

  const renderNewButton = () => {
    if (activeTab === 'paiements') {
      return (
        <Button
          variant="primary"
          onClick={openCreateModal}
          className="d-inline-flex align-items-center me-2"
          disabled={etudiants.length === 0}
        >
          <FaPlus className="me-2" /> Nouveau Paiement
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
          <p className="mt-3 text-muted">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Toast Notification */}
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

      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-primary">
            <FaMoneyBillWave className="me-2" />
            Gestion des Paiements
          </h1>
          <p className="text-muted">
            {activeTab === 'paiements' && `${paiements.length} paiements enregistrés • ${etudiants.length} étudiants`}
            {activeTab === 'echeanciers' && `${echeanciers.length} échéanciers enregistrés`}
            {activeTab === 'versements' && `${versements.length} versements enregistrés`}
          </p>
        </div>
      </div>

      {/* Statistiques */}
      {renderStats()}

      {/* Barre d'outils */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              {renderFilters()}
            </Col>
            <Col md={4} className="text-end">
              {renderNewButton()}
              <Button
                variant="outline-secondary"
                onClick={() => setShowExportModal(true)}
                className="d-inline-flex align-items-center"
                disabled={filteredPaiements.length === 0}
              >
                <FaFileExport className="me-2" /> Exporter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="paiements" title={
          <span><FaMoneyBillWave className="me-1" /> Paiements</span>
        }>
          {/* Tableau Paiements */}
          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Chargement...</span>
                  </Spinner>
                  <p className="mt-3 text-muted">Chargement des données...</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <Table striped hover size="sm">
                    <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>ID</th>
                        <th>Étudiant</th>
                        <th>Montant total</th>
                        <th>Montant restant</th>
                        <th>Statut</th>
                        <th>Date paiement</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaiements.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <p className="text-muted">Aucun paiement trouvé</p>
                          </td>
                        </tr>
                      ) : (
                        filteredPaiements.map((paiement) => {
                          const statut = getStatutStyle(paiement.status);
                          const etudiant = findEtudiantById(paiement.etudiant);
                          
                          return (
                            <tr key={paiement.id}>
                              <td className="font-monospace">{paiement.id}</td>
                              <td>
                                {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : `Étudiant #${paiement.etudiant}`}
                              </td>
                              <td className="fw-medium text-primary">
                                {formatMontant(paiement.montant)} MGA
                              </td>
                              <td className="fw-medium text-danger">
                                {formatMontant(paiement.montant_restant || paiement.montant_restant_calcule || 0)} MGA
                              </td>
                              <td>
                                <Badge bg={statut.color} className="font-monospace">
                                  {statut.label}
                                </Badge>
                              </td>
                              <td>
                                {formatDate(paiement.date_paiement)}
                              </td>
                              <td className="text-center">
                                <div className="btn-group btn-group-sm" role="group">
                                  <Button
                                    variant="outline-info"
                                    onClick={() => openDetailModal(paiement)}
                                    title="Détails"
                                    size="sm"
                                  >
                                    <FaEye />
                                  </Button>
                                  <Button
                                    variant="outline-warning"
                                    onClick={() => openEditModal(paiement)}
                                    title="Modifier"
                                    size="sm"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    onClick={() => openDeleteModal(paiement)}
                                    title="Supprimer"
                                    size="sm"
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="echeanciers" title={
          <span><FaCalendarAlt className="me-1" /> Échéanciers</span>
        }>
          {/* Tableau Échéanciers */}
          <Card>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover size="sm">
                  <thead className="table-light">
                    <tr>
                      <th><strong>ID</strong></th>
                      <th><strong>Étudiant</strong></th>
                      <th className="text-center"><strong>Nombre d'échéances</strong></th>
                      <th className="text-end"><strong>Montant par échéance</strong></th>
                      <th className="text-end"><strong>Montant total</strong></th>
                      <th><strong>Date création</strong></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEcheanciers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <p className="text-muted">Aucun échéancier trouvé</p>
                        </td>
                      </tr>
                    ) : (
                      filteredEcheanciers.map((echeancier) => {
                        const etudiant = findEtudiantById(echeancier.etudiant);
                        const montantTotal = parseFloat(echeancier.montant_par_echeance || 0) * parseInt(echeancier.nombre_echeances || 0);
                        
                        return (
                          <tr key={echeancier.id}>
                            <td>{echeancier.id}</td>
                            <td>
                              <div>
                                <div className="fw-medium">
                                  {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : `Étudiant #${echeancier.etudiant}`}
                                </div>
                                {etudiant && (
                                  <small className="text-muted">
                                    {etudiant.matricule}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <div>
                                {echeancier.nombre_echeances} échéances
                              </div>
                            </td>
                            <td className="text-end fw-bold text-primary">
                              {formatMontant(echeancier.montant_par_echeance)} MGA
                            </td>
                            <td className="text-end fw-bold text-success">
                              {formatMontant(montantTotal)} MGA
                            </td>
                            <td>
                              {formatDate(echeancier.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="versements" title={
          <span><FaReceipt className="me-1" /> Versements</span>
        }>
          {/* Tableau Versements */}
          <Card>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover size="sm">
                  <thead className="table-light">
                    <tr>
                      <th><strong>ID</strong></th>
                      <th><strong>Étudiant</strong></th>
                      <th><strong>Échéancier</strong></th>
                      <th><strong>N° Échéance</strong></th>
                      <th className="text-end"><strong>Montant</strong></th>
                      <th><strong>Statut</strong></th>
                      <th><strong>Date Échéance</strong></th>
                      <th><strong>Date Paiement</strong></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVersements.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5">
                          <p className="text-muted">Aucun versement trouvé</p>
                        </td>
                      </tr>
                    ) : (
                      filteredVersements.map((versement) => {
                        const statut = getVersementStatutStyle(versement.status);
                        const echeancier = findEcheancierById(versement.echeancier);
                        const etudiant = echeancier ? findEtudiantById(echeancier.etudiant) : null;
                        
                        return (
                          <tr key={versement.id}>
                            <td>{versement.id}</td>
                            <td>
                              <div>
                                <div className="fw-medium">
                                  {etudiant ? `${etudiant.nom} ${etudiant.prenom}` : "Inconnu"}
                                </div>
                                {etudiant && (
                                  <small className="text-muted">
                                    {etudiant.matricule}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              {echeancier ? `Échéancier #${echeancier.id}` : "-"}
                            </td>
                            <td>
                              <div>
                                {versement.numero_echeance}
                              </div>
                            </td>
                            <td className="text-end fw-bold text-primary">
                              {formatMontant(versement.montant)} MGA
                            </td>
                            <td>
                              <Badge bg={statut.color} className="font-monospace">
                                {statut.label}
                              </Badge>
                            </td>
                            <td>
                              {formatDate(versement.date_echeance)}
                            </td>
                            <td>
                              <div className={versement.date_paiement ? "text-success" : "text-muted"}>
                                {versement.date_paiement ? formatDate(versement.date_paiement) : "-"}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Affichage des erreurs */}
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
          <Button variant="outline-primary" size="sm" className="ms-2" onClick={loadData}>
            Réessayer
          </Button>
        </Alert>
      )}

      {/* Avertissement si pas d'étudiants */}
      {etudiants.length === 0 && (
        <Alert variant="warning" className="mb-3">
          Aucun étudiant trouvé. Veuillez d'abord créer des étudiants dans le système.
        </Alert>
      )}

      {/* Modal Détails */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaEye className="me-2" />
            Détails du Paiement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPaiement && selectedEtudiant && (
            <Row>
              <Col md={6}>
                <h6 className="text-primary mb-3">Informations de l'Étudiant</h6>
                <Card className="mb-3">
                  <Card.Body>
                    <p><strong>Nom complet:</strong> {selectedEtudiant.nom} {selectedEtudiant.prenom}</p>
                    <p><strong>Matricule:</strong> {selectedEtudiant.matricule}</p>
                    <p><strong>Niveau:</strong> {selectedEtudiant.niveau}</p>
                    <p><strong>Faculté:</strong> {selectedEtudiant.faculte_nom || '-'}</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <h6 className="text-primary mb-3">Informations du Paiement</h6>
                <Card>
                  <Card.Body>
                    <p><strong>ID Paiement:</strong> {selectedPaiement.id}</p>
                    <p><strong>Statut:</strong> 
                      <Badge bg={getStatutStyle(selectedPaiement.status).color} className="ms-2">
                        {getStatutStyle(selectedPaiement.status).label}
                      </Badge>
                    </p>
                    <p><strong>Montant Total:</strong> 
                      <span className="fw-bold text-primary ms-2">
                        {formatMontant(selectedPaiement.montant)} MGA
                      </span>
                    </p>
                    <p><strong>Montant Restant:</strong> 
                      <span className={`fw-bold ms-2 ${(selectedPaiement.montant_restant || selectedPaiement.montant_restant_calcule || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatMontant(selectedPaiement.montant_restant || selectedPaiement.montant_restant_calcule || 0)} MGA
                      </span>
                    </p>
                    <p><strong>Date Paiement:</strong> {formatDate(selectedPaiement.date_paiement)}</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Édition */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            <FaEdit className="me-2" />
            Modifier le Paiement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant ? (
            <Form>
              <Alert variant="info" className="mb-3">
                <strong>Étudiant:</strong> {selectedEtudiant.nom} {selectedEtudiant.prenom}<br />
                <strong>Matricule:</strong> {selectedEtudiant.matricule}
              </Alert>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    >
                      {statutsPaiement.map((statut) => (
                        <option key={statut.value} value={statut.value}>
                          {statut.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date de confirmation</Form.Label>
                    <Form.Control
                      type="date"
                      value={editData.date_paiement}
                      onChange={(e) => setEditData({ ...editData, date_paiement: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          ) : (
            <Alert variant="danger">Étudiant non trouvé</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => {
            setShowEditModal(false);
            openDeleteModal(selectedPaiement);
          }}>
            Supprimer
          </Button>
          <Button variant="warning" onClick={saveModifications}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Création */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaPlus className="me-2" />
            Nouveau Paiement
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="d-flex mb-3">
              <Button
                variant={typePaiement === "etudiant" ? "primary" : "outline-primary"}
                onClick={() => setTypePaiement("etudiant")}
                className="me-2"
              >
                Paiement par Étudiant
              </Button>
              <Button
                variant={typePaiement === "faculte" ? "primary" : "outline-primary"}
                onClick={() => setTypePaiement("faculte")}
              >
                Paiement par Faculté
              </Button>
            </div>

            {typePaiement === "etudiant" && (
              <Form.Group className="mb-3">
                <Form.Label>Étudiant *</Form.Label>
                <Form.Select
                  value={newPaiementData.etudiant}
                  onChange={(e) => setNewPaiementData({ ...newPaiementData, etudiant: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un étudiant...</option>
                  {etudiants.map((etudiant) => (
                    <option key={etudiant.id} value={etudiant.id}>
                      {etudiant.nom} {etudiant.prenom} ({etudiant.matricule})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {typePaiement === "faculte" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Faculté *</Form.Label>
                  <Form.Select
                    value={newPaiementData.faculte}
                    onChange={(e) => setNewPaiementData({ ...newPaiementData, faculte: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une faculté...</option>
                    {facultes.map((faculte) => (
                      <option key={faculte.id} value={faculte.id}>
                        {faculte.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Niveau *</Form.Label>
                  <Form.Select
                    value={newPaiementData.niveau}
                    onChange={(e) => setNewPaiementData({ ...newPaiementData, niveau: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un niveau...</option>
                    {niveaux.map((niveau, index) => (
                      <option key={index} value={niveau}>{niveau}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre d'échéances *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={newPaiementData.nombre_echeance}
                    onChange={(e) => setNewPaiementData({
                      ...newPaiementData,
                      nombre_echeance: e.target.value
                    })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date Paiement *</Form.Label>
                  <Form.Control
                    type="date"
                    value={newPaiementData.date_paiement}
                    onChange={(e) => setNewPaiementData({
                      ...newPaiementData,
                      date_paiement: e.target.value
                    })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Check
              type="checkbox"
              label="Ajouter un paiement équipement de 66,000 MGA"
              checked={newPaiementData.paiementEquipement === 66000}
              onChange={(e) => setNewPaiementData({
                ...newPaiementData,
                paiementEquipement: e.target.checked ? 66000 : 0
              })}
              className="mb-3"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
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
        </Modal.Footer>
      </Modal>

      {/* Modal Suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPaiement && selectedEtudiant && (
            <>
              <Alert variant="danger">
                <Alert.Heading>⚠️ Attention !</Alert.Heading>
                <p>Cette action supprimera définitivement le paiement et toutes les données associées.</p>
              </Alert>

              <div className="p-3 bg-light rounded">
                <h5 className="mb-2">
                  Paiement #{selectedPaiement.id} - {selectedEtudiant.nom} {selectedEtudiant.prenom}
                </h5>
                <p className="mb-1">
                  <strong>Montant :</strong> {formatMontant(selectedPaiement.montant)} MGA
                </p>
                <p className="mb-1">
                  <strong>Statut :</strong> {getStatutStyle(selectedPaiement.status).label}
                </p>
                <p className="mb-1">
                  <strong>Date :</strong> {formatDate(selectedPaiement.date_paiement)}
                </p>
              </div>

              <p className="mt-3 text-muted">
                Voulez-vous vraiment supprimer ce paiement ?
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Export */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaFileExport className="me-2" />
            Options d'exportation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Faculté</Form.Label>
              <Form.Select
                value={selectedFaculteExport}
                onChange={(e) => setSelectedFaculteExport(e.target.value)}
              >
                <option value="">Toutes les facultés</option>
                {facultes.map((faculte) => (
                  <option key={faculte.id} value={faculte.id}>
                    {faculte.nom}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Niveau</Form.Label>
              <Form.Select
                value={selectedNiveauExport}
                onChange={(e) => setSelectedNiveauExport(e.target.value)}
              >
                <option value="">Tous les niveaux</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="L3">L3</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
                <option value="D2">D2</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={() => exportData(selectedFaculteExport, selectedNiveauExport)}>
            Exporter
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}