import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
  FormControlLabel,
  Checkbox,
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
} from "@mui/icons-material";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// API config - adapter selon votre configuration
const API_URL = "http://localhost:8000/api/paiements";

export default function Paiement() {
  // États pour les données
  const [paiements, setPaiements] = useState([]);
  const [echeanciers, setEcheanciers] = useState([]);
  const [versements, setVersements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterMontantMin, setFilterMontantMin] = useState("");
  const [filterMontantMax, setFilterMontantMax] = useState("");
  
  // États pour les modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateEcheancierModal, setShowCreateEcheancierModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // États pour les données modales
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [selectedEcheancier, setSelectedEcheancier] = useState(null);
  const [selectedVersement, setSelectedVersement] = useState(null);
  
  const [editData, setEditData] = useState({
    montant: "",
    statut: "EN_ATTENTE",
    date_paiement: "",
    mode_paiement: "",
    notes: "",
    etudiant: ""
  });

  const [newPaiementData, setNewPaiementData] = useState({
    montant: "",
    montant_restant: "",
    statut: "EN_ATTENTE",
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: "",
    notes: "",
    etudiant: ""
  });

  const [newEcheancierData, setNewEcheancierData] = useState({
    etudiant: "",
    nombre_echeances: 3,
    montant_par_echeance: "",
    notes: ""
  });

  // Statuts de paiement (selon votre modèle Django)
  const statutsPaiement = [
    { value: "EN_ATTENTE", label: "En attente", color: "warning", icon: <PendingIcon /> },
    { value: "CONFIRME", label: "Confirmé", color: "success", icon: <CheckIcon /> },
    { value: "ECHOUE", label: "Échoué", color: "error", icon: <WarningIcon /> },
    { value: "REMBOURSÉ", label: "Remboursé", color: "info", icon: <ReceiptIcon /> },
  ];

  // Modes de paiement
  const modesPaiement = [
    "ESPÈCES",
    "VIREMENT BANCAIRE",
    "CARTE BANCAIRE",
    "MOBILE MONEY",
    "CHÈQUE",
    "AUTRE"
  ];

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les paiements
      const paiementsResponse = await axios.get(`${API_URL}/`);
      const echeanciersResponse = await axios.get(`${API_URL.replace('paiements', 'echeanciers')}/`);
      const versementsResponse = await axios.get(`${API_URL.replace('paiements', 'versements')}/`);

      setPaiements(Array.isArray(paiementsResponse.data) ? paiementsResponse.data : []);
      setEcheanciers(Array.isArray(echeanciersResponse.data) ? echeanciersResponse.data : []);
      setVersements(Array.isArray(versementsResponse.data) ? versementsResponse.data : []);

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError(`Impossible de charger les données: ${error.message}`);
      
      // Initialiser avec des tableaux vides
      setPaiements([]);
      setEcheanciers([]);
      setVersements([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les paiements
  const filteredPaiements = paiements.filter(paiement => {
    const matchesSearch = 
      paiement.etudiant?.toString().includes(searchTerm) ||
      paiement.id?.toString().includes(searchTerm) ||
      paiement.mode_paiement?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = filterStatut ? paiement.statut === filterStatut : true;
    const matchesMode = filterMode ? paiement.mode_paiement === filterMode : true;
    
    const montant = parseFloat(paiement.montant || 0);
    const matchesMontantMin = filterMontantMin ? montant >= parseFloat(filterMontantMin) : true;
    const matchesMontantMax = filterMontantMax ? montant <= parseFloat(filterMontantMax) : true;

    return matchesSearch && matchesStatut && matchesMode && matchesMontantMin && matchesMontantMax;
  });

  // Filtrer les échéanciers
  const filteredEcheanciers = echeanciers.filter(echeancier => {
    return echeancier.etudiant?.toString().includes(searchTerm) ||
           echeancier.id?.toString().includes(searchTerm);
  });

  // Filtrer les versements
  const filteredVersements = versements.filter(versement => {
    return versement.echeancier?.toString().includes(searchTerm) ||
           versement.id?.toString().includes(searchTerm);
  });

  // Calculer les statistiques
  const calculateStats = () => {
    const totalPaiements = paiements.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const paiementsConfirmes = paiements.filter(p => p.statut === "CONFIRME");
    const totalConfirmes = paiementsConfirmes.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
    const paiementsEnAttente = paiements.filter(p => p.statut === "EN_ATTENTE").length;
    const paiementsEchoues = paiements.filter(p => p.statut === "ECHOUE").length;
    const montantRestantTotal = paiements.reduce((sum, p) => sum + parseFloat(p.montant_restant || 0), 0);

    return {
      totalPaiements,
      totalConfirmes,
      paiementsEnAttente,
      paiementsEchoues,
      montantRestantTotal,
      tauxConfirmation: paiements.length > 0 ? (paiementsConfirmes.length / paiements.length * 100).toFixed(1) : 0,
    };
  };

  const stats = calculateStats();

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
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

  // Obtenir le statut avec style
  const getStatutStyle = (statut) => {
    const found = statutsPaiement.find(s => s.value === statut);
    return found || { label: statut || "Inconnu", color: "default", icon: <WarningIcon /> };
  };

  // Ouvrir modal de détail
  const openDetailModal = (paiement) => {
    setSelectedPaiement(paiement);
    setShowDetailModal(true);
  };

  // Ouvrir modal d'édition
  const openEditModal = (paiement) => {
    setSelectedPaiement(paiement);
    setEditData({
      montant: paiement.montant || "",
      statut: paiement.statut || "EN_ATTENTE",
      date_paiement: paiement.date_paiement ? paiement.date_paiement.split('T')[0] : "",
      mode_paiement: paiement.mode_paiement || "",
      notes: paiement.notes || "",
      etudiant: paiement.etudiant || ""
    });
    setShowEditModal(true);
  };

  // Ouvrir modal de création de paiement
  const openCreateModal = () => {
    setNewPaiementData({
      montant: "",
      montant_restant: "",
      statut: "EN_ATTENTE",
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: "",
      notes: "",
      etudiant: ""
    });
    setShowCreateModal(true);
  };

  // Ouvrir modal de création d'échéancier
  const openCreateEcheancierModal = () => {
    setNewEcheancierData({
      etudiant: "",
      nombre_echeances: 3,
      montant_par_echeance: "",
      notes: ""
    });
    setShowCreateEcheancierModal(true);
  };

  // Sauvegarder les modifications
  const saveModifications = async () => {
    try {
      const response = await axios.put(
        `${API_URL}/${selectedPaiement.id}/`,
        editData
      );
      
      setToastMessage("Paiement modifié avec succès!");
      setToastVariant("success");
      setShowToast(true);
      setShowEditModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      setToastMessage("Erreur lors de la modification");
      setToastVariant("error");
      setShowToast(true);
    }
  };

  // Créer un nouveau paiement
  const createPaiement = async () => {
    try {
      const response = await axios.post(`${API_URL}/`, newPaiementData);
      
      setToastMessage("Paiement créé avec succès!");
      setToastVariant("success");
      setShowToast(true);
      setShowCreateModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      setToastMessage("Erreur lors de la création");
      setToastVariant("error");
      setShowToast(true);
    }
  };

  // Créer un nouvel échéancier
  const createEcheancier = async () => {
    try {
      const response = await axios.post(
        `${API_URL.replace('paiements', 'echeanciers')}/`,
        newEcheancierData
      );
      
      setToastMessage("Échéancier créé avec succès!");
      setToastVariant("success");
      setShowToast(true);
      setShowCreateEcheancierModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      setToastMessage("Erreur lors de la création");
      setToastVariant("error");
      setShowToast(true);
    }
  };

  // Supprimer un paiement
  const deletePaiement = async () => {
    try {
      await axios.delete(`${API_URL}/${selectedPaiement.id}/`);
      
      setToastMessage("Paiement supprimé avec succès!");
      setToastVariant("success");
      setShowToast(true);
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setToastMessage("Erreur lors de la suppression");
      setToastVariant("error");
      setShowToast(true);
    }
  };

  // Exporter les données
  const exportData = () => {
    const dataToExport = filteredPaiements.map(paiement => ({
      "ID": paiement.id,
      "Étudiant ID": paiement.etudiant,
      "Montant": paiement.montant,
      "Montant Restant": paiement.montant_restant || 0,
      "Statut": getStatutStyle(paiement.statut).label,
      "Date Paiement": formatDate(paiement.date_paiement),
      "Date Confirmation": formatDate(paiement.date_confirmation),
      "Mode Paiement": paiement.mode_paiement || "-",
      "Notes": paiement.notes || "-"
    }));

    const csv = convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Gestion des toasts (notifications)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
            <PaymentIcon className="me-2" />
            Gestion des Paiements
          </Typography>
          <Typography color="textSecondary">
            Gestion des paiements des frais de scolarité
          </Typography>
        </div>
      </div>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
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
              <Typography color="textSecondary" gutterBottom>
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
              <Typography color="textSecondary" gutterBottom>
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
              <Typography color="textSecondary" gutterBottom>
                Montant Restant
              </Typography>
              <Typography variant="h5" component="div" color="error.main">
                {formatMontant(stats.montantRestantTotal)} MGA
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barre d'outils */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
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
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="Montant min"
                    value={filterMontantMin}
                    onChange={(e) => setFilterMontantMin(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">≥</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={openCreateModal}
                sx={{ mr: 2 }}
              >
                Nouveau Paiement
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DownloadIcon />}
                onClick={exportData}
                disabled={filteredPaiements.length === 0}
              >
                Exporter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} centered>
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

      {/* Contenu des Tabs */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Étudiant</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell align="right">Restant</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date Paiement</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPaiements.map((paiement) => {
                const statut = getStatutStyle(paiement.statut);
                return (
                  <TableRow key={paiement.id}>
                    <TableCell>{paiement.id}</TableCell>
                    <TableCell>Étudiant #{paiement.etudiant}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        {formatMontant(paiement.montant)} MGA
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error">
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
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => openEditModal(paiement)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Échéanciers */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Étudiant</TableCell>
                <TableCell align="right">Nombre d'échéances</TableCell>
                <TableCell align="right">Montant par échéance</TableCell>
                <TableCell>Date Création</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEcheanciers.map((echeancier) => (
                <TableRow key={echeancier.id}>
                  <TableCell>{echeancier.id}</TableCell>
                  <TableCell>Étudiant #{echeancier.etudiant}</TableCell>
                  <TableCell align="right">{echeancier.nombre_echeances}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="primary">
                      {formatMontant(echeancier.montant_par_echeance)} MGA
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(echeancier.created_at)}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="info">
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Versements */}
      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Échéancier</TableCell>
                <TableCell>N° Échéance</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Date Échéance</TableCell>
                <TableCell>Date Paiement</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVersements.map((versement) => {
                const statut = getStatutStyle(versement.statut);
                return (
                  <TableRow key={versement.id}>
                    <TableCell>{versement.id}</TableCell>
                    <TableCell>Échéancier #{versement.echeancier}</TableCell>
                    <TableCell>{versement.numero_echeance}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        {formatMontant(versement.montant)} MGA
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(versement.date_echeance)}</TableCell>
                    <TableCell>{formatDate(versement.date_paiement)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={statut.icon}
                        label={statut.label}
                        color={statut.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="info">
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Détails */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails du Paiement</DialogTitle>
        <DialogContent>
          {selectedPaiement && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">ID</Typography>
                <Typography variant="body1">{selectedPaiement.id}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Étudiant ID</Typography>
                <Typography variant="body1">{selectedPaiement.etudiant}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Montant</Typography>
                <Typography variant="h6" color="primary">
                  {formatMontant(selectedPaiement.montant)} MGA
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Montant Restant</Typography>
                <Typography variant="h6" color="error">
                  {formatMontant(selectedPaiement.montant_restant || 0)} MGA
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Statut</Typography>
                <Chip
                  icon={getStatutStyle(selectedPaiement.statut).icon}
                  label={getStatutStyle(selectedPaiement.statut).label}
                  color={getStatutStyle(selectedPaiement.statut).color}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Mode de Paiement</Typography>
                <Typography variant="body1">{selectedPaiement.mode_paiement || "Non spécifié"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Date Paiement</Typography>
                <Typography variant="body1">{formatDate(selectedPaiement.date_paiement)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Date Confirmation</Typography>
                <Typography variant="body1">{formatDate(selectedPaiement.date_confirmation) || "-"}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedPaiement.notes || "Aucune note"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailModal(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Édition */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le Paiement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montant"
                type="number"
                value={editData.montant}
                onChange={(e) => setEditData({ ...editData, montant: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={editData.statut}
                  onChange={(e) => setEditData({ ...editData, statut: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Mode de Paiement</InputLabel>
                <Select
                  value={editData.mode_paiement}
                  onChange={(e) => setEditData({ ...editData, mode_paiement: e.target.value })}
                  label="Mode de Paiement"
                >
                  {modesPaiement.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      {/* Modal Création */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau Paiement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Étudiant ID"
                value={newPaiementData.etudiant}
                onChange={(e) => setNewPaiementData({ ...newPaiementData, etudiant: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montant"
                type="number"
                value={newPaiementData.montant}
                onChange={(e) => setNewPaiementData({ ...newPaiementData, montant: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Montant Restant"
                type="number"
                value={newPaiementData.montant_restant}
                onChange={(e) => setNewPaiementData({ ...newPaiementData, montant_restant: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={newPaiementData.statut}
                  onChange={(e) => setNewPaiementData({ ...newPaiementData, statut: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel>Mode de Paiement</InputLabel>
                <Select
                  value={newPaiementData.mode_paiement}
                  onChange={(e) => setNewPaiementData({ ...newPaiementData, mode_paiement: e.target.value })}
                  label="Mode de Paiement"
                >
                  {modesPaiement.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newPaiementData.notes}
                onChange={(e) => setNewPaiementData({ ...newPaiementData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateModal(false)}>Annuler</Button>
          <Button variant="contained" onClick={createPaiement}>
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