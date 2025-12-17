// src/components/Inscription.js
import React, { useState, useEffect, useCallback } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaExclamationTriangle } from "react-icons/fa";
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
import ProgressBar from 'react-bootstrap/ProgressBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { etudiantApi } from '../api';

import { FaUpload, FaFileExcel, FaDownload } from "react-icons/fa";
import * as XLSX from 'xlsx';

export default function Inscription() {
  // État pour les données
  // Ajoutez cet état avec vos autres états
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importData, setImportData] = useState(null); // Pour stocker les données d'importation
  const [duplicateErrors, setDuplicateErrors] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState(null);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(true);
  const [importResults, setImportResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  });
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    non_redoublants: 0,
    boursiers: 0,
    total_bourses: 0,
    non_boursiers: 0,
    redoublants: 0,
    par_niveau: []
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // États pour les modales
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // États pour le formulaire avec les nouveaux champs
  const [form, setForm] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    telephone: "",
    email: "",
    cin: "",
    annee_bacc: new Date().getFullYear().toString(),
    code_redoublement: "N",
    boursier: "OUI",
    faculte: "",
    domaine: "",
    niveau: "Licence 1",
    nationalite: "Malagasy",
    mention: "",
    nom_pere: "",
    nom_mere: "",
    bourse: 0 // Ce champ existe déjà dans le modèle
  });

  const [editId, setEditId] = useState(null);
  const [etudiantToDelete, setEtudiantToDelete] = useState(null);

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

  // Options pour les niveaux
  const niveaux = [
    "Licence 1", "Licence 2", "Licence 3",
    "Master 1", "Master 2", "Doctorat 1"
  ];

  // Fonction pour montrer les toasts
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Charger les étudiants
  const fetchEtudiants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      if (filterNiveau) {
        params.niveau = filterNiveau;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log("Fetching étudiants avec params:", params);
      const response = await etudiantApi.getEtudiants(params);

      // Si la réponse contient des résultats
      if (response.data && Array.isArray(response.data.results)) {
        setEtudiants(response.data.results);
        setTotalCount(response.data.count || response.data.results.length);
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      } else if (Array.isArray(response.data)) {
        setEtudiants(response.data);
        setTotalCount(response.data.length);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      } else {
        setEtudiants([]);
        setTotalCount(0);
        setTotalPages(1);
      }

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
        setStats(response.data);
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

  // Ouvrir la modale d'importation
  const openImportModal = () => {
    setShowImportModal(true);
    setImportFile(null);
    setImportProgress(0);
    setImportStatus(null);
    setImportResults({ total: 0, success: 0, failed: 0, errors: [] });
  };

  // Fermer la modale d'importation
  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportProgress(0);
    setImportStatus(null);
    setImportResults({ total: 0, success: 0, failed: 0, errors: [] });
  };

  // Gérer la sélection du fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportFile(file);
      setImportStatus(null);
    } else {
      showToast('Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)', 'warning');
      setImportFile(null);
    }
  };

  // Télécharger un modèle Excel
  const downloadTemplate = () => {
    // Créer un workbook avec les colonnes attendues
    const ws = XLSX.utils.aoa_to_sheet([
      ['matricule', 'nom', 'prenom', 'date_naissance', 'lieu_naissance', 'telephone', 'email', 'cin', 'annee_bacc', 'code_redoublement', 'boursier', 'faculte', 'domaine', 'niveau', 'nationalite', 'mention', 'nom_pere', 'nom_mere'],
      ['MAT001', 'RAKOTO', 'Jean', '1995-01-15', 'Antananarivo', '0341234567', 'jean.rakoto@email.com', '101123456789', '2013', 'N', 'OUI', 'FACULTE DES SCIENCES - TUL', 'Sciences et Technologies', 'Licence 1', 'Malagasy', 'TUL - L - FST - PHYSIQUE ET APPLICATION', 'RAKOTO Pierre', 'RASOA Marie']
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Etudiants');
    XLSX.writeFile(wb, 'modele_import_etudiants.xlsx');

    showToast('Modèle Excel téléchargé', 'success');
  };

  // Traiter l'importation Excel
  // Fonction pour détecter les doublons
  const detectDuplicates = async (etudiantsData) => {
    const duplicates = [];
    const seenMatricules = new Set();
    const seenInscriptions = new Set();

    for (let i = 0; i < etudiantsData.length; i++) {
      const etudiant = etudiantsData[i];

      // Vérifier les doublons de matricule dans le fichier
      if (etudiant.matricule) {
        if (seenMatricules.has(etudiant.matricule)) {
          duplicates.push(`⚠️ Ligne ${i + 2}: Matricule en double: "${etudiant.matricule}"`);
        } else {
          seenMatricules.add(etudiant.matricule);
        }
      }

      // Vérifier les doublons de numéro d'inscription dans le fichier
      if (etudiant.numero_inscription) {
        if (seenInscriptions.has(etudiant.numero_inscription)) {
          duplicates.push(`⚠️ Ligne ${i + 2}: Numéro d'inscription en double: "${etudiant.numero_inscription}"`);
        } else {
          seenInscriptions.add(etudiant.numero_inscription);
        }
      }
    }

    return duplicates;
  };

  // Modifiez votre fonction processImport pour utiliser la modale
  const processImport = async () => {
    if (!importFile) {
      showToast('Veuillez sélectionner un fichier Excel', 'warning');
      return;
    }

    setImportStatus('processing');
    setImportProgress(10);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données');
          }

          const headers = jsonData[0].map(h => h?.toString().toLowerCase().trim());
          const rows = jsonData.slice(1);

          setImportProgress(30);

          // Mapper les données
          const etudiantsData = [];
          const errors = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            try {
              const etudiant = {};

              // Mapper chaque colonne
              headers.forEach((header, colIndex) => {
                const value = row[colIndex]?.toString().trim() || '';

                if (header && value) {
                  etudiant[header] = value;
                }
              });

              // Validation
              if (!etudiant.matricule || !etudiant.nom || !etudiant.prenom) {
                throw new Error(`Champs obligatoires manquants (matricule, nom, prenom)`);
              }

              etudiantsData.push(etudiant);

            } catch (rowError) {
              errors.push(`Ligne ${i + 2}: ${rowError.message}`);
            }
          }

          setImportProgress(50);

          // Détecter les doublons
          const duplicates = await detectDuplicates(etudiantsData);
          const allErrors = [...errors, ...duplicates];

          // Stocker les données pour la modale de confirmation
          setImportData({
            etudiantsData,
            total: etudiantsData.length,
            errors: allErrors
          });

          setDuplicateErrors(allErrors);

          if (etudiantsData.length === 0) {
            throw new Error('Aucune donnée valide trouvée dans le fichier');
          }

          // Si des doublons sont détectés, afficher la modale de confirmation
          if (allErrors.length > 0) {
            setShowConfirmModal(true);
            setImportStatus('idle');
            return;
          }

          // Sinon, continuer directement avec l'importation
          proceedWithImport(etudiantsData, allErrors);

        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error);
          setImportStatus('error');
          showToast(`Erreur lors de l'importation: ${error.message}`, 'danger');
        }
      };

      reader.readAsArrayBuffer(importFile);

    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setImportStatus('error');
      showToast(`Erreur lors de l'importation: ${error.message}`, 'danger');
    }
  };

  // Fonction pour procéder à l'importation
  const proceedWithImport = async (etudiantsData, errors) => {
    setImportStatus('processing');
    setImportProgress(70);

    try {
      const response = await etudiantApi.bulkImport(etudiantsData);

      setImportProgress(100);
      setImportStatus('success');

      const results = response.data;
      setImportResults({
        total: results.total,
        success: results.success,
        failed: results.failed,
        errors: results.errors || errors
      });

      showToast(`Importation terminée: ${results.success} succès, ${results.failed} échecs`, 'success');

      // Rafraîchir les données
      fetchEtudiants();
      fetchStats();

    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setImportStatus('error');
      setImportResults(prev => ({
        ...prev,
        errors: [...prev.errors, error.message]
      }));
      showToast(`Erreur lors de l'importation: ${error.message}`, 'danger');
    }
  };

  // Ouvrir modal d'ajout
  const openAddModal = () => {
    setForm({
      matricule: "",
      nom: "",
      prenom: "",
      date_naissance: "",
      lieu_naissance: "",
      telephone: "",
      email: "",
      cin: "",
      annee_bacc: new Date().getFullYear().toString(),
      code_redoublement: "N",
      boursier: "OUI",
      faculte: "",
      domaine: "",
      niveau: "Licence 1",
      nationalite: "Malagasy",
      mention: "",
      nom_pere: "",
      nom_mere: "",
      bourse: 0
    });
    setEditId(null);
    setShowModal(true);
  };

  // Ouvrir modal d'édition
  const openEditModal = (etudiant) => {
    const formattedEtudiant = {
      matricule: etudiant.matricule || "",
      nom: etudiant.nom || "",
      prenom: etudiant.prenom || "",
      date_naissance: etudiant.date_naissance ?
        etudiant.date_naissance.split('T')[0] : "",
      lieu_naissance: etudiant.lieu_naissance || "",
      telephone: etudiant.telephone || "",
      email: etudiant.email || "",
      cin: etudiant.cin || "",
      annee_bacc: etudiant.annee_bacc ? etudiant.annee_bacc.toString() : "",
      code_redoublement: etudiant.code_redoublement || "N",
      boursier: etudiant.boursier || "OUI",
      faculte: etudiant.faculte || "",
      domaine: etudiant.domaine || "",
      niveau: etudiant.niveau || "Licence 1",
      nationalite: etudiant.nationalite || "Malagasy",
      mention: etudiant.mention || "",
      nom_pere: etudiant.nom_pere || "",
      nom_mere: etudiant.nom_mere || "",
      bourse: etudiant.bourse || 0
    };

    setForm(formattedEtudiant);
    setEditId(etudiant.id);
    setShowModal(true);
  };

  // Sauvegarder étudiant
  const saveEtudiant = async () => {
    // Validation
    const requiredFields = ['matricule', 'nom', 'prenom', 'niveau', 'faculte'];
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

      if (editId) {
        await etudiantApi.updateEtudiant(editId, dataToSend);
        showToast("Étudiant modifié avec succès!", 'success');
      } else {
        await etudiantApi.createEtudiant(dataToSend);
        showToast("Étudiant ajouté avec succès!", 'success');
      }

      setShowModal(false);
      fetchEtudiants();
      fetchStats();

    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de la sauvegarde";
      showToast(errorMsg, 'danger');
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
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
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
          <h1 className="text-primary">Inscription des Étudiants</h1>
          <p className="text-muted">
            Gestion des inscriptions (code redoublement = "N" - Non redoublant)
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card border-primary">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total inscriptions</h6>
              <h3 className="card-title text-primary">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-success">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Non redoublants (N)</h6>
              <h3 className="card-title text-success">{stats.non_redoublants}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Étudiants boursiers</h6>
              <h3 className="card-title text-warning">{stats.boursiers}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-info">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Montant total bourses</h6>
              <h3 className="card-title text-info">{stats.total_bourses?.toLocaleString()} MGA</h3>
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
                    <Badge bg="success" className="me-2">N = Non redoublant</Badge>
                    <Badge bg="danger">R = Redoublant</Badge>
                    <Badge bg="warning" className="ms-2">T = Triplant</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <Button
                variant="success"
                onClick={openImportModal}
                className="d-inline-flex align-items-center me-2"
              >
                <FaUpload className="me-2" /> Importer Excel
              </Button>
              <Button
                variant="primary"
                onClick={openAddModal}
                className="d-inline-flex align-items-center"
              >
                <FaPlus className="me-2" /> Nouvelle inscription
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
                      <th>Lieu Naiss.</th>
                      <th>Téléphone</th>
                      <th>Email</th>
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
                        <td colSpan="14" className="text-center py-5">
                          <FaSearch className="text-muted mb-3" size={48} />
                          <p className="text-muted">Aucun étudiant trouvé</p>
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
                            <small className="text-muted" hidden>
                              {etudiant.nom_pere && <div>Père: {etudiant.nom_pere}</div>}
                              {etudiant.nom_mere && <div>Mère: {etudiant.nom_mere}</div>}
                            </small>
                          </td>
                          <td className="font-monospace">
                            {formatDate(etudiant.date_naissance)}
                          </td>
                          <td>
                            <small className="text-muted">{etudiant.lieu_naissance || '-'}</small>
                          </td>
                          <td className="font-monospace">{etudiant.telephone || '-'}</td>
                          <td>
                            {etudiant.email ? (
                              <a href={`mailto:${etudiant.email}`} className="text-primary">
                                <small>{etudiant.email}</small>
                              </a>
                            ) : '-'}
                          </td>
                          <td className="font-monospace">{etudiant.cin || '-'}</td>
                          <td>
                            <Badge
                              bg={etudiant.code_redoublement === 'N' ? 'success' :
                                etudiant.code_redoublement === 'R' ? 'danger' : 'warning'}
                              className="font-monospace"
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
                            <small className="text-muted font-monospace text-wrap" style={{ wordBreak: "break-word" }}>
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

      {/* Modal Ajout/Modification avec les nouveaux champs */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className={editId ? "bg-warning text-dark" : "bg-primary text-white"}>
          <Modal.Title>
            {editId ? "Modifier l'inscription" : "Nouvelle inscription"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Informations de base */}
            <h6 className="text-primary mb-3">Informations personnelles</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Matricule *</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.matricule}
                    onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Niveau *</Form.Label>
                  <Form.Select
                    value={form.niveau}
                    onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                    required
                  >
                    {niveaux.map((niv, index) => (
                      <option key={index} value={niv}>{niv}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom *</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Prénom *</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date de naissance</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Lieu de naissance</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.lieu_naissance}
                    onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })}
                    placeholder="Ex: Antananarivo, Madagascar"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Téléphone</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="exemple@email.com"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Numéro CIN</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.cin}
                    onChange={(e) => setForm({ ...form, cin: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Année du Bac</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.annee_bacc}
                    onChange={(e) => setForm({ ...form, annee_bacc: e.target.value })}
                    placeholder="Ex: 2020"
                  />
                </Form.Group>
              </div>
            </div>

            {/* Informations des parents */}
            <h6 className="text-primary mt-4 mb-3">Informations des parents</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom du père</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.nom_pere}
                    onChange={(e) => setForm({ ...form, nom_pere: e.target.value })}
                    placeholder="Nom complet du père"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom de la mère</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.nom_mere}
                    onChange={(e) => setForm({ ...form, nom_mere: e.target.value })}
                    placeholder="Nom complet de la mère"
                  />
                </Form.Group>
              </div>
            </div>

            {/* Informations académiques */}
            <h6 className="text-primary mt-4 mb-3">Informations académiques</h6>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Code redoublement *</Form.Label>
                  <Form.Select
                    value={form.code_redoublement}
                    onChange={(e) => setForm({ ...form, code_redoublement: e.target.value })}
                  >
                    <option value="N">N - Non redoublant (Inscription)</option>
                    <option value="R">R - Redoublant (Réinscription)</option>
                    <option value="T">T - Triplant</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Boursier</Form.Label>
                  <Form.Select
                    value={form.boursier}
                    onChange={(e) => setForm({ ...form, boursier: e.target.value })}
                  >
                    <option value="OUI">OUI</option>
                    <option value="NON">NON</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nationalité</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.nationalite}
                    onChange={(e) => setForm({ ...form, nationalite: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                {/* Champ bourse est géré automatiquement par le backend avec default=0 */}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Faculté *</Form.Label>
                  <Form.Select
                    value={form.faculte}
                    onChange={(e) => handleFaculteChange(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {facultes.map((fac, index) => (
                      <option key={index} value={fac}>{fac}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Domaine</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.domaine}
                    readOnly
                    className="bg-light"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label>Mention</Form.Label>
                  <Form.Select
                    value={form.mention}
                    onChange={(e) => setForm({ ...form, mention: e.target.value })}
                    disabled={!form.faculte}
                  >
                    <option value="">{form.faculte ? "Sélectionner une mention" : "Veuillez d'abord choisir une faculté"}</option>
                    {getMentionsForFaculte(form.faculte).map((mention, index) => (
                      <option key={index} value={mention}>{mention}</option>
                    ))}
                  </Form.Select>
                  {!form.faculte && (
                    <Form.Text className="text-warning">
                      Vous devez d'abord sélectionner une faculté pour voir les mentions disponibles.
                    </Form.Text>
                  )}
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button
            variant={editId ? "warning" : "primary"}
            onClick={saveEtudiant}
            disabled={!form.matricule || !form.nom || !form.prenom || !form.niveau || !form.faculte}
          >
            {editId ? "Modifier" : "Enregistrer"}
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
              <Alert variant="danger">
                <Alert.Heading>⚠️ Attention !</Alert.Heading>
                <p>Cette action supprimera définitivement l'inscription et toutes les données associées.</p>
              </Alert>

              <div className="p-3 bg-light rounded">
                <h5 className="mb-2">{etudiantToDelete.nom} {etudiantToDelete.prenom}</h5>
                <p className="mb-1">
                  <strong>Numéro d'inscription :</strong> {etudiantToDelete.numero_inscription || '-'}
                </p>
                <p className="mb-1">
                  <strong>Matricule :</strong> {etudiantToDelete.matricule}
                </p>
                <p className="mb-1">
                  <strong>Niveau :</strong> {etudiantToDelete.niveau}
                </p>
                <p className="mb-1">
                  <strong>Faculté :</strong> {etudiantToDelete.faculte}
                </p>
              </div>

              <p className="mt-3 text-muted">
                Voulez-vous vraiment supprimer cette inscription ?
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

      {/* Modal d'importation Excel */}
      <Modal show={showImportModal} onHide={closeImportModal} size="lg" centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <FaFileExcel className="me-2" />
            Importer des étudiants depuis Excel
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6>Instructions d'importation :</h6>
            <ul className="text-muted small">
              <li>Le fichier doit être au format Excel (.xlsx ou .xls)</li>
              <li>La première ligne doit contenir les en-têtes des colonnes</li>
              <li>Les colonnes obligatoires sont : matricule, nom, prenom</li>
              <li>Les dates doivent être au format YYYY-MM-DD</li>
              <li>Téléchargez le modèle pour voir le format attendu</li>
            </ul>
            <Button
              variant="outline-info"
              size="sm"
              onClick={downloadTemplate}
              className="d-inline-flex align-items-center"
            >
              <FaDownload className="me-2" />
              Télécharger le modèle Excel
            </Button>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Sélectionner le fichier Excel</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importStatus === 'processing'}
            />
            {importFile && (
              <Form.Text className="text-success">
                Fichier sélectionné : {importFile.name}
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Ignorer les doublons (mettre à jour les étudiants existants)"
              checked={ignoreDuplicates}
              onChange={(e) => setIgnoreDuplicates(e.target.checked)}
            />
            <Form.Text className="text-muted">
              Si coché, les étudiants existants seront mis à jour au lieu de créer des doublons
            </Form.Text>
          </Form.Group>

          {importStatus === 'processing' && (
            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                <span className="me-2">Traitement en cours...</span>
                <span className="text-muted">({importProgress}%)</span>
              </div>
              <ProgressBar now={importProgress} animated />
            </div>
          )}

          {importResults.total > 0 && (
            <div className="mb-3">
              <h6>Résultats de l'importation :</h6>
              <div className="row text-center">
                <div className="col-md-4">
                  <div className="p-2 bg-light rounded">
                    <div className="h5 text-primary">{importResults.total}</div>
                    <small className="text-muted">Total</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-2 bg-success rounded text-white">
                    <div className="h5">{importResults.success}</div>
                    <small>Succès</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-2 bg-danger rounded text-white">
                    <div className="h5">{importResults.failed}</div>
                    <small>Échecs</small>
                  </div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-danger">Erreurs rencontrées :</h6>
                  <div className="bg-light p-2 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-danger small">
                        - {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {importStatus === 'error' && (
            <Alert variant="danger">
              <Alert.Heading>Erreur lors de l'importation</Alert.Heading>
              <p>Une erreur s'est produite pendant le traitement du fichier. Vérifiez le format et réessayez.</p>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeImportModal}>
            Fermer
          </Button>
          <Button
            variant="success"
            onClick={processImport}
            disabled={!importFile || importStatus === 'processing'}
          >
            {importStatus === 'processing' ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Importation en cours...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Importer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation pour les doublons */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Doublons détectés
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <Alert.Heading>⚠️ Attention !</Alert.Heading>
            <p>
              <strong>{duplicateErrors.length} erreur(s)</strong> détectée(s) dans le fichier.
              Certaines lignes peuvent contenir des doublons.
            </p>
            <p className="mb-0">
              En continuant, l'importation risque d'échouer à cause des contraintes d'unicité.
            </p>
          </Alert>

          {duplicateErrors.length > 0 && (
            <div className="mb-3">
              <h6 className="text-danger">Détails des erreurs :</h6>
              <div className="bg-light p-2 rounded" style={{
                maxHeight: '200px',
                overflowY: 'auto',
                fontSize: '0.875rem'
              }}>
                {duplicateErrors.map((error, index) => (
                  <div key={index} className="text-danger mb-1">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-light p-3 rounded">
            <h6>Que voulez-vous faire ?</h6>
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="radio"
                id="optionCancel"
                name="importOption"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="optionCancel">
                <strong>Annuler l'importation</strong>
                <div className="text-muted small">
                  Corrigez le fichier Excel et réessayez
                </div>
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                id="optionContinue"
                name="importOption"
              />
              <label className="form-check-label" htmlFor="optionContinue">
                <strong>Continuer malgré les doublons</strong>
                <div className="text-muted small">
                  L'importation pourrait échouer partiellement
                </div>
              </label>
            </div>
          </div>

          <div className="mt-3">
            <small className="text-muted">
              Total des étudiants valides : {importData?.total || 0}
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowConfirmModal(false);
              setImportStatus('idle');
            }}
          >
            Annuler l'importation
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setShowConfirmModal(false);
              if (importData) {
                proceedWithImport(importData.etudiantsData, importData.errors);
              }
            }}
          >
            <FaExclamationTriangle className="me-2" />
            Continuer malgré les erreurs
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}