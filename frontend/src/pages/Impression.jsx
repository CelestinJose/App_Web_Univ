// src/pages/Impression.jsx
import React, { useState, useEffect } from "react";
import {
    FaPrint,
    FaDownload,
    FaFilter,
    FaSearch,
    FaEye,
    FaInfoCircle,
    FaEyeSlash,
    FaExclamationTriangle,
    FaCheckCircle
} from "react-icons/fa";
import {
    Button,
    Form,
    Table,
    Card,
    Alert,
    Spinner,
    InputGroup,
    Modal,
    Row,
    Col,
    Badge
} from "react-bootstrap";
import { etudiantApi } from '../api';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Impression() {
    // États pour les données
    const [etudiants, setEtudiants] = useState([]);
    const [filteredEtudiants, setFilteredEtudiants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportError, setExportError] = useState(null);

    // États pour les filtres
    const [selectedFaculte, setSelectedFaculte] = useState("");
    const [selectedDomaine, setSelectedDomaine] = useState("");
    const [selectedMention, setSelectedMention] = useState("");
    const [selectedNiveau, setSelectedNiveau] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAll, setShowAll] = useState(false);

    // États pour les données de filtres dynamiques
    const [facultesList, setFacultesList] = useState([]);
    const [domainesList, setDomainesList] = useState([]);
    const [mentionsList, setMentionsList] = useState([]);
    const [niveauxList, setNiveauxList] = useState([]);

    // États pour l'exportation
    const [exportLoading, setExportLoading] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState("");

    // Extraire les listes uniques des étudiants chargés
    const extractFilterData = (etudiantsData) => {
        const facultesSet = new Set();
        const domainesSet = new Set();
        const mentionsSet = new Set();
        const niveauxSet = new Set();
        
        etudiantsData.forEach(etudiant => {
            if (etudiant.faculte_nom) facultesSet.add(etudiant.faculte_nom);
            else if (etudiant.faculte) facultesSet.add(etudiant.faculte);
            
            if (etudiant.domaine_nom) domainesSet.add(etudiant.domaine_nom);
            else if (etudiant.domaine) domainesSet.add(etudiant.domaine);
            
            if (etudiant.mention_nom) mentionsSet.add(etudiant.mention_nom);
            else if (etudiant.mention) mentionsSet.add(etudiant.mention);
            
            if (etudiant.niveau) niveauxSet.add(etudiant.niveau);
        });
        
        setFacultesList(Array.from(facultesSet).sort());
        setDomainesList(Array.from(domainesSet).sort());
        setMentionsList(Array.from(mentionsSet).sort());
        setNiveauxList(Array.from(niveauxSet).sort());
    };

    // Vérifier si tous les filtres requis sont sélectionnés (pour PDF)
    const areAllRequiredFiltersSelected = () => {
        return selectedFaculte !== "" &&
            selectedDomaine !== "" &&
            selectedMention !== "" &&
            selectedNiveau !== "";
    };

    // Vérifier si le bouton PDF doit être activé
    const isPdfEnabled = () => {
        return filteredEtudiants.length > 0 && areAllRequiredFiltersSelected();
    };

    // Obtenir la liste des filtres manquants
    const getMissingFilters = () => {
        const missing = [];
        if (!selectedFaculte) missing.push("Faculté");
        if (!selectedDomaine) missing.push("Domaine");
        if (!selectedMention) missing.push("Mention");
        if (!selectedNiveau) missing.push("Niveau");
        return missing;
    };

    // Charger tous les étudiants
    const fetchEtudiants = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await etudiantApi.getEtudiants({ page_size: 1000 });
            let etudiantsData = [];
            
            if (response.data && Array.isArray(response.data.results)) {
                etudiantsData = response.data.results;
            } else if (Array.isArray(response.data)) {
                etudiantsData = response.data;
            }
            
            setEtudiants(etudiantsData);
            setFilteredEtudiants(etudiantsData);
            
            // Extraire les données pour les filtres
            extractFilterData(etudiantsData);
            
        } catch (err) {
            console.error("Erreur:", err);
            setError("Erreur lors du chargement des étudiants");
        } finally {
            setLoading(false);
        }
    };

    // Charger les données au démarrage
    useEffect(() => {
        fetchEtudiants();
    }, []);

    // Filtrer les étudiants selon les critères
    useEffect(() => {
        let filtered = etudiants;

        // Filtre par faculté
        if (selectedFaculte) {
            filtered = filtered.filter(e => 
                (e.faculte_nom && e.faculte_nom === selectedFaculte) || 
                (e.faculte && e.faculte === selectedFaculte)
            );
        }

        // Filtre par domaine
        if (selectedDomaine) {
            filtered = filtered.filter(e => 
                (e.domaine_nom && e.domaine_nom === selectedDomaine) || 
                (e.domaine && e.domaine === selectedDomaine)
            );
        }

        // Filtre par mention
        if (selectedMention) {
            filtered = filtered.filter(e => 
                (e.mention_nom && e.mention_nom === selectedMention) || 
                (e.mention && e.mention === selectedMention)
            );
        }

        // Filtre par niveau
        if (selectedNiveau) {
            filtered = filtered.filter(e => e.niveau === selectedNiveau);
        }

        // Filtre par recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                (e.matricule && e.matricule.toLowerCase().includes(term)) ||
                (e.nom && e.nom.toLowerCase().includes(term)) ||
                (e.prenom && e.prenom.toLowerCase().includes(term)) ||
                (e.cin && e.cin.toLowerCase().includes(term))
            );
        }

        setFilteredEtudiants(filtered);
    }, [etudiants, selectedFaculte, selectedDomaine, selectedMention, selectedNiveau, searchTerm]);

    // Gérer le changement de faculté
    const handleFaculteChange = (e) => {
        const faculteValue = e.target.value;
        setSelectedFaculte(faculteValue);
        setSelectedDomaine("");
        setSelectedMention("");
        setSelectedNiveau("");
        
        // Extraire les domaines, mentions et niveaux pour cette faculté
        const domainesSet = new Set();
        const mentionsSet = new Set();
        const niveauxSet = new Set();
        
        etudiants.forEach(etudiant => {
            const faculteMatch = (etudiant.faculte_nom && etudiant.faculte_nom === faculteValue) || 
                               (etudiant.faculte && etudiant.faculte === faculteValue);
            if (faculteMatch) {
                if (etudiant.domaine_nom) domainesSet.add(etudiant.domaine_nom);
                else if (etudiant.domaine) domainesSet.add(etudiant.domaine);
                
                if (etudiant.mention_nom) mentionsSet.add(etudiant.mention_nom);
                else if (etudiant.mention) mentionsSet.add(etudiant.mention);
                
                if (etudiant.niveau) niveauxSet.add(etudiant.niveau);
            }
        });
        
        setDomainesList(Array.from(domainesSet).sort());
        setMentionsList(Array.from(mentionsSet).sort());
        setNiveauxList(Array.from(niveauxSet).sort());
    };

    // Gérer le changement de domaine
    const handleDomaineChange = (e) => {
        const domaineValue = e.target.value;
        setSelectedDomaine(domaineValue);
        setSelectedMention("");
        setSelectedNiveau("");
        
        // Extraire les mentions et niveaux pour ce domaine
        const mentionsSet = new Set();
        const niveauxSet = new Set();
        
        etudiants.forEach(etudiant => {
            const faculteMatch = (etudiant.faculte_nom && etudiant.faculte_nom === selectedFaculte) || 
                               (etudiant.faculte && etudiant.faculte === selectedFaculte);
            const domaineMatch = (etudiant.domaine_nom && etudiant.domaine_nom === domaineValue) || 
                               (etudiant.domaine && etudiant.domaine === domaineValue);
            
            if (faculteMatch && domaineMatch) {
                if (etudiant.mention_nom) mentionsSet.add(etudiant.mention_nom);
                else if (etudiant.mention) mentionsSet.add(etudiant.mention);
                
                if (etudiant.niveau) niveauxSet.add(etudiant.niveau);
            }
        });
        
        setMentionsList(Array.from(mentionsSet).sort());
        setNiveauxList(Array.from(niveauxSet).sort());
    };

    // Gérer le changement de mention
    const handleMentionChange = (e) => {
        const mentionValue = e.target.value;
        setSelectedMention(mentionValue);
        setSelectedNiveau("");
        
        // Extraire les niveaux pour cette mention
        const niveauxSet = new Set();
        
        etudiants.forEach(etudiant => {
            const faculteMatch = (etudiant.faculte_nom && etudiant.faculte_nom === selectedFaculte) || 
                               (etudiant.faculte && etudiant.faculte === selectedFaculte);
            const domaineMatch = (etudiant.domaine_nom && etudiant.domaine_nom === selectedDomaine) || 
                               (etudiant.domaine && etudiant.domaine === selectedDomaine);
            const mentionMatch = (etudiant.mention_nom && etudiant.mention_nom === mentionValue) || 
                               (etudiant.mention && etudiant.mention === mentionValue);
            
            if (faculteMatch && domaineMatch && mentionMatch) {
                if (etudiant.niveau) niveauxSet.add(etudiant.niveau);
            }
        });
        
        setNiveauxList(Array.from(niveauxSet).sort());
    };

    // Fonction d'exportation Excel
    const exportToExcel = () => {
        setExportLoading(true);
        setExportError(null);

        try {
            const dataForExport = filteredEtudiants.map(etudiant => ({
                "Matricule": etudiant.matricule,
                "Nom et Prénom": `${etudiant.nom} ${etudiant.prenom}`,
                "Date Naissance": formatDate(etudiant.date_naissance),
                "CIN": etudiant.cin || '-',
                "Num Tél": etudiant.telephone || '-',
                "N/R/T": etudiant.code_redoublement,
                "Année Bac": etudiant.annee_bacc || '-',
                "Boursier": etudiant.boursier,
                "Montant Bourse": etudiant.bourse > 0 ? `${parseFloat(etudiant.bourse).toLocaleString()} MGA` : '-',
                "Faculté": etudiant.faculte_nom || etudiant.faculte || '-',
                "Domaine": etudiant.domaine_nom || etudiant.domaine || '-',
                "Mention": etudiant.mention_nom || etudiant.mention || '-',
                "Niveau": etudiant.niveau,
                "Lieu Naissance": etudiant.lieu_naissance || '-',
                "Email": etudiant.email || '-',
                "Nationalité": etudiant.nationalite || 'Malagasy',
                "Père": etudiant.nom_pere || '-',
                "Mère": etudiant.nom_mere || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(dataForExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Liste Étudiants");

            const fileName = `liste_etudiants_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error("Erreur export Excel:", error);
            setExportError("Erreur lors de l'export Excel : " + error.message);
        } finally {
            setExportLoading(false);
            setShowExportModal(false);
        }
    };

    // Fonction d'exportation PDF - Affiche SEULEMENT les étudiants du niveau sélectionné
    const exportToPDF = () => {
        setExportLoading(true);
        setExportError(null);

        try {
            const doc = new jsPDF('portrait');
            const date = new Date().toLocaleDateString('fr-FR');

            // En-tête institutionnel
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("REPOBLIKAN'NY MADAGASIKARA", 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text("FITIAVANA - TANINDRAZANA - FANDROSOANA", 105, 22, { align: 'center' });

            doc.setFontSize(11);
            doc.text("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET DE LA RECHERCHE SCIENTIFIQUE", 105, 30, { align: 'center' });
            doc.text("UNIVERSITE DE TOLIARA", 105, 37, { align: 'center' });

            doc.setFontSize(14);
            doc.text("Liste Inscription", 105, 47, { align: 'center' });

            // Informations de la faculté
            const firstStudent = filteredEtudiants[0] || {};
            const currentDate = new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Faculte: ${firstStudent.faculte_nom || firstStudent.faculte || selectedFaculte || 'Non spécifié'}`, 20, 60);
            doc.text(`Domaine: ${firstStudent.domaine_nom || firstStudent.domaine || selectedDomaine || 'Non spécifié'}`, 20, 67);
            doc.text(`Mention: ${firstStudent.mention_nom || firstStudent.mention || selectedMention || 'Non spécifié'}`, 20, 74);
            doc.text(`Niveau: ${firstStudent.niveau || selectedNiveau || 'Non spécifié'}`, 20, 81);

            // Date de génération à droite
            doc.text(`Date: ${currentDate}`, 180, 81, { align: 'right' });

            // Tableau des étudiants - SEULEMENT ceux du niveau sélectionné
            const tableColumn = [
                { header: "N°", dataKey: "numero", width: 10 },
                { header: "Matricule", dataKey: "matricule", width: 25 },
                { header: "Nom et Prénoms", dataKey: "nom_complet", width: 45 },
                { header: "Date de naissance", dataKey: "date_naissance", width: 22 },
                { header: "CIN", dataKey: "cin", width: 25 },
                { header: "Num Tel", dataKey: "telephone", width: 22 },
                { header: "N/R/T", dataKey: "code_redoublement", width: 12 },
                { header: "Année Bacc", dataKey: "annee_bacc", width: 18 },
                { header: "Bourse", dataKey: "boursier", width: 12 },
                { header: "Montant", dataKey: "montant", width: 15 },
                { header: "Signature", dataKey: "signature", width: 25 }
            ];

            const tableRows = filteredEtudiants
                .filter(etudiant => etudiant.niveau === selectedNiveau) // FILTRE SUPPLEMENTAIRE : seulement le niveau sélectionné
                .map((etudiant, index) => {
                    let montantFormatted = '-';
                    if (etudiant.bourse > 0) {
                        const montantNum = parseFloat(etudiant.bourse);
                        montantFormatted = montantNum.toLocaleString('fr-FR', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).replace(/\u202f/g, ' ');
                    }

                    return {
                        numero: index + 1,
                        matricule: etudiant.matricule || '-',
                        nom_complet: `${etudiant.nom || ''} ${etudiant.prenom || ''}`.trim(),
                        date_naissance: formatDate(etudiant.date_naissance) || '-',
                        cin: etudiant.cin || '-',
                        telephone: etudiant.telephone || '-',
                        code_redoublement: etudiant.code_redoublement || 'N',
                        annee_bacc: etudiant.annee_bacc || '-',
                        boursier: etudiant.boursier === 'OUI' ? 'OUI' : 'NON',
                        montant: montantFormatted,
                        signature: ""
                    };
                });

            const startY = 90;

            autoTable(doc, {
                columns: tableColumn,
                body: tableRows,
                startY: startY,
                theme: 'grid',
                headStyles: {
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 7
                },
                bodyStyles: {
                    fontSize: 7,
                    cellPadding: 1,
                    cellWidth: 'wrap',
                    overflow: 'linebreak',
                    halign: 'center'
                },
                columnStyles: {
                    numero: {
                        halign: 'center',
                        cellWidth: 10
                    },
                    montant: {
                        halign: 'right',
                        cellWidth: 15
                    },
                    date_naissance: {
                        halign: 'center',
                        cellWidth: 22
                    },
                    annee_bacc: {
                        halign: 'center',
                        cellWidth: 18
                    }
                },
                margin: { left: 10, right: 10 },
                styles: {
                    overflow: 'linebreak',
                    cellWidth: 'wrap'
                },
                didDrawPage: function (data) {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.text(
                        `Page ${data.pageNumber} sur ${pageCount}`,
                        105,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );

                    // Mention spécifique au niveau
                    const mention = firstStudent.mention_nom || firstStudent.mention || selectedMention || 'Non spécifié';
                    const niveau = selectedNiveau || 'Non spécifié';
                    doc.text(
                        `${mention} --- ${niveau}`,
                        105,
                        doc.internal.pageSize.height - 20,
                        { align: 'right' }
                    );

                    if (data.pageNumber === pageCount) {
                        const totalY = doc.internal.pageSize.height - 30;
                        doc.setFont("helvetica");
                        doc.text(
                            `Arrêtée la présente liste au nombre de ${tableRows.length} étudiants (Niveau: ${selectedNiveau})`,
                            105,
                            totalY,
                            { align: 'center' }
                        );
                    }
                }
            });

            const mention = firstStudent.mention_nom || firstStudent.mention || selectedMention || 'TUL';
            const niveau = selectedNiveau || '';
            const fileName = `Liste_Inscription_${mention.replace(/\s+/g, '_')}_${niveau.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error("Erreur export PDF:", error);
            setExportError("Erreur lors de l'export PDF : " + error.message);
        } finally {
            setExportLoading(false);
            setShowExportModal(false);
        }
    };

    // Fonction helper pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (dateString.includes('-')) {
                const parts = dateString.split('-');
                if (parts[0].length === 4) {
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                } else {
                    return dateString;
                }
            }
            return date.toLocaleDateString('fr-FR');
        } catch (e) {
            return dateString;
        }
    };

    // Gérer l'exportation
    const handleExport = (type) => {
        // Vérifier s'il y a des étudiants à exporter
        if (filteredEtudiants.length === 0) {
            setExportError(`Impossible d'exporter en ${type.toUpperCase()} : Aucun étudiant correspondant aux critères de filtrage.`);
            setTimeout(() => setExportError(null), 5000);
            return;
        }

        // Vérification spéciale pour PDF
        if (type === 'pdf' && !isPdfEnabled()) {
            const missingFilters = getMissingFilters();
            let errorMessage = "Impossible d'exporter en PDF : ";
            
            if (missingFilters.length > 0) {
                errorMessage += `Filtres requis manquants : ${missingFilters.join(', ')}.`;
            } else {
                errorMessage += "Conditions d'exportation PDF non remplies.";
            }
            
            setExportError(errorMessage);
            setTimeout(() => setExportError(null), 5000);
            return;
        }

        // Vérifier spécifiquement pour PDF qu'il y a des étudiants du niveau sélectionné
        if (type === 'pdf') {
            const etudiantsDuNiveau = filteredEtudiants.filter(e => e.niveau === selectedNiveau);
            if (etudiantsDuNiveau.length === 0) {
                setExportError(`Impossible d'exporter en PDF : Aucun étudiant trouvé pour le niveau "${selectedNiveau}".`);
                setTimeout(() => setExportError(null), 5000);
                return;
            }
        }

        setExportType(type);
        setShowExportModal(true);
    };

    // Confirmer l'exportation
    const confirmExport = () => {
        if (filteredEtudiants.length === 0) {
            setExportError("Impossible d'exporter : La liste des étudiants est vide.");
            setShowExportModal(false);
            setTimeout(() => setExportError(null), 5000);
            return;
        }

        // Vérification supplémentaire pour PDF
        if (exportType === 'pdf' && !isPdfEnabled()) {
            const missingFilters = getMissingFilters();
            setExportError(`Impossible d'exporter en PDF : Filtres requis manquants : ${missingFilters.join(', ')}.`);
            setShowExportModal(false);
            setTimeout(() => setExportError(null), 5000);
            return;
        }

        // Vérifier spécifiquement pour PDF qu'il y a des étudiants du niveau sélectionné
        if (exportType === 'pdf') {
            const etudiantsDuNiveau = filteredEtudiants.filter(e => e.niveau === selectedNiveau);
            if (etudiantsDuNiveau.length === 0) {
                setExportError(`Impossible d'exporter en PDF : Aucun étudiant trouvé pour le niveau "${selectedNiveau}".`);
                setShowExportModal(false);
                setTimeout(() => setExportError(null), 5000);
                return;
            }
        }

        if (exportType === 'excel') {
            exportToExcel();
        } else if (exportType === 'pdf') {
            exportToPDF();
        }
    };

    // Réinitialiser les filtres
    const resetFilters = () => {
        setSelectedFaculte("");
        setSelectedDomaine("");
        setSelectedMention("");
        setSelectedNiveau("");
        setSearchTerm("");
        // Réinitialiser les listes à toutes les valeurs disponibles
        extractFilterData(etudiants);
    };

    // Groupe les étudiants par faculté → domaine → mention → niveau
    const groupEtudiants = () => {
        const grouped = {};

        filteredEtudiants.forEach(etudiant => {
            const faculte = etudiant.faculte_nom || etudiant.faculte || "Non spécifié";
            const domaine = etudiant.domaine_nom || etudiant.domaine || "Non spécifié";
            const mention = etudiant.mention_nom || etudiant.mention || "Non spécifié";
            const niveau = etudiant.niveau || "Non spécifié";

            if (!grouped[faculte]) grouped[faculte] = {};
            if (!grouped[faculte][domaine]) grouped[faculte][domaine] = {};
            if (!grouped[faculte][domaine][mention]) grouped[faculte][domaine][mention] = {};
            if (!grouped[faculte][domaine][mention][niveau]) {
                grouped[faculte][domaine][mention][niveau] = [];
            }

            grouped[faculte][domaine][mention][niveau].push(etudiant);
        });

        return grouped;
    };

    // Statistiques
    const getStats = () => {
        const grouped = groupEtudiants();
        let totalEtudiants = 0;
        const stats = {
            totalFacultes: Object.keys(grouped).length,
            facultes: {}
        };

        Object.keys(grouped).forEach(faculte => {
            let facEtudiants = 0;
            let facDomaines = 0;

            Object.keys(grouped[faculte]).forEach(domaine => {
                let domEtudiants = 0;
                let domMentions = 0;

                Object.keys(grouped[faculte][domaine]).forEach(mention => {
                    let menEtudiants = 0;
                    let menNiveaux = 0;

                    Object.keys(grouped[faculte][domaine][mention]).forEach(niveau => {
                        const count = grouped[faculte][domaine][mention][niveau].length;
                        menEtudiants += count;
                        menNiveaux++;
                    });

                    domEtudiants += menEtudiants;
                    domMentions++;
                });

                facEtudiants += domEtudiants;
                facDomaines++;

                if (!stats.facultes[faculte]) {
                    stats.facultes[faculte] = { total: 0, domaines: {} };
                }
                stats.facultes[faculte].domaines[domaine] = domEtudiants;
            });

            stats.facultes[faculte].total = facEtudiants;
            totalEtudiants += facEtudiants;
        });

        stats.totalEtudiants = totalEtudiants;
        return stats;
    };

    // Obtenir les statistiques
    const stats = getStats();
    const groupedEtudiants = groupEtudiants();

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* En-tête */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-primary">
                        <FaPrint className="me-2" />
                        Impression des Listes d'Étudiants
                    </h1>
                    <p className="text-muted">
                        Affichage organisé par faculté, domaine, mention et niveau
                    </p>
                </div>
            </div>

            {/* Statistiques */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <Card className="border-primary shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-primary h6 mb-2">
                                Total Étudiants
                            </Card.Title>
                            <div className="d-flex align-items-center">
                                <div className="display-6 me-3 text-primary">{stats.totalEtudiants}</div>
                                <div className="text-muted small">
                                    dans {stats.totalFacultes} faculté(s)
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-success shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-success h6 mb-2">
                                Facultés Actives
                            </Card.Title>
                            <div className="h2 text-success">{stats.totalFacultes}</div>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-6">
                    <Card className="border-info shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-info h6 mb-2">
                                Conditions PDF
                            </Card.Title>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <Badge bg={selectedFaculte ? "success" : "secondary"} className="p-2 d-flex align-items-center">
                                    {selectedFaculte ? <FaCheckCircle className="me-1" /> : null}
                                    Faculté
                                </Badge>
                                <Badge bg={selectedDomaine ? "success" : "secondary"} className="p-2 d-flex align-items-center">
                                    {selectedDomaine ? <FaCheckCircle className="me-1" /> : null}
                                    Domaine
                                </Badge>
                                <Badge bg={selectedMention ? "success" : "secondary"} className="p-2 d-flex align-items-center">
                                    {selectedMention ? <FaCheckCircle className="me-1" /> : null}
                                    Mention
                                </Badge>
                                <Badge bg={selectedNiveau ? "success" : "secondary"} className="p-2 d-flex align-items-center">
                                    {selectedNiveau ? <FaCheckCircle className="me-1" /> : null}
                                    Niveau
                                </Badge>
                                {isPdfEnabled() ? (
                                    <Badge bg="success" className="p-2 ms-2">
                                        <FaCheckCircle className="me-1" />
                                        PDF Activé
                                    </Badge>
                                ) : (
                                    <Badge bg="warning" text="dark" className="p-2 ms-2">
                                        <FaExclamationTriangle className="me-1" />
                                        PDF Désactivé
                                    </Badge>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Message d'erreur pour exportation */}
            {exportError && (
                <Alert variant="danger" onClose={() => setExportError(null)} dismissible className="mb-3">
                    <Alert.Heading>
                        <FaExclamationTriangle className="me-2" />
                        Erreur d'exportation !
                    </Alert.Heading>
                    <p className="mb-0">{exportError}</p>
                </Alert>
            )}

            {/* Barre de filtres */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium">
                                    Faculté <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={selectedFaculte}
                                    onChange={handleFaculteChange}
                                    className={`border-${selectedFaculte ? 'success' : 'primary'}`}
                                >
                                    <option value="">Sélectionnez une faculté</option>
                                    {facultesList.map((fac, idx) => (
                                        <option key={idx} value={fac}>{fac}</option>
                                    ))}
                                </Form.Select>
                                <Form.Text className={selectedFaculte ? "text-success" : "text-danger"}>
                                    {selectedFaculte ? "✓ Sélectionné" : "✗ Obligatoire pour PDF"}
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium">
                                    Domaine <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={selectedDomaine}
                                    onChange={handleDomaineChange}
                                    disabled={!selectedFaculte}
                                    className={`border-${selectedDomaine ? 'success' : 'warning'}`}
                                >
                                    <option value="">Sélectionnez un domaine</option>
                                    {domainesList.map((dom, idx) => (
                                        <option key={idx} value={dom}>{dom}</option>
                                    ))}
                                </Form.Select>
                                <Form.Text className={selectedDomaine ? "text-success" : "text-danger"}>
                                    {selectedDomaine ? "✓ Sélectionné" : "✗ Obligatoire pour PDF"}
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium">
                                    Mention <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={selectedMention}
                                    onChange={handleMentionChange}
                                    disabled={!selectedDomaine}
                                    className={`border-${selectedMention ? 'success' : 'warning'}`}
                                >
                                    <option value="">Sélectionnez une mention</option>
                                    {mentionsList.map((men, idx) => (
                                        <option key={idx} value={men}>{men}</option>
                                    ))}
                                </Form.Select>
                                <Form.Text className={selectedMention ? "text-success" : "text-danger"}>
                                    {selectedMention ? "✓ Sélectionnée" : "✗ Obligatoire pour PDF"}
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={3}>
                            <Form.Group>
                                <Form.Label className="fw-medium">
                                    Niveau <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={selectedNiveau}
                                    onChange={(e) => setSelectedNiveau(e.target.value)}
                                    disabled={!selectedMention}
                                    className={`border-${selectedNiveau ? 'success' : 'info'}`}
                                >
                                    <option value="">Sélectionnez un niveau</option>
                                    {niveauxList.map((niv, idx) => (
                                        <option key={idx} value={niv}>{niv}</option>
                                    ))}
                                </Form.Select>
                                <Form.Text className={selectedNiveau ? "text-success" : "text-danger"}>
                                    {selectedNiveau ? "✓ Sélectionné" : "✗ Obligatoire pour PDF"}
                                </Form.Text>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label className="fw-medium">Recherche (optionnel)</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light">
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Matricule, Nom, Prénom ou CIN..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-secondary"
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setSearchTerm("")}
                                        disabled={!searchTerm}
                                    >
                                        Effacer
                                    </Button>
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        <Col md={6} className="d-flex align-items-end gap-2">
                            <Button
                                variant="outline-danger"
                                onClick={resetFilters}
                                className="d-flex align-items-center"
                            >
                                <FaFilter className="me-2" />
                                Réinitialiser
                            </Button>
                            <Button
                                variant="outline-info"
                                onClick={() => setShowAll(!showAll)}
                                className="d-flex align-items-center"
                            >
                                {showAll ? (
                                    <>
                                        <FaEyeSlash className="me-2" />
                                        Masquer détails
                                    </>
                                ) : (
                                    <>
                                        <FaEye className="me-2" />
                                        Afficher détails
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="success"
                                onClick={() => handleExport('excel')}
                                className="d-flex align-items-center"
                                disabled={exportLoading || filteredEtudiants.length === 0}
                                title={filteredEtudiants.length === 0 ? "Aucun étudiant à exporter" : "Exporter en Excel"}
                            >
                                <FaDownload className="me-2" />
                                Excel
                            </Button>
                            <Button
                                variant={isPdfEnabled() ? "danger" : "secondary"}
                                onClick={() => handleExport('pdf')}
                                className="d-flex align-items-center"
                                disabled={exportLoading || !isPdfEnabled()}
                                title={!isPdfEnabled() ? "Sélectionnez tous les filtres (Faculté, Domaine, Mention, Niveau) pour exporter en PDF" : "Exporter en PDF"}
                            >
                                <FaPrint className="me-2" />
                                PDF
                                {!isPdfEnabled() && filteredEtudiants.length > 0 && (
                                    <span className="ms-1 badge bg-warning">!</span>
                                )}
                            </Button>
                        </Col>
                    </Row>

                    {/* Indicateur de progression des filtres */}
                    <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="fw-medium">Progression des filtres requis :</small>
                            <small className={areAllRequiredFiltersSelected() ? "text-success" : "text-warning"}>
                                {areAllRequiredFiltersSelected() ? "✓ Tous les filtres sont sélectionnés" : `${getMissingFilters().length} filtre(s) manquant(s)`}
                            </small>
                        </div>
                        <div className="progress" style={{ height: '10px' }}>
                            <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${(getMissingFilters().length === 0 ? 4 : 4 - getMissingFilters().length) / 4 * 100}%` }}
                                aria-valuenow={(getMissingFilters().length === 0 ? 4 : 4 - getMissingFilters().length)}
                                aria-valuemin="0"
                                aria-valuemax="4"
                            ></div>
                        </div>
                        <small className="text-muted mt-2 d-block">
                            Filtres requis pour PDF: <span className="fw-bold">Faculté, Domaine, Mention, Niveau</span>
                        </small>
                        {selectedNiveau && (
                            <small className="text-info mt-1 d-block">
                                <FaInfoCircle className="me-1" />
                                Le PDF affichera seulement les étudiants du niveau: <strong>{selectedNiveau}</strong>
                            </small>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Affichage principal */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Chargement de la liste des étudiants...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">
                    <Alert.Heading>Erreur !</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchEtudiants}>
                        Réessayer
                    </Button>
                </Alert>
            ) : (
                <>
                    {/* Résumé */}
                    <Alert variant="info" className="mb-3">
                        <Alert.Heading>Résumé des résultats</Alert.Heading>
                        <p className="mb-0">
                            Affichage de <strong>{filteredEtudiants.length}</strong> étudiant(s) sur {etudiants.length} total.
                            {selectedFaculte && ` Faculté : ${selectedFaculte}`}
                            {selectedDomaine && ` | Domaine : ${selectedDomaine}`}
                            {selectedMention && ` | Mention : ${selectedMention}`}
                            {selectedNiveau && ` | Niveau : ${selectedNiveau}`}
                        </p>
                        {!isPdfEnabled() && (
                            <p className="mb-0 mt-2 text-warning">
                                <FaExclamationTriangle className="me-1" />
                                <small>Pour exporter en PDF : {getMissingFilters().join(', ')} {getMissingFilters().length > 1 ? 'sont requis' : 'est requis'}</small>
                            </p>
                        )}
                        {isPdfEnabled() && (
                            <p className="mb-0 mt-2 text-success">
                                <FaCheckCircle className="me-1" />
                                <small>Le PDF affichera seulement les étudiants du niveau : <strong>{selectedNiveau}</strong> ({filteredEtudiants.filter(e => e.niveau === selectedNiveau).length} étudiants)</small>
                            </p>
                        )}
                    </Alert>

                    {/* Liste organisée */}
                    {Object.keys(groupedEtudiants).length === 0 ? (
                        <Alert variant="warning">
                            <Alert.Heading>Aucun étudiant trouvé</Alert.Heading>
                            <p className="mb-0">Aucun étudiant ne correspond aux critères de recherche.</p>
                            <div className="mt-3">
                                <Button variant="outline-warning" onClick={resetFilters}>
                                    Afficher tous les étudiants
                                </Button>
                            </div>
                        </Alert>
                    ) : (
                        Object.keys(groupedEtudiants).map((faculte, facIndex) => (
                            <Card key={facIndex} className="mb-4 border-primary shadow-sm">
                                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                                    <div>
                                        <h5 className="mb-1">{faculte}</h5>
                                        <small className="opacity-75">
                                            {Object.keys(groupedEtudiants[faculte]).length} domaine(s), {Object.values(groupedEtudiants[faculte]).reduce((acc, domaine) => acc + Object.keys(domaine).length, 0)} mention(s)
                                        </small>
                                    </div>
                                    <Badge bg="light" text="dark" className="fs-6 px-3 py-2">
                                        {Object.values(groupedEtudiants[faculte]).reduce((acc, domaine) =>
                                            acc + Object.values(domaine).reduce((acc2, mention) =>
                                                acc2 + Object.values(mention).reduce((acc3, niveau) => acc3 + niveau.length, 0), 0), 0
                                        )} étudiants
                                    </Badge>
                                </Card.Header>
                                <Card.Body>
                                    {Object.keys(groupedEtudiants[faculte]).map((domaine, domIndex) => (
                                        <div key={domIndex} className="mb-4">
                                            <h6 className="text-success border-bottom pb-2 mb-3">
                                                <span className="fw-bold">Domaine :</span> {domaine}
                                            </h6>
                                            {Object.keys(groupedEtudiants[faculte][domaine]).map((mention, menIndex) => (
                                                <div key={menIndex} className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 className="text-info mb-0">
                                                            <span className="fw-bold">Mention :</span> {mention}
                                                        </h6>
                                                        <small className="text-muted">
                                                            {Object.keys(groupedEtudiants[faculte][domaine][mention]).length} niveau(x)
                                                        </small>
                                                    </div>
                                                    {Object.keys(groupedEtudiants[faculte][domaine][mention]).map((niveau, nivIndex) => (
                                                        <div key={nivIndex} className="mb-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <h6 className="text-warning mb-0">
                                                                    <span className="fw-bold">Niveau :</span> {niveau}
                                                                </h6>
                                                                <Badge bg="warning" text="dark" className="px-3">
                                                                    {groupedEtudiants[faculte][domaine][mention][niveau].length} étudiants
                                                                </Badge>
                                                            </div>
                                                            {showAll && (
                                                                <div className="table-responsive">
                                                                    <Table striped bordered hover size="sm" className="mb-0">
                                                                        <thead className="table-light">
                                                                            <tr>
                                                                                <th width="5%">#</th>
                                                                                <th width="10%">Matricule</th>
                                                                                <th width="15%">Nom et Prénom</th>
                                                                                <th width="10%">Date Naiss.</th>
                                                                                <th width="10%">CIN</th>
                                                                                <th width="10%">Téléphone</th>
                                                                                <th width="5%">N/R/T</th>
                                                                                <th width="8%">Année Bac</th>
                                                                                <th width="8%">Boursier</th>
                                                                                <th width="12%">Montant Bourse</th>
                                                                                <th width="7%">Signature</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {groupedEtudiants[faculte][domaine][mention][niveau].map((etudiant, etudIndex) => (
                                                                                <tr key={etudIndex}>
                                                                                    <td className="text-center">{etudIndex + 1}</td>
                                                                                    <td className="font-monospace">{etudiant.matricule}</td>
                                                                                    <td>{etudiant.nom} {etudiant.prenom}</td>
                                                                                    <td>{formatDate(etudiant.date_naissance)}</td>
                                                                                    <td>{etudiant.cin || '-'}</td>
                                                                                    <td>{etudiant.telephone || '-'}</td>
                                                                                    <td className="text-center">
                                                                                        <Badge
                                                                                            bg={etudiant.code_redoublement === 'N' ? 'success' :
                                                                                                etudiant.code_redoublement === 'R' ? 'danger' : 'warning'}
                                                                                        >
                                                                                            {etudiant.code_redoublement}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td className="text-center">{etudiant.annee_bacc || '-'}</td>
                                                                                    <td className="text-center">
                                                                                        <Badge
                                                                                            bg={etudiant.boursier === 'OUI' ? 'success' : 'secondary'}
                                                                                        >
                                                                                            {etudiant.boursier}
                                                                                        </Badge>
                                                                                    </td>
                                                                                    <td className="text-center font-monospace">
                                                                                        {etudiant.bourse > 0 ? (
                                                                                            <span className="text-success fw-bold">
                                                                                                {parseFloat(etudiant.bourse).toLocaleString()} MGA
                                                                                            </span>
                                                                                        ) : '-'}
                                                                                    </td>
                                                                                    <td className="text-center" style={{ color: '#666' }}>
                                                                                        ___________
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </>
            )}

            {/* Modal d'exportation */}
            <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
                <Modal.Header closeButton className={exportType === 'excel' ? 'bg-success text-white' : 'bg-danger text-white'}>
                    <Modal.Title>
                        Confirmer l'exportation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Vous êtes sur le point d'exporter <strong>{exportType === 'pdf' ? filteredEtudiants.filter(e => e.niveau === selectedNiveau).length : filteredEtudiants.length}</strong> étudiant(s) au format {exportType.toUpperCase()}.
                    </p>
                    {exportType === 'pdf' && (
                        <div className="alert alert-success mb-2">
                            <strong>Filtres appliqués :</strong>
                            <div className="mt-1">
                                <Badge bg="info" className="me-1">Faculté: {selectedFaculte}</Badge>
                                <Badge bg="info" className="me-1">Domaine: {selectedDomaine}</Badge>
                                <Badge bg="info" className="me-1">Mention: {selectedMention}</Badge>
                                <Badge bg="info" className="me-1">Niveau: {selectedNiveau}</Badge>
                            </div>
                            <div className="mt-2">
                                <strong>Note importante :</strong> Le PDF affichera seulement les étudiants du niveau <strong>{selectedNiveau}</strong>.
                            </div>
                        </div>
                    )}
                    {exportType === 'excel' && (
                        <div className="alert alert-info mb-0">
                            <strong>Format Excel :</strong> Toutes les colonnes seront incluses dans un fichier Excel.
                        </div>
                    )}
                    {exportType === 'pdf' && (
                        <div className="alert alert-info mb-0">
                            <strong>Format PDF :</strong> Une liste imprimable avec seulement les étudiants du niveau sélectionné.
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                        Annuler
                    </Button>
                    <Button
                        variant={exportType === 'excel' ? 'success' : 'danger'}
                        onClick={confirmExport}
                        disabled={exportLoading}
                    >
                        {exportLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Exportation...
                            </>
                        ) : (
                            `Exporter en ${exportType.toUpperCase()}`
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}