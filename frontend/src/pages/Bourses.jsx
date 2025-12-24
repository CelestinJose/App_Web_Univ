import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaCheck, FaFileExport, FaEye, FaEdit, FaMoneyBillWave, FaExclamationTriangle, FaFilePdf } from "react-icons/fa";
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
import 'bootstrap/dist/css/bootstrap.min.css';
import api, { etudiantApi, bourseApi } from '../api';

// Import pour le PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Bourses() {
  // État pour les données
  const [etudiants, setEtudiants] = useState([]);
  const [bourses, setBourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les toasts (notifications)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterBoursier, setFilterBoursier] = useState("");

  // États pour les modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditBourseModal, setShowEditBourseModal] = useState(false);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // États pour les données modales
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [selectedBourse, setSelectedBourse] = useState(null);
  const [editBourseData, setEditBourseData] = useState({
    montant: "",
    status: "EN_ATTENTE",
    date_debut: "",
    date_fin: "",
    annee_academique: "",
    conditions: ""
  });

  const [newAttribution, setNewAttribution] = useState({
    etudiant: "",
    montant: "",
    status: "EN_ATTENTE",
    date_debut: "",
    date_fin: "",
    annee_academique: "",
    conditions: ""
  });

  // Référence pour le contenu PDF
  const pdfRef = useRef(null);

  // Statuts de bourse (selon votre modèle Django)
  const statutsBourse = [
    { value: "EN_ATTENTE", label: "En attente", color: "warning" },
    { value: "ACCEPTEE", label: "Acceptée", color: "info" },
    { value: "REJETEE", label: "Rejetée", color: "danger" },
    // { value: "SUSPENDUE", label: "Suspendue", color: "secondary" }
  ];

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Chargement des données...");

      // Charger les étudiants depuis l'API
      const etudiantsResponse = await etudiantApi.getEtudiants();
      const etudiantsData = etudiantsResponse.data;
      console.log("Étudiants chargés:", etudiantsData.length);

      // Charger les bourses depuis l'API - CORRIGÉ
      const boursesResponse = await bourseApi.getBourses();
      const boursesData = boursesResponse.data;
      console.log("Bourses chargées:", boursesData.length);

      setEtudiants(Array.isArray(etudiantsData) ? etudiantsData : []);
      setBourses(Array.isArray(boursesData) ? boursesData : []);

    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      setError(`Impossible de charger les données: ${error.message}`);

      // Initialiser avec des tableaux vides
      setEtudiants([]);
      setBourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour déboguer les données envoyées
  const debugData = (data, action) => {
    console.log(`DEBUG ${action}:`, JSON.stringify(data, null, 2));
    console.log("Types de données:", {
      montant: typeof data.montant,
      etudiant: typeof data.etudiant,
      date_debut: typeof data.date_debut,
      date_fin: typeof data.date_fin
    });
  };

  // Trouver la bourse d'un étudiant
  const findBourseForEtudiant = (etudiantId) => {
    return bourses.find(b => {
      // Vérifier si b.etudiant est un objet avec id, ou directement l'ID
      if (typeof b.etudiant === 'object' && b.etudiant !== null) {
        return b.etudiant.id === etudiantId;
      }
      return b.etudiant === etudiantId;
    });
  };

  // Formater le nom complet
  const getFullName = (etudiant) => {
    if (!etudiant) return "";
    return `${etudiant.nom || ""} ${etudiant.prenom || ""}`.trim();
  };

  // Obtenir le statut de bourse avec style
  const getBourseStatus = (etudiant) => {
    if (etudiant.boursier === 'NON') {
      return { label: "Non boursier", color: "secondary" };
    }

    const bourse = findBourseForEtudiant(etudiant.id);
    if (!bourse) {
      return { label: "Sans bourse", color: "warning" };
    }

    const statut = statutsBourse.find(s => s.value === bourse.status);
    return statut || { label: bourse.status || "Inconnu", color: "secondary" };
  };

  // Obtenir les informations de bourse complètes
  const getBourseInfo = (etudiant) => {
    const bourse = findBourseForEtudiant(etudiant.id);
    if (!bourse) return null;

    return {
      montant: bourse.montant,
      status: bourse.status,
      date_debut: bourse.date_debut,
      date_fin: bourse.date_fin,
      annee_academique: bourse.annee_academique,
      conditions: bourse.conditions,
      date_demande: bourse.date_demande,
      date_decision: bourse.date_decision
    };
  };

  // Filtrer les étudiants
  const filteredEtudiants = etudiants.filter(etudiant => {
    const fullName = getFullName(etudiant).toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (etudiant.matricule && etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etudiant.numero_inscription && etudiant.numero_inscription.toLowerCase().includes(searchTerm.toLowerCase()));

    const bourseStatus = getBourseStatus(etudiant);
    const matchesStatut = filterStatut ? bourseStatus.label === filterStatut : true;
    const matchesNiveau = filterNiveau ? etudiant.niveau === filterNiveau : true;
    const matchesBoursier = filterBoursier ? etudiant.boursier === filterBoursier : true;

    return matchesSearch && matchesStatut && matchesNiveau && matchesBoursier;
  });

  // Niveaux disponibles pour filtre
  const niveaux = [...new Set(etudiants.map(e => e.niveau).filter(Boolean))];

  // Statuts disponibles pour filtre
  const statutsDisponibles = [...new Set(etudiants.map(e => getBourseStatus(e).label))];

  // Calculer les statistiques
  const stats = {
    total: etudiants.length,
    boursiers: etudiants.filter(e => e.boursier === "OUI").length,
    nonBoursiers: etudiants.filter(e => e.boursier === "NON").length,
    montantTotal: bourses.reduce((sum, b) => sum + parseFloat(b.montant || 0), 0),
    enAttente: bourses.filter(b => b.status === "EN_ATTENTE").length,
    acceptees: bourses.filter(b => b.status === "ACCEPTEE").length,
    rejetees: bourses.filter(b => b.status === "REJETEE").length,
    suspendues: bourses.filter(b => b.status === "SUSPENDUE").length
  };

  // Générer un rapport PDF des statistiques de bourses
  const generatePDF = async () => {
    try {
      setToastMessage("Génération du PDF en cours...");
      setToastVariant("info");
      setShowToast(true);

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');
      const currentTime = new Date().toLocaleTimeString('fr-FR');

      // Titre principal
      pdf.setFontSize(20);
      pdf.setTextColor(0, 51, 102); // Bleu foncé
      pdf.text('Rapport des Bourses', 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Université - Service des Bourses`, 105, 28, { align: 'center' });
      pdf.text(`Généré le ${currentDate} à ${currentTime}`, 105, 34, { align: 'center' });

      // Ligne séparatrice
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(0.5);
      pdf.line(20, 40, 190, 40);

      // Section Statistiques Générales
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('I. Statistiques Générales', 20, 50);

      pdf.setFontSize(10);
      let yPosition = 60;

      // Tableau des statistiques
      const statsData = [
        ['Total étudiants', stats.total.toString()],
        ['Étudiants boursiers', `${stats.boursiers} (${(stats.boursiers / stats.total * 100).toFixed(1)}%)`],
        ['Étudiants non boursiers', `${stats.nonBoursiers} (${(stats.nonBoursiers / stats.total * 100).toFixed(1)}%)`],
        ['Montant total des bourses', `${formatMontant(stats.montantTotal)} MGA`],
        ['Bourses en attente', stats.enAttente.toString()],
        ['Bourses acceptées', stats.acceptees.toString()],
        ['Bourses rejetées', stats.rejetees.toString()],
        ['Bourses suspendues', stats.suspendues.toString()]
      ];

      // Dessiner le tableau des statistiques
      pdf.setLineWidth(0.2);
      pdf.setDrawColor(200, 200, 200);

      statsData.forEach((row, index) => {
        pdf.setFillColor(index % 2 === 0 ? 245 : 255);
        pdf.rect(20, yPosition - 5, 170, 8, 'F');

        pdf.setTextColor(0, 0, 0);
        pdf.text(row[0], 25, yPosition);

        pdf.setTextColor(0, 51, 102);
        pdf.text(row[1], 150, yPosition);

        yPosition += 10;
      });

      yPosition += 10;

      // Section Répartition par Statut
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('II. Répartition par Statut de Bourse', 20, yPosition);
      yPosition += 15;

      // Diagramme simple de répartition
      const totalBourses = stats.enAttente + stats.acceptees + stats.rejetees + stats.suspendues;

      if (totalBourses > 0) {
        const statutsData = [
          { label: 'En attente', count: stats.enAttente, color: [255, 193, 7] }, // Jaune
          { label: 'Acceptées', count: stats.acceptees, color: [13, 110, 253] }, // Bleu
          { label: 'Rejetées', count: stats.rejetees, color: [220, 53, 69] }, // Rouge
          { label: 'Suspendues', count: stats.suspendues, color: [108, 117, 125] } // Gris
        ];

        statutsData.forEach((statut, index) => {
          const percentage = (statut.count / totalBourses * 100).toFixed(1);
          const barWidth = (statut.count / totalBourses) * 100;

          // Légende couleur
          pdf.setFillColor(statut.color[0], statut.color[1], statut.color[2]);
          pdf.rect(25, yPosition - 3, 5, 5, 'F');

          // Texte
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${statut.label}: ${statut.count} (${percentage}%)`, 35, yPosition);

          // Barre de progression
          pdf.setDrawColor(statut.color[0], statut.color[1], statut.color[2]);
          pdf.setFillColor(statut.color[0], statut.color[1], statut.color[2]);
          pdf.rect(100, yPosition - 3, barWidth * 0.8, 5, 'FD');

          yPosition += 10;
        });
      }

      yPosition += 10;

      // Section Liste des Boursiers
      if (filteredEtudiants.length > 0) {
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text('III. Liste des Boursiers', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Filtrée sur ${filteredEtudiants.length} étudiant(s)`, 20, yPosition);
        yPosition += 15;

        // En-têtes du tableau
        pdf.setFillColor(0, 51, 102);
        pdf.rect(20, yPosition - 5, 170, 8, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.text('Étudiant', 25, yPosition);
        pdf.text('Niveau', 80, yPosition);
        pdf.text('Montant', 120, yPosition);
        pdf.text('Statut', 150, yPosition);

        yPosition += 10;

        // Données des étudiants
        pdf.setFontSize(9);
        let rowCount = 0;

        for (let i = 0; i < Math.min(filteredEtudiants.length, 20); i++) {
          const etudiant = filteredEtudiants[i];
          const bourse = findBourseForEtudiant(etudiant.id);

          if (etudiant.boursier === 'OUI') {
            rowCount++;

            pdf.setFillColor(rowCount % 2 === 0 ? 245 : 255);
            pdf.rect(20, yPosition - 5, 170, 8, 'F');

            pdf.setTextColor(0, 0, 0);
            pdf.text(getFullName(etudiant).substring(0, 30), 25, yPosition);
            pdf.text(etudiant.niveau || '-', 80, yPosition);
            pdf.text(bourse ? formatMontant(bourse.montant) + ' MGA' : '-', 120, yPosition);

            // Couleur du statut
            const statut = getBourseStatus(etudiant);
            pdf.setTextColor(0, 51, 102);
            pdf.text(statut.label, 150, yPosition);

            yPosition += 10;

            // Vérifier si on dépasse la page
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          }
        }

        if (filteredEtudiants.length > 20) {
          pdf.setTextColor(100, 100, 100);
          pdf.text(`... et ${filteredEtudiants.length - 20} autres étudiants`, 20, yPosition + 5);
        }
      }

      // Pied de page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i}/${pageCount}`, 105, 287, { align: 'center' });
        pdf.text('Service des Bourses - Université', 105, 292, { align: 'center' });
      }

      // Sauvegarder le PDF
      pdf.save(`rapport_bourses_${currentDate.replace(/\//g, '-')}.pdf`);

      setToastMessage("PDF généré avec succès !");
      setToastVariant("success");
      setShowToast(true);

    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      setToastMessage("Erreur lors de la génération du PDF");
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  // Générer un PDF détaillé pour un étudiant spécifique
  const generateStudentPDF = async (etudiant) => {
    try {
      const bourse = findBourseForEtudiant(etudiant.id);
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString('fr-FR');

      // Titre
      pdf.setFontSize(18);
      pdf.setTextColor(0, 51, 102);
      pdf.text('FICHE BOURSE ÉTUDIANT', 105, 20, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Étudiant: ${getFullName(etudiant)}`, 105, 30, { align: 'center' });
      pdf.text(`Généré le ${currentDate}`, 105, 36, { align: 'center' });

      // Ligne séparatrice
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(0.5);
      pdf.line(20, 45, 190, 45);

      let yPosition = 55;

      // Informations étudiant
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMATIONS ÉTUDIANT', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      const studentInfo = [
        ['Numéro d\'inscription', etudiant.numero_inscription || '-'],
        ['Matricule', etudiant.matricule || '-'],
        ['Nom complet', getFullName(etudiant)],
        ['Niveau', etudiant.niveau || '-'],
        ['Faculté', etudiant.faculte || '-'],
        ['Domaine', etudiant.domaine || '-'],
        ['Code redoublement', etudiant.code_redoublement || '-'],
        ['Statut boursier', etudiant.boursier === 'OUI' ? 'BOURSIER' : 'NON BOURSIER']
      ];

      studentInfo.forEach((info, index) => {
        pdf.setFillColor(index % 2 === 0 ? 245 : 255);
        pdf.rect(20, yPosition - 5, 170, 8, 'F');

        pdf.setTextColor(0, 0, 0);
        pdf.text(info[0], 25, yPosition);

        pdf.setTextColor(0, 51, 102);
        pdf.text(info[1], 100, yPosition);

        yPosition += 10;
      });

      yPosition += 10;

      // Informations bourse
      if (bourse) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('INFORMATIONS BOURSE', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        const bourseInfo = [
          ['Montant attribué', `${formatMontant(bourse.montant)} MGA`],
          ['Statut', bourse.status],
          ['Date début', formatDate(bourse.date_debut)],
          ['Date fin', formatDate(bourse.date_fin)],
          ['Année académique', bourse.annee_academique || '-'],
          ['Date demande', formatDate(bourse.date_demande)],
          ['Date décision', formatDate(bourse.date_decision) || '-']
        ];

        bourseInfo.forEach((info, index) => {
          pdf.setFillColor(index % 2 === 0 ? 245 : 255);
          pdf.rect(20, yPosition - 5, 170, 8, 'F');

          pdf.setTextColor(0, 0, 0);
          pdf.text(info[0], 25, yPosition);

          pdf.setTextColor(0, 51, 102);
          pdf.text(info[1], 100, yPosition);

          yPosition += 10;
        });

        // Conditions
        if (bourse.conditions) {
          yPosition += 5;
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Conditions spéciales:', 20, yPosition);
          yPosition += 8;

          pdf.setFontSize(9);
          pdf.setTextColor(80, 80, 80);

          // Gestion du texte multiligne
          const conditions = pdf.splitTextToSize(bourse.conditions, 160);
          conditions.forEach(line => {
            pdf.text(line, 25, yPosition);
            yPosition += 6;
          });
        }
      } else {
        pdf.setFontSize(12);
        pdf.setTextColor(220, 53, 69);
        pdf.text('AUCUNE BOURSE ATTRIBUÉE', 105, yPosition, { align: 'center' });
      }

      // Pied de page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Service des Bourses - Université', 105, 287, { align: 'center' });
      pdf.text('Document officiel', 105, 292, { align: 'center' });

      pdf.save(`bourse_${etudiant.numero_inscription || etudiant.matricule}_${currentDate.replace(/\//g, '-')}.pdf`);

      setToastMessage("Fiche étudiant générée !");
      setToastVariant("success");
      setShowToast(true);

    } catch (error) {
      console.error("Erreur lors de la génération de la fiche étudiant:", error);
      setToastMessage("Erreur lors de la génération du PDF");
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  // Ouvrir modal de détail
  const openDetailModal = (etudiant) => {
    setSelectedEtudiant(etudiant);
    const bourse = findBourseForEtudiant(etudiant.id);
    setSelectedBourse(bourse);
    setShowDetailModal(true);
  };

  // Ouvrir modal d'édition de bourse
  const openEditBourseModal = (etudiant) => {
    setSelectedEtudiant(etudiant);
    const bourse = findBourseForEtudiant(etudiant.id);
    setSelectedBourse(bourse);

    if (bourse) {
      setEditBourseData({
        montant: bourse.montant || "",
        status: bourse.status || "EN_ATTENTE",
        date_debut: bourse.date_debut ? bourse.date_debut.split('T')[0] : "",
        date_fin: bourse.date_fin ? bourse.date_fin.split('T')[0] : "",
        annee_academique: bourse.annee_academique || "",
        conditions: bourse.conditions || ""
      });
    } else {
      // Créer des données par défaut
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

      setEditBourseData({
        montant: etudiant.bourse || "",
        status: "EN_ATTENTE",
        date_debut: today,
        date_fin: nextYear,
        annee_academique: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        conditions: "Bourse attribuée via le système"
      });
    }

    setShowEditBourseModal(true);
  };

  // Ouvrir modal d'attribution
  const openAttributionModal = (etudiant) => {
    setSelectedEtudiant(etudiant);

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

    setNewAttribution({
      etudiant: etudiant.id,
      montant: etudiant.bourse || "",
      status: "EN_ATTENTE",
      date_debut: today,
      date_fin: nextYear,
      annee_academique: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      conditions: "Bourse attribuée via le système"
    });

    setShowAttributionModal(true);
  };

  // Sauvegarder les modifications de bourse - CORRIGÉ
  const saveBourseModifications = async () => {
    try {
      // Préparer les données correctement formatées
      const bourseData = {
        montant: parseFloat(editBourseData.montant) || 0,
        status: editBourseData.status,
        date_debut: editBourseData.date_debut,
        date_fin: editBourseData.date_fin,
        annee_academique: editBourseData.annee_academique,
        conditions: editBourseData.conditions || "",
        etudiant: selectedEtudiant.id
      };

      debugData(bourseData, selectedBourse ? "UPDATE" : "CREATE");

      let response;
      if (selectedBourse) {
        // Mettre à jour une bourse existante - CORRIGÉ
        response = await bourseApi.updateBourse(selectedBourse.id, bourseData);
        console.log("Bourse mise à jour:", response.data);

        // Mettre à jour le statut boursier si la bourse est rejetée
        if (editBourseData.status === "REJETEE") {
          try {
            // Récupérer d'abord les données complètes de l'étudiant
            const etudiantResponse = await etudiantApi.getEtudiant(selectedEtudiant.id);
            const etudiantData = etudiantResponse.data;

            // Préparer les données de mise à jour avec TOUS les champs requis
            const etudiantUpdateData = {
              ...etudiantData, // Inclure toutes les données existantes
              boursier: 'NON',
              bourse: 0
            };

            console.log("Mise à jour étudiant après rejet:", etudiantUpdateData);

            // Utiliser updateEtudiant (PUT) au lieu de patchEtudiant (PATCH)
            await etudiantApi.updateEtudiant(selectedEtudiant.id, etudiantUpdateData);
            console.log("Étudiant mis à jour comme non boursier car bourse rejetée");
          } catch (updateError) {
            console.warn("Erreur lors de la mise à jour du statut boursier:", updateError);
            console.warn("Détails de l'erreur:", updateError.response?.data);

            // Alternative: Essayer avec PATCH mais avec plus de champs
            try {
              // Si updateEtudiant échoue, essayer avec seulement les champs critiques
              const alternativeUpdateData = {
                boursier: 'NON',
                bourse: 0,
                matricule: selectedEtudiant.matricule, // Inclure le matricule pour la validation
                nom: selectedEtudiant.nom,
                prenom: selectedEtudiant.prenom,
                niveau: selectedEtudiant.niveau,
                code_redoublement: selectedEtudiant.code_redoublement
              };
              await etudiantApi.updateEtudiant(selectedEtudiant.id, alternativeUpdateData);
              console.log("Étudiant mis à jour avec méthode alternative");
            } catch (secondError) {
              console.error("Échec de la mise à jour alternative:", secondError);
            }
          }
        } else if (editBourseData.status === "ACCEPTEE") {
          // Si la bourse est acceptée, mettre à jour comme boursier
          try {
            // Récupérer d'abord les données complètes de l'étudiant
            const etudiantResponse = await etudiantApi.getEtudiant(selectedEtudiant.id);
            const etudiantData = etudiantResponse.data;

            const etudiantUpdateData = {
              ...etudiantData,
              boursier: 'OUI',
              bourse: parseFloat(editBourseData.montant) || selectedEtudiant.bourse || 0
            };
            console.log("Mise à jour étudiant après acceptation:", etudiantUpdateData);

            await etudiantApi.updateEtudiant(selectedEtudiant.id, etudiantUpdateData);
            console.log("Étudiant mis à jour comme boursier");
          } catch (updateError) {
            console.warn("Erreur lors de la mise à jour du statut boursier:", updateError);
          }
        }

        setToastMessage("Bourse mise à jour avec succès!");
      } else {
        // Créer une nouvelle bourse - CORRIGÉ
        response = await bourseApi.createBourse(bourseData);
        console.log("Bourse créée:", response.data);

        // Mettre à jour le statut boursier seulement si ce n'est pas rejeté
        if (editBourseData.status !== "REJETEE") {
          try {
            // Récupérer d'abord les données complètes de l'étudiant
            const etudiantResponse = await etudiantApi.getEtudiant(selectedEtudiant.id);
            const etudiantData = etudiantResponse.data;

            const etudiantUpdateData = {
              ...etudiantData,
              boursier: 'OUI',
              bourse: parseFloat(editBourseData.montant) || 0
            };
            console.log("Mise à jour étudiant après création bourse:", etudiantUpdateData);

            await etudiantApi.updateEtudiant(selectedEtudiant.id, etudiantUpdateData);
            console.log("Étudiant mis à jour comme boursier");
          } catch (updateError) {
            console.warn("Erreur lors de la mise à jour de l'étudiant:", updateError);
            console.warn("Détails de l'erreur:", updateError.response?.data);
          }
        } else {
          // Si c'est rejeté dès la création, s'assurer que l'étudiant reste NON boursier
          try {
            // Récupérer d'abord les données complètes de l'étudiant
            const etudiantResponse = await etudiantApi.getEtudiant(selectedEtudiant.id);
            const etudiantData = etudiantResponse.data;

            const etudiantUpdateData = {
              ...etudiantData,
              boursier: 'NON',
              bourse: 0
            };
            console.log("Mise à jour étudiant après création bourse rejetée:", etudiantUpdateData);

            await etudiantApi.updateEtudiant(selectedEtudiant.id, etudiantUpdateData);
            console.log("Étudiant maintenu comme non boursier (bourse rejetée)");
          } catch (updateError) {
            console.warn("Erreur lors de la mise à jour de l'étudiant:", updateError);
          }
        }

        setToastMessage("Bourse créée avec succès!");
      }

      setToastVariant("success");
      setShowToast(true);
      setShowEditBourseModal(false);
      loadData(); // Recharger les données

    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      console.error("Détails de l'erreur:", error.response?.data);

      // Afficher les détails de l'erreur
      let errorMessage = "Erreur lors de la sauvegarde";
      if (error.response?.data) {
        console.log("Données d'erreur:", error.response.data);

        if (typeof error.response.data === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join(' | ');
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      setToastMessage(errorMessage);
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  // Attribuer une nouvelle bourse - CORRIGÉ
  const attribuerBourse = async () => {
    try {
      // Préparer les données
      const bourseData = {
        montant: parseFloat(newAttribution.montant) || 0,
        status: newAttribution.status,
        date_debut: newAttribution.date_debut,
        date_fin: newAttribution.date_fin,
        annee_academique: newAttribution.annee_academique,
        conditions: newAttribution.conditions || "",
        etudiant: selectedEtudiant.id
      };

      debugData(bourseData, "ATTRIBUTION");

      // Créer la bourse - CORRIGÉ
      const bourseResponse = await bourseApi.createBourse(bourseData);
      console.log("Bourse attribuée:", bourseResponse.data);

      // Mettre à jour l'étudiant comme boursier seulement si ce n'est pas rejeté
      if (newAttribution.status !== "REJETEE") {
        try {
          await etudiantApi.patchEtudiant(selectedEtudiant.id, {
            boursier: 'OUI',
            bourse: parseFloat(newAttribution.montant) || 0
          });
          console.log("Étudiant mis à jour comme boursier");
        } catch (updateError) {
          console.warn("Erreur lors de la mise à jour de l'étudiant:", updateError);
        }
      } else {
        // Si c'est rejeté dès le début, s'assurer que l'étudiant reste NON boursier
        try {
          await etudiantApi.patchEtudiant(selectedEtudiant.id, {
            boursier: 'NON',
            bourse: 0
          });
          console.log("Étudiant maintenu comme non boursier (bourse rejetée)");
        } catch (updateError) {
          console.warn("Erreur lors de la mise à jour de l'étudiant:", updateError);
        }
      }

      setToastMessage("Bourse attribuée avec succès!");
      setToastVariant("success");
      setShowToast(true);
      setShowAttributionModal(false);
      loadData(); // Recharger les données

    } catch (error) {
      console.error("Erreur lors de l'attribution:", error);

      let errorMessage = "Erreur lors de l'attribution";
      if (error.response?.data) {
        console.log("Données d'erreur:", error.response.data);

        if (typeof error.response.data === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join(' | ');
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      setToastMessage(errorMessage);
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  // Supprimer une bourse - CORRIGÉ
  const deleteBourse = async () => {
    try {
      if (selectedBourse) {
        // Supprimer la bourse - CORRIGÉ
        await bourseApi.deleteBourse(selectedBourse.id);
        console.log("Bourse supprimée:", selectedBourse.id);

        // Mettre à jour l'étudiant comme non boursier
        try {
          await etudiantApi.patchEtudiant(selectedEtudiant.id, {
            boursier: 'NON',
            bourse: 0
          });
        } catch (updateError) {
          console.warn("Erreur lors de la mise à jour de l'étudiant:", updateError);
        }

        setToastMessage("Bourse supprimée avec succès!");
        setToastVariant("success");
        setShowToast(true);
        setShowDeleteConfirm(false);
        setShowEditBourseModal(false);
        loadData(); // Recharger les données
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);

      let errorMessage = "Erreur lors de la suppression";
      if (error.response?.data) {
        errorMessage = error.response.data.detail || errorMessage;
      }

      setToastMessage(errorMessage);
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  // Formater le montant
  const formatMontant = (montant) => {
    if (!montant) return "0";
    return parseFloat(montant).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Exporter les données
  const exportData = () => {
    const dataToExport = filteredEtudiants.map(etudiant => {
      const bourse = findBourseForEtudiant(etudiant.id);
      return {
        "Numéro d'inscription": etudiant.numero_inscription || "",
        "Matricule": etudiant.matricule || "",
        "Nom": etudiant.nom || "",
        "Prénom": etudiant.prenom || "",
        "Niveau": etudiant.niveau || "",
        "Faculté": etudiant.faculte || "",
        "Domaine": etudiant.domaine || "",
        "Boursier": etudiant.boursier || "NON",
        "Montant bourse": bourse?.montant || etudiant.bourse || 0,
        "Statut bourse": bourse?.status || getBourseStatus(etudiant).label,
        "Date début": bourse?.date_debut ? formatDate(bourse.date_debut) : "-",
        "Date fin": bourse?.date_fin ? formatDate(bourse.date_fin) : "-",
        "Année académique": bourse?.annee_academique || "-",
        "Conditions": bourse?.conditions || "-",
        "Code redoublement": etudiant.code_redoublement || "N"
      };
    });

    const csv = convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bourses_${new Date().toISOString().split('T')[0]}.csv`;
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

  // Obtenir la couleur pour le niveau
  const getNiveauColor = (niveau) => {
    if (!niveau) return "secondary";
    if (niveau.includes('Licence 1') || niveau.includes('L1')) return "info";
    if (niveau.includes('Licence 2') || niveau.includes('L2')) return "primary";
    if (niveau.includes('Licence 3') || niveau.includes('L3')) return "success";
    if (niveau.includes('Master')) return "warning";
    if (niveau.includes('Doctorat')) return "danger";
    return "secondary";
  };

  // Fonction pour tester la connexion API
  const testApiConnection = async () => {
    try {
      console.log("Test de connexion API...");

      // Tester l'endpoint bourses
      const testResponse = await api.get('/bourses/');
      console.log("API bourses accessible, statut:", testResponse.status);

      // Tester avec une requête spécifique
      if (testResponse.data.length > 0) {
        const sampleBourse = testResponse.data[0];
        console.log("Exemple de bourse:", {
          id: sampleBourse.id,
          etudiant: sampleBourse.etudiant,
          montant: sampleBourse.montant,
          status: sampleBourse.status
        });
      }

      setToastMessage("Connexion API OK");
      setToastVariant("success");
      setShowToast(true);

      return true;
    } catch (error) {
      console.error("Erreur de connexion API:", error);
      setToastMessage("Erreur de connexion à l'API");
      setToastVariant("danger");
      setShowToast(true);
      return false;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Toast Container pour les notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={5000}
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="row mb-4">
        <div className="col">
          <h1 className="text-primary">
            <FaMoneyBillWave className="me-2" />
            Service des Bourses
          </h1>
          <p className="text-muted">
            Gestion des bourses pour les étudiants inscrits et réinscrits
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="row mb-4">
        <div className="col-md-2">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-primary">{stats.total}</Card.Title>
              <Card.Text className="text-muted">Total étudiants</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-2">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-success">{stats.boursiers}</Card.Title>
              <Card.Text className="text-muted">Boursiers</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-2">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-danger">{stats.nonBoursiers}</Card.Title>
              <Card.Text className="text-muted">Non boursiers</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-2">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-warning">{stats.enAttente}</Card.Title>
              <Card.Text className="text-muted">En attente</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-2">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-info">{stats.acceptees}</Card.Title>
              <Card.Text className="text-muted">Acceptées</Card.Text>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-2">
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="text-danger">{stats.rejetees}</Card.Title>
              <Card.Text className="text-muted">Rejetées</Card.Text>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-8">
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
                <div className="col-md-3">
                  <Form.Select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    {statutsDisponibles.map((statut, index) => (
                      <option key={index} value={statut}>{statut}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Select
                    value={filterNiveau}
                    onChange={(e) => setFilterNiveau(e.target.value)}
                  >
                    <option value="">Tous les niveaux</option>
                    {niveaux.map((niveau, index) => (
                      <option key={index} value={niveau}>{niveau}</option>
                    ))}
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Select
                    value={filterBoursier}
                    onChange={(e) => setFilterBoursier(e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="OUI">Boursiers</option>
                    <option value="NON">Non boursiers</option>
                  </Form.Select>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <div className="btn-group">
                <Button
                  variant="outline-primary"
                  onClick={exportData}
                  disabled={filteredEtudiants.length === 0}
                >
                  <FaFileExport className="me-2" /> Exporter CSV
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={generatePDF}
                  disabled={etudiants.length === 0}
                >
                  <FaFilePdf className="me-2" /> Générer PDF
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadData}>
            Réessayer
          </Button>
        </Alert>
      )}

      {/* Tableau des bourses */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Chargement des données...</p>
            </div>
          ) : filteredEtudiants.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">Aucun étudiant trouvé</p>
              {etudiants.length === 0 ? (
                <p className="text-danger">
                  Aucun étudiant dans la base de données. Veuillez d'abord créer des étudiants.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-light">
                  <tr>
                    <th>Numéro</th>
                    <th>Étudiant</th>
                    <th>Code</th>
                    <th>Niveau</th>
                    <th>Montant</th>
                    <th>Statut bourse</th>
                    <th>Date attribution</th>
                    <th>Année académique</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEtudiants.map((etudiant) => {
                    const bourseInfo = getBourseInfo(etudiant);
                    const bourseStatus = getBourseStatus(etudiant);

                    return (
                      <tr key={etudiant.id}>
                        <td>
                          <small className="font-monospace">{etudiant.numero_inscription}</small>
                          <div><small className="text-muted">{etudiant.matricule}</small></div>
                        </td>
                        <td>
                          <div className="fw-medium">{getFullName(etudiant)}</div>
                          <small className="text-muted">{etudiant.faculte}</small>
                        </td>
                        <td>
                          <Badge bg={etudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                            {etudiant.code_redoublement}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getNiveauColor(etudiant.niveau)}>
                            {etudiant.niveau}
                          </Badge>
                        </td>
                        <td className="fw-bold">
                          {etudiant.bourse > 0 ? (
                            <span className="text-success">
                              {formatMontant(etudiant.bourse)} MGA
                            </span>
                          ) : (
                            <span className="text-danger">-</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={bourseStatus.color}>
                            {bourseStatus.label}
                          </Badge>
                        </td>
                        <td>
                          {bourseInfo?.date_debut ? (
                            <span className="text-primary">{formatDate(bourseInfo.date_debut)}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {bourseInfo?.annee_academique ? (
                            <span className="text-info">{bourseInfo.annee_academique}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm" role="group">
                            <Button
                              variant="outline-info"
                              onClick={() => openDetailModal(etudiant)}
                              title="Détails"
                              size="sm"
                            >
                              <FaEye />
                            </Button>
                            {etudiant.boursier === "NON" ? (
                              <Button
                                variant="outline-success"
                                onClick={() => openAttributionModal(etudiant)}
                                title="Attribuer une bourse"
                                size="sm"
                              >
                                <FaCheck />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline-warning"
                                  onClick={() => openEditBourseModal(etudiant)}
                                  title="Modifier la bourse"
                                  size="sm"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  onClick={() => generateStudentPDF(etudiant)}
                                  title="Générer PDF"
                                  size="sm"
                                >
                                  <FaFilePdf />
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
          )}
        </div>
      </div>

      {/* Modal Détails */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>Détails de l'étudiant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <div className="row">
              <div className="col-md-6">
                <h5>Informations personnelles</h5>
                <dl className="row">
                  <dt className="col-sm-4">Numéro d'inscription</dt>
                  <dd className="col-sm-8">{selectedEtudiant.numero_inscription}</dd>

                  <dt className="col-sm-4">Matricule</dt>
                  <dd className="col-sm-8">{selectedEtudiant.matricule}</dd>

                  <dt className="col-sm-4">Nom complet</dt>
                  <dd className="col-sm-8">{getFullName(selectedEtudiant)}</dd>

                  {selectedEtudiant.date_naissance && (
                    <>
                      <dt className="col-sm-4">Date naissance</dt>
                      <dd className="col-sm-8">{formatDate(selectedEtudiant.date_naissance)}</dd>
                    </>
                  )}

                  <dt className="col-sm-4">Niveau</dt>
                  <dd className="col-sm-8">
                    <Badge bg={getNiveauColor(selectedEtudiant.niveau)}>
                      {selectedEtudiant.niveau}
                    </Badge>
                  </dd>

                  <dt className="col-sm-4">Code redoublement</dt>
                  <dd className="col-sm-8">
                    <Badge bg={selectedEtudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                      {selectedEtudiant.code_redoublement} - {selectedEtudiant.code_redoublement === 'N' ? 'Inscrit' : 'Réinscrit'}
                    </Badge>
                  </dd>

                  <dt className="col-sm-4">Faculté</dt>
                  <dd className="col-sm-8">{selectedEtudiant.faculte}</dd>

                  {selectedEtudiant.domaine && (
                    <>
                      <dt className="col-sm-4">Domaine</dt>
                      <dd className="col-sm-8">{selectedEtudiant.domaine}</dd>
                    </>
                  )}
                </dl>
              </div>

              <div className="col-md-6">
                <h5>Informations bourse</h5>
                <dl className="row">
                  <dt className="col-sm-4">Statut boursier</dt>
                  <dd className="col-sm-8">
                    {selectedEtudiant.boursier === "OUI" ? (
                      <Badge bg="success">BOURSIER</Badge>
                    ) : (
                      <Badge bg="danger">NON BOURSIER</Badge>
                    )}
                  </dd>

                  {selectedBourse ? (
                    <>
                      <dt className="col-sm-4">Montant</dt>
                      <dd className="col-sm-8">
                        <span className="fw-bold text-success">
                          {formatMontant(selectedBourse.montant)} MGA
                        </span>
                      </dd>

                      <dt className="col-sm-4">Statut</dt>
                      <dd className="col-sm-8">
                        {(() => {
                          const statut = statutsBourse.find(s => s.value === selectedBourse.status);
                          return statut ? (
                            <Badge bg={statut.color}>{statut.label}</Badge>
                          ) : (
                            <Badge bg="secondary">{selectedBourse.status}</Badge>
                          );
                        })()}
                      </dd>

                      <dt className="col-sm-4">Année académique</dt>
                      <dd className="col-sm-8">{selectedBourse.annee_academique}</dd>

                      <dt className="col-sm-4">Date demande</dt>
                      <dd className="col-sm-8">{formatDate(selectedBourse.date_demande)}</dd>

                      {selectedBourse.date_decision && (
                        <>
                          <dt className="col-sm-4">Date décision</dt>
                          <dd className="col-sm-8">{formatDate(selectedBourse.date_decision)}</dd>
                        </>
                      )}

                      <dt className="col-sm-4">Date début</dt>
                      <dd className="col-sm-8">{formatDate(selectedBourse.date_debut)}</dd>

                      <dt className="col-sm-4">Date fin</dt>
                      <dd className="col-sm-8">{formatDate(selectedBourse.date_fin)}</dd>

                      <dt className="col-sm-4">Conditions</dt>
                      <dd className="col-sm-8">
                        {selectedBourse.conditions || <span className="text-muted">Aucune</span>}
                      </dd>
                    </>
                  ) : (
                    <dd className="col-sm-8">
                      <span className="text-muted">Aucune bourse attribuée</span>
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100">
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
            <div>
              {selectedEtudiant && selectedBourse && (
                <Button variant="danger" onClick={() => generateStudentPDF(selectedEtudiant)} className="me-2">
                  <FaFilePdf className="me-1" /> PDF Étudiant
                </Button>
              )}
              {selectedEtudiant && selectedEtudiant.boursier === "OUI" && (
                <Button variant="warning" onClick={() => {
                  setShowDetailModal(false);
                  openEditBourseModal(selectedEtudiant);
                }}>
                  Modifier la bourse
                </Button>
              )}
            </div>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Les autres modales restent inchangées */}
      {/* Modal Modification de bourse */}
      <Modal show={showEditBourseModal} onHide={() => setShowEditBourseModal(false)} size="lg">
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>
            {selectedBourse ? "Modifier la bourse" : "Créer une bourse"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <Form>
              <Alert variant="info">
                Étudiant : <strong>{getFullName(selectedEtudiant)}</strong>
                <br />
                Code : <Badge bg={selectedEtudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                  {selectedEtudiant.code_redoublement} - {selectedEtudiant.code_redoublement === 'N' ? 'Inscrit' : 'Réinscrit'}
                </Badge>
                <br />
                Niveau : {selectedEtudiant.niveau}
              </Alert>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Montant (MGA) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={editBourseData.montant}
                      onChange={(e) => setEditBourseData({ ...editBourseData, montant: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Statut *</Form.Label>
                    <Form.Select
                      value={editBourseData.status}
                      onChange={(e) => setEditBourseData({ ...editBourseData, status: e.target.value })}
                      required
                    >
                      {statutsBourse.map((statut, index) => (
                        <option key={index} value={statut.value}>{statut.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date début *</Form.Label>
                    <Form.Control
                      type="date"
                      value={editBourseData.date_debut}
                      onChange={(e) => setEditBourseData({ ...editBourseData, date_debut: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date fin *</Form.Label>
                    <Form.Control
                      type="date"
                      value={editBourseData.date_fin}
                      onChange={(e) => setEditBourseData({ ...editBourseData, date_fin: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Année académique *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 2024-2025"
                      value={editBourseData.annee_academique}
                      onChange={(e) => setEditBourseData({ ...editBourseData, annee_academique: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editBourseData.conditions}
                  onChange={(e) => setEditBourseData({ ...editBourseData, conditions: e.target.value })}
                  placeholder="Conditions spécifiques de la bourse..."
                />
              </Form.Group>

              <Alert variant={selectedEtudiant.code_redoublement === 'N' ? 'success' : 'warning'}>
                <strong>Note :</strong> Cet étudiant est
                <strong> {selectedEtudiant.code_redoublement === 'N' ? 'INSCRIT (N)' : 'RÉINSCRIT (R)'}</strong>.
                {selectedEtudiant.code_redoublement === 'R' &&
                  " Les réinscrits ont souvent droit à des bourses spécifiques de réinscription."}
              </Alert>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditBourseModal(false)}>
            Annuler
          </Button>
          {selectedBourse && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Supprimer
            </Button>
          )}
          <Button
            variant="warning"
            onClick={saveBourseModifications}
            disabled={!editBourseData.montant || !editBourseData.date_debut || !editBourseData.date_fin || !editBourseData.annee_academique}
          >
            {selectedBourse ? 'Enregistrer' : 'Créer'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Attribution de bourse */}
      <Modal show={showAttributionModal} onHide={() => setShowAttributionModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>Attribuer une bourse</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEtudiant && (
            <Form>
              <Alert variant="success">
                Attribuer une bourse à : <strong>{getFullName(selectedEtudiant)}</strong>
                <br />
                Niveau : {selectedEtudiant.niveau}
              </Alert>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Montant (MGA) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={newAttribution.montant}
                      onChange={(e) => setNewAttribution({ ...newAttribution, montant: e.target.value })}
                      required
                    />
                    <Form.Text className="text-muted">
                      Montant recommandé pour {selectedEtudiant.niveau} : {formatMontant(selectedEtudiant.bourse) || 'Non défini'} MGA
                    </Form.Text>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Statut initial</Form.Label>
                    <Form.Select
                      value={newAttribution.status}
                      onChange={(e) => setNewAttribution({ ...newAttribution, status: e.target.value })}
                    >
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="ACCEPTEE">Acceptée</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date début *</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAttribution.date_debut}
                      onChange={(e) => setNewAttribution({ ...newAttribution, date_debut: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Date fin *</Form.Label>
                    <Form.Control
                      type="date"
                      value={newAttribution.date_fin}
                      onChange={(e) => setNewAttribution({ ...newAttribution, date_fin: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Année académique *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 2024-2025"
                      value={newAttribution.annee_academique}
                      onChange={(e) => setNewAttribution({ ...newAttribution, annee_academique: e.target.value })}
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Conditions</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={newAttribution.conditions}
                  onChange={(e) => setNewAttribution({ ...newAttribution, conditions: e.target.value })}
                  placeholder="Conditions spécifiques de la bourse..."
                />
              </Form.Group>

              {selectedEtudiant.code_redoublement === 'R' && (
                <Alert variant="warning">
                  <strong>Note pour les réinscrits :</strong>
                  Les étudiants réinscrits (code R) peuvent bénéficier de bourses de réinscription spécifiques.
                </Alert>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAttributionModal(false)}>
            Annuler
          </Button>
          <Button
            variant="success"
            onClick={attribuerBourse}
            disabled={!newAttribution.montant || !newAttribution.date_debut || !newAttribution.date_fin || !newAttribution.annee_academique}
          >
            Attribuer la bourse
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer la bourse de {selectedEtudiant && getFullName(selectedEtudiant)} ?
          <br />
          <strong className="text-danger">Cette action est irréversible.</strong>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={deleteBourse}>
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}