// src/pages/DoublonBourseExact.jsx - Version corrigée
import React, { useState, useEffect } from "react";
import {
    FaMoneyBillWave,
    FaUser,
    FaIdCard,
    FaUniversity,
    FaBook,
    FaGraduationCap,
    FaExclamationTriangle,
    FaFilter,
    FaSearch,
    FaSync,
    FaFileExcel,
    FaPrint,
    FaCheckCircle,
    FaTimesCircle,
    FaRandom,
    FaTrash,
    FaUserCheck,
    FaList
} from "react-icons/fa";
import {
    Button,
    Table,
    Card,
    Alert,
    Spinner,
    InputGroup,
    Form,
    Row,
    Col,
    Badge,
    Modal,
    Pagination,
    Dropdown
} from "react-bootstrap";
import { etudiantApi, bourseApi } from '../api';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function DoublonBourseExact() {
    // États pour les données
    const [doublonsIdentite, setDoublonsIdentite] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);

    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDoublon, setSelectedDoublon] = useState(null);

    // États pour la gestion des bourses
    const [showAttributionModal, setShowAttributionModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedEtudiant, setSelectedEtudiant] = useState(null);
    const [selectedFormation, setSelectedFormation] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState("");

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Charger les doublons par identité
    const fetchDoublonsIdentite = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await bourseApi.getDoublonsIdentite();
            setDoublonsIdentite(response.data.results || []);
        } catch (err) {
            console.error("Erreur:", err);
            setError("Erreur lors du chargement des doublons");
        } finally {
            setLoading(false);
        }
    };

    // Charger les données au démarrage
    useEffect(() => {
        fetchDoublonsIdentite();
    }, []);

    // Filtrer les doublons
    const filteredDoublons = doublonsIdentite.filter(doublon => {
        return searchTerm ?
            doublon.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doublon.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doublon.cin?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDoublons = filteredDoublons.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDoublons.length / itemsPerPage);

    // Gérer l'attribution d'une bourse unique
    const handleAttribuerBourseUnique = async () => {
        if (!selectedEtudiant || !selectedGroup) return;
        
        setActionLoading(true);
        setActionMessage("");
        
        try {
            const data = {
                etudiant_id: selectedEtudiant.id,
                formation_choisie: selectedFormation
            };
            
            const response = await bourseApi.attribuerBourseUnique(data);
            
            if (response.data) {
                setActionMessage(response.data.message || "Bourse unique attribuée avec succès");
                
                // Recharger les données après un délai
                setTimeout(() => {
                    fetchDoublonsIdentite();
                    setShowAttributionModal(false);
                    setSelectedGroup(null);
                    setSelectedEtudiant(null);
                    setSelectedFormation("");
                }, 1500);
            }
        } catch (err) {
            console.error("Erreur:", err);
            setActionMessage("Erreur lors de l'attribution de la bourse: " + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Ouvrir le modal d'attribution
    const handleOpenAttributionModal = (groupe) => {
        setSelectedGroup(groupe);
        
        // Par défaut, sélectionner le premier étudiant
        if (groupe.etudiants && groupe.etudiants.length > 0) {
            setSelectedEtudiant(groupe.etudiants[0]);
            
            // Par défaut, sélectionner la formation du premier étudiant
            const formation = `${groupe.etudiants[0].faculte || ''}|${groupe.etudiants[0].domaine || ''}|${groupe.etudiants[0].mention || ''}`;
            setSelectedFormation(formation);
        }
        
        setShowAttributionModal(true);
    };

    // Fonction pour exporter en Excel
    const exportToExcel = () => {
        setExportLoading(true);

        try {
            const dataForExport = doublonsIdentite.flatMap(groupe =>
                groupe.etudiants.map(etudiant => ({
                    "Nom": groupe.nom,
                    "Prénom": groupe.prenom,
                    "CIN": groupe.cin || 'Non renseigné',
                    "Formations différentes": groupe.formations.length,
                    "Matricule": etudiant.matricule,
                    "Faculté": etudiant.faculte || 'Non spécifié',
                    "Domaine": etudiant.domaine || 'Non spécifié',
                    "Mention": etudiant.mention || 'Non spécifié',
                    "Niveau": etudiant.niveau,
                    "Boursier": etudiant.boursier,
                    "Montant Bourse": parseFloat(etudiant.bourse_montant).toLocaleString('fr-FR'),
                    "Statut Bourse": groupe.has_bourse ? 'Bourse active' : 'Aucune bourse'
                }))
            );

            const ws = XLSX.utils.json_to_sheet(dataForExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Doublons par Identité");

            const fileName = `doublons_identite_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error("Erreur export Excel:", error);
            setError("Erreur lors de l'export Excel : " + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    // Statistiques
    const stats = {
        totalDoublons: doublonsIdentite.length,
        totalInscriptions: doublonsIdentite.reduce((sum, d) => sum + d.count, 0),
        avecBourse: doublonsIdentite.filter(d => d.has_bourse).length,
        sansBourse: doublonsIdentite.filter(d => !d.has_bourse).length,
        maxFormations: doublonsIdentite.length > 0 ? 
            Math.max(...doublonsIdentite.map(d => d.formations.length)) : 0,
        totalBourses: doublonsIdentite.reduce((sum, d) => sum + d.bourses_count, 0)
    };

    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (e) {
            return dateString;
        }
    };

    // Formater le montant
    const formatMontant = (montant) => {
        return parseFloat(montant).toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' MGA';
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* En-tête */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-danger">
                        <FaExclamationTriangle className="me-2" />
                        Doublons par Identité - Gestion des Bourses
                    </h1>
                    <p className="text-muted">
                        Détection des étudiants avec mêmes Nom/Prénom/CIN mais formations différentes
                    </p>
                </div>
            </div>

            {/* Statistiques */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <Card className="border-danger shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-danger h6 mb-2">
                                Personnes en doublon
                            </Card.Title>
                            <div className="h2 text-danger">{stats.totalDoublons}</div>
                            <small className="text-muted">
                                mêmes nom/prénom/CIN
                            </small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-warning shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-warning h6 mb-2">
                                Inscriptions multiples
                            </Card.Title>
                            <div className="h2 text-warning">{stats.totalInscriptions}</div>
                            <small className="text-muted">
                                inscriptions en doublon
                            </small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-success shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-success h6 mb-2">
                                Bourses en doublon
                            </Card.Title>
                            <div className="h2 text-success">{stats.totalBourses}</div>
                            <small className="text-muted">
                                bourses à régulariser
                            </small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-info shadow-sm">
                        <Card.Body className="p-3">
                            <Card.Title className="text-info h6 mb-2">
                                Exportation
                            </Card.Title>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-success"
                                    onClick={exportToExcel}
                                    disabled={exportLoading || doublonsIdentite.length === 0}
                                    className="flex-fill"
                                    size="sm"
                                >
                                    <FaFileExcel className="me-1" />
                                    Excel
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Barre de filtres */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Recherche</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light">
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Nom, prénom, CIN..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>

                        <Col md={4} className="d-flex align-items-end gap-2">
                            <Button
                                variant="outline-danger"
                                onClick={() => setSearchTerm("")}
                                className="d-flex align-items-center"
                            >
                                <FaFilter className="me-2" />
                                Réinitialiser
                            </Button>
                            <Button
                                variant="outline-danger"
                                onClick={fetchDoublonsIdentite}
                                className="d-flex align-items-center"
                                disabled={loading}
                            >
                                <FaSync className="me-2" />
                                Actualiser
                            </Button>
                            <div className="text-muted ms-auto">
                                <small>
                                    Affichage {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredDoublons.length)} sur {filteredDoublons.length} doublons
                                </small>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Message d'erreur */}
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-3">
                    <Alert.Heading>Erreur !</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchDoublonsIdentite}>
                        Réessayer
                    </Button>
                </Alert>
            )}

            {/* Affichage principal */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status" variant="danger">
                        <span className="visually-hidden">Chargement...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Recherche des doublons par identité...</p>
                </div>
            ) : doublonsIdentite.length === 0 ? (
                <Alert variant="success">
                    <Alert.Heading>
                        <FaCheckCircle className="me-2" />
                        Aucun doublon par identité détecté
                    </Alert.Heading>
                    <p className="mb-0">
                        Tous les étudiants ont des identités uniques (nom/prénom/CIN distincts).
                    </p>
                </Alert>
            ) : (
                <>
                    {/* Résumé */}
                    <Alert variant="danger" className="mb-3">
                        <Alert.Heading>
                            <FaExclamationTriangle className="me-2" />
                            Doublons par identité détectés - Action requise !
                        </Alert.Heading>
                        <p className="mb-0">
                            {stats.totalDoublons} personnes avec mêmes nom/prénom/CIN ({stats.totalInscriptions} inscriptions).
                            <strong> {stats.totalBourses} bourses en doublon détectées.</strong>
                            Une seule bourse par personne est autorisée.
                        </p>
                    </Alert>

                    {/* Liste des doublons */}
                    <div className="row">
                        <div className="col-md-12">
                            <Card className="shadow-sm">
                                <Card.Header className="bg-danger text-white">
                                    <h5 className="mb-0">
                                        <FaUser className="me-2" />
                                        Personnes avec inscriptions multiples ({filteredDoublons.length})
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <Table hover className="mb-0">
                                            <thead className="table-danger">
                                                <tr>
                                                    <th width="5%">#</th>
                                                    <th width="20%">Identité</th>
                                                    <th width="25%">Formations</th>
                                                    <th width="15%">Inscriptions</th>
                                                    <th width="20%">Statut Bourse</th>
                                                    <th width="15%">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentDoublons.map((doublon, index) => (
                                                    <tr key={index}>
                                                        <td className="text-center">{indexOfFirstItem + index + 1}</td>
                                                        <td>
                                                            <div>
                                                                <div className="fw-bold">
                                                                    <FaUser className="me-2" />
                                                                    {doublon.nom} {doublon.prenom}
                                                                </div>
                                                                <div className="small text-muted">
                                                                    <FaIdCard className="me-2" />
                                                                    CIN: {doublon.cin || 'Non renseigné'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <div>
                                                                    <FaList className="me-2 text-primary" />
                                                                    <Badge bg="danger" className="me-1">
                                                                        {doublon.formations.length} formation{doublon.formations.length > 1 ? 's' : ''}
                                                                    </Badge>
                                                                </div>
                                                                <div className="small text-muted mt-1">
                                                                    {doublon.formations.slice(0, 2).map((f, idx) => {
                                                                        const [fac, dom, men] = f.split('|');
                                                                        return (
                                                                            <div key={idx} className="mb-1">
                                                                                • {fac} - {dom} - {men}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {doublon.formations.length > 2 && (
                                                                        <div className="text-danger">
                                                                            + {doublon.formations.length - 2} autre(s)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <Badge bg="warning" className="px-3 py-2">
                                                                {doublon.count} inscription{doublon.count > 1 ? 's' : ''}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            {doublon.has_bourse ? (
                                                                <div>
                                                                    <Badge bg={doublon.bourses_count > 1 ? "danger" : "success"}>
                                                                        <FaMoneyBillWave className="me-1" />
                                                                        {doublon.bourses_count} bourse{doublon.bourses_count > 1 ? 's' : ''} active{doublon.bourses_count > 1 ? 's' : ''}
                                                                    </Badge>
                                                                    {doublon.bourses_count > 1 && (
                                                                        <div className="small text-danger mt-1">
                                                                            <FaExclamationTriangle className="me-1" />
                                                                            Plusieurs bourses détectées !
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-warning">
                                                                    <FaExclamationTriangle className="me-1" />
                                                                    Aucune bourse active
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleOpenAttributionModal(doublon)}
                                                                className="d-flex align-items-center"
                                                            >
                                                                <FaCheckCircle className="me-1" />
                                                                Attribuer bourse unique
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                />
                                <Pagination.Prev
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                />

                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNumber = i + 1;
                                    if (
                                        pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                                    ) {
                                        return (
                                            <Pagination.Item
                                                key={pageNumber}
                                                active={pageNumber === currentPage}
                                                onClick={() => setCurrentPage(pageNumber)}
                                            >
                                                {pageNumber}
                                            </Pagination.Item>
                                        );
                                    }
                                    return null;
                                })}

                                <Pagination.Next
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                />
                                <Pagination.Last
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            )}

            {/* Modal d'attribution de bourse unique */}
            <Modal show={showAttributionModal} onHide={() => setShowAttributionModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>
                        <FaMoneyBillWave className="me-2" />
                        Attribuer une bourse unique
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedGroup && (
                        <>
                            <Alert variant="warning">
                                <FaExclamationTriangle className="me-2" />
                                <strong>Cette personne a {selectedGroup.count} inscriptions :</strong>
                                <ul className="mb-0 mt-2">
                                    <li>Nom: {selectedGroup.nom} {selectedGroup.prenom}</li>
                                    <li>CIN: {selectedGroup.cin || 'Non renseigné'}</li>
                                    <li>Formations différentes: {selectedGroup.formations.length}</li>
                                </ul>
                            </Alert>

                            <h6>Sélectionner l'étudiant qui recevra la bourse :</h6>
                            <div className="mb-3">
                                <Form.Select
                                    value={selectedEtudiant?.id || ''}
                                    onChange={(e) => {
                                        const etudiantId = parseInt(e.target.value);
                                        const etudiant = selectedGroup.etudiants.find(e => e.id === etudiantId);
                                        if (etudiant) {
                                            setSelectedEtudiant(etudiant);
                                            const formation = `${etudiant.faculte || ''}|${etudiant.domaine || ''}|${etudiant.mention || ''}`;
                                            setSelectedFormation(formation);
                                        }
                                    }}
                                >
                                    {selectedGroup.etudiants.map((etudiant, idx) => (
                                        <option key={idx} value={etudiant.id}>
                                            {etudiant.matricule} - {etudiant.faculte} / {etudiant.domaine} / {etudiant.mention} - Niveau: {etudiant.niveau}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            <h6>Sélectionner la formation à financer :</h6>
                            <div className="mb-3">
                                <Form.Select
                                    value={selectedFormation}
                                    onChange={(e) => setSelectedFormation(e.target.value)}
                                >
                                    {selectedGroup.formations.map((formation, idx) => {
                                        const [fac, dom, men] = formation.split('|');
                                        return (
                                            <option key={idx} value={formation}>
                                                {fac} - {dom} - {men}
                                            </option>
                                        );
                                    })}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Cette formation sera enregistrée pour l'étudiant sélectionné.
                                </Form.Text>
                            </div>

                            <Alert variant="info">
                                <h6>Conséquences :</h6>
                                <ul className="mb-0">
                                    <li>L'étudiant sélectionné recevra la bourse</li>
                                    <li>Les autres inscriptions ne pourront pas avoir de bourse</li>
                                    <li>Si plusieurs bourses existent, une seule sera conservée</li>
                                    <li>Les bourses en doublon seront rejetées</li>
                                </ul>
                            </Alert>

                            {selectedGroup.bourses_actives && selectedGroup.bourses_actives.length > 0 && (
                                <div className="mt-3">
                                    <h6>Bourses actuellement actives :</h6>
                                    <div className="small">
                                        {selectedGroup.bourses_actives.map((bourse, idx) => (
                                            <div key={idx} className="mb-1">
                                                <Badge bg={bourse.status === 'ACCEPTEE' ? 'success' : 'warning'}>
                                                    {bourse.status}
                                                </Badge>
                                                {' '} - {formatMontant(bourse.montant)} - {bourse.annee_academique}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {actionMessage && (
                                <Alert variant={actionMessage.includes('Erreur') ? 'danger' : 'success'} className="mt-3">
                                    {actionMessage}
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowAttributionModal(false)}
                        disabled={actionLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleAttribuerBourseUnique}
                        disabled={actionLoading || !selectedEtudiant}
                    >
                        {actionLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Traitement...
                            </>
                        ) : (
                            <>
                                <FaCheckCircle className="me-2" />
                                Attribuer la bourse unique
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}