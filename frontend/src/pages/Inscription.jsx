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
import { etudiantApi, faculteApi, domaineApi, mentionApi } from '../api';

import { FaUpload, FaFileExcel, FaDownload } from "react-icons/fa";
import * as XLSX from 'xlsx';

export default function Inscription() {
  // État pour les données
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [importData, setImportData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [duplicateErrors, setDuplicateErrors] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState(null);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(true);
  const [userInfo, setUserInfo] = useState({
    role: ''
  });
  const [importResults, setImportResults] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  });

  // États pour les données dynamiques
  const [etudiants, setEtudiants] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [filteredMentions, setFilteredMentions] = useState([]);
  const [allDomaines, setAllDomaines] = useState([]);
  const [allMentions, setAllMentions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingFacultes, setLoadingFacultes] = useState(false);
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
  const [validationErrors, setValidationErrors] = useState({});

  // États pour les modales
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // États pour le formulaire
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
    bourse: 0,
    photo: null
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

  // Options pour les niveaux
  const niveaux = [
    "Licence 1", "Licence 2", "Licence 3",
    "Master 1", "Master 2", "Doctorat 1"
  ];

  // Fonction pour montrer les toasts
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fonction de formatage du téléphone SANS espace
  const formatTelephone = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 10);
  };

  // Handler pour le champ téléphone
  const handleTelephoneChange = (e) => {
    const formattedValue = formatTelephone(e.target.value);
    setForm({ ...form, telephone: formattedValue });
  };

  // Fonction de formatage du CIN SANS espace
  const formatCIN = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 12);
  };

  // Handler pour le champ CIN
  const handleCINChange = (e) => {
    const formattedValue = formatCIN(e.target.value);
    setForm({ ...form, cin: formattedValue });
  };

  // Validation
  const validateForm = () => {
    const errors = {};

    // Champs obligatoires
    const requiredFields = [
      'matricule', 'nom', 'prenom', 'date_naissance',
      'telephone', 'cin', 'annee_bacc', 'faculte',
      'domaine', 'mention', 'niveau', 'nationalite',
      'lieu_naissance'
    ];

    requiredFields.forEach(field => {
      if (!form[field]?.trim()) {
        errors[field] = "Ce champ est obligatoire";
      }
    });

    // Validation spécifique du téléphone (10 chiffres minimum)
    const phoneDigits = form.telephone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.telephone = "Le numéro de téléphone doit contenir au moins 10 chiffres";
    }

    // Validation spécifique du CIN (12 chiffres)
    const cinDigits = form.cin.replace(/\D/g, '');
    if (cinDigits.length !== 12) {
      errors.cin = "Le CIN doit contenir exactement 12 chiffres";
    }

    // Validation de l'année de bac
    const currentYear = new Date().getFullYear();
    const year = parseInt(form.annee_bacc);
    if (isNaN(year) || year < 1980 || year > currentYear) {
      errors.annee_bacc = `L'année doit être entre 1980 et ${currentYear}`;
    }

    // Validation de la date de naissance
    if (form.date_naissance) {
      const birthDate = new Date(form.date_naissance);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 60);
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 15);

      if (birthDate < minDate) {
        errors.date_naissance = "L'étudiant doit avoir moins de 60 ans";
      } else if (birthDate > maxDate) {
        errors.date_naissance = "L'étudiant doit avoir au moins 15 ans";
      }
    }

    // Validation de l'email si fourni
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Adresse email invalide";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction pour gérer le téléchargement de photo
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Veuillez sélectionner une image valide', 'warning');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('L\'image ne doit pas dépasser 5MB', 'warning');
        return;
      }

      setForm({ ...form, photo: file });

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour supprimer la photo
  const handleRemovePhoto = () => {
    setForm({ ...form, photo: null });
    setPhotoPreview(null);
  };

  // Charger les facultés depuis l'API
  const fetchFacultes = useCallback(async () => {
    setLoadingFacultes(true);
    try {
      const response = await faculteApi.getFacultes();
      if (response.data && Array.isArray(response.data)) {
        setFacultes(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setFacultes(response.data.results);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des facultés:", err);
      showToast("Erreur lors du chargement des facultés", "danger");
    } finally {
      setLoadingFacultes(false);
    }
  }, []);

  // Charger tous les domaines (sans filtre)
  const fetchAllDomaines = useCallback(async () => {
    try {
      const response = await domaineApi.getDomaines();
      if (response.data && Array.isArray(response.data)) {
        setAllDomaines(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setAllDomaines(response.data.results);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de tous les domaines:", err);
    }
  }, []);

  // Charger tous les mentions (sans filtre)
  const fetchAllMentions = useCallback(async () => {
    try {
      const response = await mentionApi.getMentions();
      if (response.data && Array.isArray(response.data)) {
        setAllMentions(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setAllMentions(response.data.results);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de toutes les mentions:", err);
    }
  }, []);

  // Charger les domaines selon la faculté sélectionnée
  const fetchDomaines = useCallback(async (faculteId) => {
    if (!faculteId) {
      setDomaines([]);
      return;
    }

    try {
      console.log("Chargement des domaines pour faculte:", faculteId);
      const response = await domaineApi.getDomaines({ faculte: faculteId });
      
      if (response.data && Array.isArray(response.data)) {
        setDomaines(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setDomaines(response.data.results);
      } else {
        setDomaines([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des domaines:", err);
      setDomaines([]);
    }
  }, []);

  // Charger les mentions selon le domaine sélectionné
  const fetchMentions = useCallback(async (domaineId) => {
    if (!domaineId) {
      setFilteredMentions([]);
      return;
    }

    try {
      console.log("Chargement des mentions pour domaine:", domaineId);
      const response = await mentionApi.getMentions({ domaine: domaineId });
      
      if (response.data && Array.isArray(response.data)) {
        setFilteredMentions(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setFilteredMentions(response.data.results);
      } else {
        setFilteredMentions([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des mentions:", err);
      setFilteredMentions([]);
    }
  }, []);

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

      const response = await etudiantApi.getEtudiants(params);

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

  // Fonction pour obtenir le nom d'une faculté
  const getFaculteName = (faculteId) => {
    if (!faculteId) return '-';

    if (typeof faculteId === 'object' && faculteId !== null) {
      return faculteId.nom || faculteId.code || '-';
    }

    const faculte = facultes.find(f => f.id == faculteId);
    return faculte ? faculte.nom : `Faculté #${faculteId}`;
  };

  // Fonction pour obtenir le nom d'un domaine
  const getDomaineName = (domaineId) => {
    if (!domaineId) return '-';

    if (typeof domaineId === 'object' && domaineId !== null) {
      return domaineId.nom || domaineId.code || '-';
    }

    let domaine = allDomaines.find(d => d.id == domaineId);
    if (!domaine) {
      domaine = domaines.find(d => d.id == domaineId);
    }

    return domaine ? domaine.nom : `Domaine #${domaineId}`;
  };

  // Fonction pour obtenir le nom d'une mention
  const getMentionName = (mentionId) => {
    if (!mentionId) return '-';

    if (typeof mentionId === 'object' && mentionId !== null) {
      return mentionId.nom || mentionId.code || '-';
    }

    let mention = allMentions.find(m => m.id == mentionId);
    if (!mention) {
      mention = filteredMentions.find(m => m.id == mentionId);
    }

    return mention ? mention.nom : `Mention #${mentionId}`;
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchUserInfo();
    fetchEtudiants();
    fetchStats();
    fetchFacultes();
    fetchAllDomaines();
    fetchAllMentions();
  }, [fetchEtudiants, fetchStats, fetchFacultes, fetchAllDomaines, fetchAllMentions]);

  // Effet pour charger les domaines quand la faculté change dans le formulaire
  useEffect(() => {
    if (form.faculte && showModal) {
      console.log("Form faculte changed:", form.faculte);
      fetchDomaines(form.faculte);
    }
  }, [form.faculte, fetchDomaines, showModal]);

  // Effet pour charger les mentions quand le domaine change dans le formulaire
  useEffect(() => {
    if (form.domaine && showModal) {
      console.log("Form domaine changed:", form.domaine);
      fetchMentions(form.domaine);
    }
  }, [form.domaine, fetchMentions, showModal]);

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

  const isAdmin = () => {
    return userInfo.role === 'administrateur';
  };

  // Gestionnaire de changement de faculté dans le formulaire
  const handleFaculteChange = async (selectedFaculteId) => {
    console.log("Faculté sélectionnée:", selectedFaculteId);
    
    const updatedForm = {
      ...form,
      faculte: selectedFaculteId,
      domaine: "",
      mention: ""
    };

    setForm(updatedForm);
    setFilteredMentions([]);
    
    if (selectedFaculteId) {
      await fetchDomaines(selectedFaculteId);
    }
  };

  // Gestionnaire de changement de domaine dans le formulaire
  const handleDomaineChange = async (selectedDomaineId) => {
    console.log("Domaine sélectionné:", selectedDomaineId);
    
    const updatedForm = {
      ...form,
      domaine: selectedDomaineId,
      mention: ""
    };

    setForm(updatedForm);
    
    if (selectedDomaineId) {
      await fetchMentions(selectedDomaineId);
    }
  };

  // Gestionnaire de changement de mention dans le formulaire
  const handleMentionChange = (selectedMentionId) => {
    console.log("Mention sélectionnée:", selectedMentionId);
    
    setForm({
      ...form,
      mention: selectedMentionId
    });
  };

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
    const ws = XLSX.utils.aoa_to_sheet([
      ['matricule', 'nom', 'prenom', 'date_naissance', 'lieu_naissance', 'telephone', 'email', 'cin', 'annee_bacc', 'code_redoublement', 'boursier', 'faculte', 'domaine', 'niveau', 'nationalite', 'mention', 'nom_pere', 'nom_mere'],
      ['MAT001', 'RAKOTO', 'Jean', '1995-01-15', 'Antananarivo', '0341234567', 'jean.rakoto@email.com', '101123456789', '2013', 'N', 'OUI', '1', '1', 'Licence 1', 'Malagasy', '1', 'RAKOTO Pierre', 'RASOA Marie']
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Etudiants');
    XLSX.writeFile(wb, 'modele_import_etudiants.xlsx');

    showToast('Modèle Excel téléchargé', 'success');
  };

  // Traiter l'importation Excel
  const detectDuplicates = async (etudiantsData) => {
    const duplicates = [];
    const seenMatricules = new Set();
    const seenInscriptions = new Set();

    for (let i = 0; i < etudiantsData.length; i++) {
      const etudiant = etudiantsData[i];

      if (etudiant.matricule) {
        if (seenMatricules.has(etudiant.matricule)) {
          duplicates.push(`⚠️ Ligne ${i + 2}: Matricule en double: "${etudiant.matricule}"`);
        } else {
          seenMatricules.add(etudiant.matricule);
        }
      }

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

          const etudiantsData = [];
          const errors = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            try {
              const etudiant = {};

              headers.forEach((header, colIndex) => {
                const value = row[colIndex]?.toString().trim() || '';

                if (header && value) {
                  if (['faculte', 'domaine', 'mention'].includes(header)) {
                    etudiant[header] = isNaN(value) ? value : parseInt(value);
                  } else {
                    etudiant[header] = value;
                  }
                }
              });

              if (!etudiant.matricule || !etudiant.nom || !etudiant.prenom) {
                throw new Error(`Champs obligatoires manquants (matricule, nom, prenom)`);
              }

              etudiantsData.push(etudiant);

            } catch (rowError) {
              errors.push(`Ligne ${i + 2}: ${rowError.message}`);
            }
          }

          setImportProgress(50);

          const duplicates = await detectDuplicates(etudiantsData);
          const allErrors = [...errors, ...duplicates];

          setImportData({
            etudiantsData,
            total: etudiantsData.length,
            errors: allErrors
          });

          setDuplicateErrors(allErrors);

          if (etudiantsData.length === 0) {
            throw new Error('Aucune donnée valide trouvée dans le fichier');
          }

          if (allErrors.length > 0) {
            setShowConfirmModal(true);
            setImportStatus('idle');
            return;
          }

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
      bourse: 0,
      photo: null
    });
    setPhotoPreview(null);
    setEditId(null);
    setDomaines([]);
    setFilteredMentions([]);
    setShowModal(true);
  };

  // Sauvegarder étudiant avec photo
  const saveEtudiant = async () => {
    // Vérification des champs obligatoires
    if (!form.matricule || !form.nom || !form.prenom || !form.niveau || !form.faculte) {
      showToast('Veuillez remplir tous les champs obligatoires', 'warning');
      return;
    }

    try {
      const formData = new FormData();

      // Ajouter les champs au FormData
      Object.keys(form).forEach(key => {
        if (key === 'photo' && form[key]) {
          if (form[key] instanceof File) {
            formData.append('photo', form[key]);
          }
        } else if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
          // Pour les IDs de relation
          if (['faculte', 'domaine', 'mention'].includes(key)) {
            formData.append(`${key}_id`, form[key]);
          } else {
            formData.append(key, form[key]);
          }
        }
      });

      if (editId) {
        await etudiantApi.updateEtudiantWithPhoto(editId, formData);
        showToast("Étudiant modifié avec succès!", 'success');
      } else {
        await etudiantApi.createEtudiantWithPhoto(formData);
        showToast("Étudiant ajouté avec succès!", 'success');
      }

      setShowModal(false);
      fetchEtudiants();
      fetchStats();

    } catch (err) {
      console.error("Erreur sauvegarde:", err.response?.data || err);
      const errorMsg = err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Erreur lors de la sauvegarde";
      showToast(errorMsg, 'danger');
    }
  };

  // Ouvrir modal d'édition - CORRECTION PRINCIPALE
  const openEditModal = async (etudiant) => {
    console.log("Étudiant pour édition:", etudiant);
    
    // Extraire les IDs des relations
    let faculteId = "";
    let domaineId = "";
    let mentionId = "";

    // Fonction pour extraire l'ID d'une relation
    const extractId = (relation) => {
      if (!relation) return "";
      if (typeof relation === 'object' && relation !== null) {
        return relation.id || relation.toString();
      }
      return relation.toString();
    };

    faculteId = extractId(etudiant.faculte);
    domaineId = extractId(etudiant.domaine);
    mentionId = extractId(etudiant.mention);

    console.log("IDs extraits:", { faculteId, domaineId, mentionId });

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
      faculte: faculteId,
      domaine: domaineId,
      niveau: etudiant.niveau || "Licence 1",
      nationalite: etudiant.nationalite || "Malagasy",
      mention: mentionId,
      nom_pere: etudiant.nom_pere || "",
      nom_mere: etudiant.nom_mere || "",
      bourse: etudiant.bourse || 0,
      photo: etudiant.photo || null
    };

    console.log("Form data pour le formulaire:", formattedEtudiant);

    // Réinitialiser les états
    setDomaines([]);
    setFilteredMentions([]);
    
    // Définir le formulaire
    setForm(formattedEtudiant);
    setEditId(etudiant.id);
    setShowModal(true);

    // Si l'étudiant a une faculté, charger les domaines
    if (faculteId) {
      console.log("Chargement des domaines pour faculté ID:", faculteId);
      await fetchDomaines(faculteId);
      
      // Attendre que les domaines soient chargés
      setTimeout(async () => {
        if (domaineId) {
          console.log("Chargement des mentions pour domaine ID:", domaineId);
          await fetchMentions(domaineId);
          
          // Mettre à jour le form avec les IDs
          setTimeout(() => {
            setForm(prev => ({ 
              ...prev, 
              faculte: faculteId,
              domaine: domaineId,
              mention: mentionId 
            }));
          }, 100);
        }
      }, 300);
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
                      <th>Faculté</th>
                      <th>Domaine</th>
                      <th>Mention</th>
                      <th>Boursier</th>
                      <th>Bourse</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etudiants.length === 0 ? (
                      <tr>
                        <td colSpan="16" className="text-center py-5">
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
                            <small className="text-muted">
                              {getFaculteName(etudiant.faculte)}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {getDomaineName(etudiant.domaine)}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
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
                              <Button
                                variant="outline-success"
                                onClick={() => openEditModal(etudiant)}
                                title="Modifier"
                                size="sm"
                              >
                                <FaEdit />
                              </Button>

                              {isAdmin() && (
                                <Button
                                  variant="outline-danger"
                                  onClick={() => openDeleteModal(etudiant)}
                                  title="Supprimer"
                                  size="sm"
                                >
                                  <FaTrash />
                                </Button>
                              )}

                              {!isAdmin() && (
                                <Button
                                  variant="outline-secondary"
                                  title="Suppression réservée à l'administrateur"
                                  size="sm"
                                  disabled
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
                    isInvalid={!!validationErrors.matricule}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.matricule}
                  </Form.Control.Feedback>
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
                    isInvalid={!!validationErrors.nom}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.nom}
                  </Form.Control.Feedback>
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
                    isInvalid={!!validationErrors.prenom}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.prenom}
                  </Form.Control.Feedback>
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
                    isInvalid={!!validationErrors.lieu_naissance}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.lieu_naissance}
                  </Form.Control.Feedback>
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
                    onChange={handleTelephoneChange}
                    isInvalid={!!validationErrors.telephone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.telephone}
                  </Form.Control.Feedback>
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
                    placeholder="501 011 084 358"
                    value={form.cin}
                    onChange={handleCINChange}
                    isInvalid={!!validationErrors.cin}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.cin}
                  </Form.Control.Feedback>
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

            {/* Section Photo */}
            <h6 className="text-primary mt-4 mb-3">Photo d'identité</h6>
            <div className="row">
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label>Photo de l'étudiant</Form.Label>

                  {/* Prévisualisation de la photo */}
                  {(photoPreview || form.photo) && (
                    <div className="mb-3 text-center">
                      <div className="border rounded p-2 d-inline-block">
                        <img
                          src={photoPreview || (form.photo && typeof form.photo === 'string' ? `${process.env.REACT_APP_API_URL}${form.photo}` : '')}
                          alt="Prévisualisation"
                          style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            objectFit: 'cover'
                          }}
                          className="img-thumbnail"
                        />
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRemovePhoto}
                        >
                          Supprimer la photo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Bouton pour télécharger une photo */}
                  <div className="input-group">
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="form-control"
                      id="photo-upload"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      Choisir une photo
                    </Button>
                  </div>

                  <Form.Text className="text-muted">
                    Formats acceptés : JPG, PNG, GIF (max 5MB). Taille recommandée : 200x200 pixels.
                  </Form.Text>
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
                {/* Champ bourse est géré automatiquement par le backend */}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Faculté *</Form.Label>
                  {loadingFacultes ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      value={form.faculte || ""}
                      onChange={(e) => handleFaculteChange(e.target.value)}
                      required
                    >
                      <option value="">Sélectionner une faculté...</option>
                      {facultes.map((faculte) => (
                        <option key={faculte.id} value={faculte.id}>
                          {faculte.nom} ({faculte.code})
                        </option>
                      ))}
                    </Form.Select>
                  )}
                  <small className="text-muted">
                    Facultés disponibles: {facultes.length}
                  </small>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Domaine</Form.Label>
                  <Form.Select
                    value={form.domaine || ""}
                    onChange={(e) => handleDomaineChange(e.target.value)}
                    disabled={!form.faculte}
                  >
                    <option value="">
                      {form.faculte 
                        ? domaines.length > 0 
                          ? "Sélectionner un domaine..." 
                          : "Chargement..." 
                        : "Veuillez d'abord choisir une faculté"}
                    </option>
                    {domaines.map((domaine) => (
                      <option key={domaine.id} value={domaine.id}>
                        {domaine.nom} ({domaine.code})
                      </option>
                    ))}
                  </Form.Select>
                  <small className="text-muted">
                    Domaines disponibles: {domaines.length}
                  </small>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label>Mention</Form.Label>
                  <Form.Select
                    value={form.mention || ""}
                    onChange={(e) => handleMentionChange(e.target.value)}
                    disabled={!form.domaine}
                  >
                    <option value="">
                      {form.domaine 
                        ? filteredMentions.length > 0 
                          ? "Sélectionner une mention..." 
                          : "Chargement..." 
                        : "Veuillez d'abord choisir un domaine"}
                    </option>
                    {filteredMentions.map((mention) => (
                      <option key={mention.id} value={mention.id}>
                        {mention.nom} ({mention.code})
                      </option>
                    ))}
                  </Form.Select>
                  <small className="text-muted">
                    Mentions disponibles: {filteredMentions.length}
                  </small>
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
                  <strong>Faculté :</strong> {getFaculteName(etudiantToDelete.faculte)}
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
    </div>
  );
}