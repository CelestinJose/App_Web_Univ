// src/pages/DoublonNomPrenom.jsx
import React, { useState, useEffect } from "react";
import {
    FaExclamationTriangle,
    FaUser,
    FaIdCard,
    FaSearch,
    FaFilter,
    FaTrash,
    FaEye,
    FaSync,
    FaFileExcel,
    FaPrint,
    FaPhone,
    FaAddressCard,
    FaUsers,
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
    Tabs,
    Tab
} from "react-bootstrap";
import { etudiantApi, faculteApi, domaineApi, mentionApi } from '../api';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function DoublonNomPrenom() {
    // États pour les données
    const [etudiants, setEtudiants] = useState([]);
    const [facultes, setFacultes] = useState([]);
    const [domaines, setDomaines] = useState([]);
    const [mentions, setMentions] = useState([]);
    const [doublons, setDoublons] = useState({
        nomPrenom: [],
        cin: [],
        telephone: [],
        all: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);
    
    // États pour les filtres et onglets
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDoublon, setSelectedDoublon] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [etudiantToDelete, setEtudiantToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState("nomPrenom");
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fonctions helpers pour obtenir les noms à partir des IDs
    const getNomFaculte = (id, facultesList) => {
        if (!id) return "-";
        
        const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
        const fac = facultesList.find(f => f.id === idNum);
        
        return fac ? fac.nom : `Faculté ${id}`;
    };

    const getNomDomaine = (id, domainesList) => {
        if (!id) return "-";
        
        const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
        const dom = domainesList.find(d => d.id === idNum);
        
        return dom ? dom.nom : `Domaine ${id}`;
    };

    const getNomMention = (id, mentionsList) => {
        if (!id) return "-";
        
        const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
        const men = mentionsList.find(m => m.id === idNum);
        
        return men ? men.nom : `Mention ${id}`;
    };
    
    // Charger toutes les données en une seule fonction
    const fetchAllData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log("Début du chargement de toutes les données...");
            
            // Étape 1: Charger les références (facultés, domaines, mentions)
            console.log("Étape 1: Chargement des références...");
            
            const [facResponse, domResponse, menResponse] = await Promise.all([
                faculteApi.getFacultes({ page_size: 100 }),
                domaineApi.getDomaines({ page_size: 100 }),
                mentionApi.getMentions({ page_size: 100 })
            ]);
            
            const facData = Array.isArray(facResponse.data) ? facResponse.data : 
                          facResponse.data?.results || [];
            const domData = Array.isArray(domResponse.data) ? domResponse.data : 
                          domResponse.data?.results || [];
            const menData = Array.isArray(menResponse.data) ? menResponse.data : 
                          menResponse.data?.results || [];
            
            console.log("Références chargées:", {
                facultes: facData.length,
                domaines: domData.length,
                mentions: menData.length
            });
            
            // Mettre à jour les états des références
            setFacultes(facData);
            setDomaines(domData);
            setMentions(menData);
            
            // Étape 2: Charger les étudiants
            console.log("Étape 2: Chargement des étudiants...");
            const etudResponse = await etudiantApi.getEtudiants({ page_size: 1000 });
            let etudData = [];

            if (etudResponse.data && Array.isArray(etudResponse.data.results)) {
                etudData = etudResponse.data.results;
            } else if (Array.isArray(etudResponse.data)) {
                etudData = etudResponse.data;
            }

            console.log(`${etudData.length} étudiants chargés`);
            
            // Étape 3: Enrichir les données des étudiants avec les noms
            console.log("Étape 3: Enrichissement des données...");
            const enrichedData = etudData.map(etudiant => ({
                ...etudiant,
                faculte_nom: getNomFaculte(etudiant.faculte, facData),
                domaine_nom: getNomDomaine(etudiant.domaine, domData),
                mention_nom: getNomMention(etudiant.mention, menData)
            }));

            console.log("Données enrichies:", enrichedData.length);
            console.log("Exemple étudiant enrichi:", enrichedData[0]);
            
            // Étape 4: Mettre à jour l'état et détecter les doublons
            setEtudiants(enrichedData);
            detecterTousLesDoublons(enrichedData);
            
        } catch (err) {
            console.error("Erreur lors du chargement des données:", err);
            setError("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };
    
    // Fonction pour détecter tous les types de doublons
    const detecterTousLesDoublons = (data) => {
        const doublonsNomPrenom = detecterDoublonsNomPrenom(data);
        const doublonsCIN = detecterDoublonsCIN(data);
        const doublonsTelephone = detecterDoublonsTelephone(data);
        const tousDoublons = combinerTousLesDoublons(data);
        
        setDoublons({
            nomPrenom: doublonsNomPrenom,
            cin: doublonsCIN,
            telephone: doublonsTelephone,
            all: tousDoublons
        });
    };
    
    // Fonction pour détecter les doublons de nom et prénom
    const detecterDoublonsNomPrenom = (data) => {
        const doublonsMap = {};

        data.forEach(etudiant => {
            const nom = etudiant.nom?.toLowerCase().trim();
            const prenom = etudiant.prenom?.toLowerCase().trim();
            
            if (nom && prenom) {
                const cle = `${nom}_${prenom}`;
                if (!doublonsMap[cle]) {
                    doublonsMap[cle] = [];
                }
                doublonsMap[cle].push(etudiant);
            }
        });

        const doublonsArray = [];
        Object.keys(doublonsMap).forEach(cle => {
            if (doublonsMap[cle].length > 1) {
                const nom = doublonsMap[cle][0].nom;
                const prenom = doublonsMap[cle][0].prenom;
                doublonsArray.push({
                    type: "nom_prenom",
                    valeur: `${nom} ${prenom}`,
                    cle: cle,
                    count: doublonsMap[cle].length,
                    etudiants: doublonsMap[cle],
                    details: `Même nom et prénom: ${nom} ${prenom}`
                });
            }
        });

        doublonsArray.sort((a, b) => b.count - a.count);
        return doublonsArray;
    };
    
    // Fonction pour détecter les doublons de CIN
    const detecterDoublonsCIN = (data) => {
        const doublonsMap = {};

        data.forEach(etudiant => {
            const cin = etudiant.cin?.toLowerCase().trim();
            
            if (cin && cin !== '-') {
                if (!doublonsMap[cin]) {
                    doublonsMap[cin] = [];
                }
                doublonsMap[cin].push(etudiant);
            }
        });

        const doublonsArray = [];
        Object.keys(doublonsMap).forEach(cle => {
            if (doublonsMap[cle].length > 1) {
                doublonsArray.push({
                    type: "cin",
                    valeur: doublonsMap[cle][0].cin,
                    cle: cle,
                    count: doublonsMap[cle].length,
                    etudiants: doublonsMap[cle],
                    details: `Même CIN: ${doublonsMap[cle][0].cin}`
                });
            }
        });

        doublonsArray.sort((a, b) => b.count - a.count);
        return doublonsArray;
    };
    
    // Fonction pour détecter les doublons de téléphone
    const detecterDoublonsTelephone = (data) => {
        const doublonsMap = {};

        data.forEach(etudiant => {
            const tel = etudiant.telephone?.toLowerCase().trim();
            
            if (tel && tel !== '-') {
                if (!doublonsMap[tel]) {
                    doublonsMap[tel] = [];
                }
                doublonsMap[tel].push(etudiant);
            }
        });

        const doublonsArray = [];
        Object.keys(doublonsMap).forEach(cle => {
            if (doublonsMap[cle].length > 1) {
                doublonsArray.push({
                    type: "telephone",
                    valeur: doublonsMap[cle][0].telephone,
                    cle: cle,
                    count: doublonsMap[cle].length,
                    etudiants: doublonsMap[cle],
                    details: `Même téléphone: ${doublonsMap[cle][0].telephone}`
                });
            }
        });

        doublonsArray.sort((a, b) => b.count - a.count);
        return doublonsArray;
    };
    
    // Fonction pour combiner tous les doublons
    const combinerTousLesDoublons = (data) => {
        const etudiantsEnDoublon = new Set();
        const tousDoublons = [];
        
        [...detecterDoublonsNomPrenom(data), ...detecterDoublonsCIN(data), ...detecterDoublonsTelephone(data)]
            .forEach(doublon => {
                doublon.etudiants.forEach(etudiant => {
                    etudiantsEnDoublon.add(etudiant.id);
                });
            });
        
        const doublonsParEtudiant = {};
        
        data.forEach(etudiant => {
            if (etudiantsEnDoublon.has(etudiant.id)) {
                const causes = [];
                const nom = etudiant.nom?.toLowerCase().trim();
                const prenom = etudiant.prenom?.toLowerCase().trim();
                const cin = etudiant.cin?.toLowerCase().trim();
                const tel = etudiant.telephone?.toLowerCase().trim();
                
                if (nom && prenom) {
                    causes.push(`Nom: ${etudiant.nom} ${etudiant.prenom}`);
                }
                if (cin && cin !== '-') {
                    causes.push(`CIN: ${etudiant.cin}`);
                }
                if (tel && tel !== '-') {
                    causes.push(`Tél: ${etudiant.telephone}`);
                }
                
                if (!doublonsParEtudiant[etudiant.id]) {
                    doublonsParEtudiant[etudiant.id] = {
                        etudiant: etudiant,
                        causes: causes
                    };
                }
            }
        });
        
        Object.values(doublonsParEtudiant).forEach(item => {
            tousDoublons.push({
                type: "multiple",
                valeur: `${item.etudiant.nom} ${item.etudiant.prenom}`,
                cle: item.etudiant.id,
                count: 1,
                etudiants: [item.etudiant],
                details: `Causes: ${item.causes.join(', ')}`
            });
        });
        
        return tousDoublons;
    };

    // Charger les données au démarrage
    useEffect(() => {
        fetchAllData();
    }, []);
    
    // Obtenir les doublons selon l'onglet actif
    const getCurrentDoublons = () => {
        return doublons[activeTab] || [];
    };
    
    // Filtrer les doublons selon la recherche
    const filteredDoublons = getCurrentDoublons().filter(doublon =>
        doublon.valeur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doublon.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDoublons = filteredDoublons.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDoublons.length / itemsPerPage);

    // Gérer la sélection d'un doublon
    const handleSelectDoublon = (doublon) => {
        setSelectedDoublon(selectedDoublon?.cle === doublon.cle ? null : doublon);
    };

    // Fonction pour supprimer un étudiant
    const handleDeleteClick = (etudiant) => {
        setEtudiantToDelete(etudiant);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!etudiantToDelete) return;

        try {
            await etudiantApi.deleteEtudiant(etudiantToDelete.id);
            // Recharger les données après suppression
            fetchAllData();
            setShowDeleteModal(false);
            setEtudiantToDelete(null);
            setSelectedDoublon(null);
        } catch (err) {
            console.error("Erreur suppression:", err);
            setError("Erreur lors de la suppression de l'étudiant");
        }
    };
    
    // Fonction pour obtenir l'icône selon le type de doublon
    const getIconForType = (type) => {
        switch(type) {
            case 'nom_prenom': return <FaUsers className="me-2" />;
            case 'cin': return <FaAddressCard className="me-2" />;
            case 'telephone': return <FaPhone className="me-2" />;
            default: return <FaList className="me-2" />;
        }
    };
    
    // Fonction pour obtenir la couleur selon le type de doublon
    const getBadgeColorForType = (type) => {
        switch(type) {
            case 'nom_prenom': return 'danger';
            case 'cin': return 'warning';
            case 'telephone': return 'info';
            default: return 'secondary';
        }
    };
    
    // Fonction pour obtenir le libellé selon le type de doublon
    const getTypeLabel = (type) => {
        switch(type) {
            case 'nom_prenom': return 'Nom-Prénom';
            case 'cin': return 'CIN';
            case 'telephone': return 'Téléphone';
            case 'multiple': return 'Multiples';
            default: return type;
        }
    };
    
    // Statistiques globales
    const stats = {
        totalDoublonsNomPrenom: doublons.nomPrenom.length,
        totalDoublonsCIN: doublons.cin.length,
        totalDoublonsTelephone: doublons.telephone.length,
        totalEtudiantsEnDoublon: new Set(
            [...doublons.nomPrenom, ...doublons.cin, ...doublons.telephone]
                .flatMap(d => d.etudiants.map(e => e.id))
        ).size,
        doublonsParType: {
            nomPrenom: doublons.nomPrenom.reduce((sum, d) => sum + d.count, 0),
            cin: doublons.cin.reduce((sum, d) => sum + d.count, 0),
            telephone: doublons.telephone.reduce((sum, d) => sum + d.count, 0)
        }
    };

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* En-tête */}
            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-danger">
                        <FaExclamationTriangle className="me-2" />
                        Détection des Doublons
                    </h1>
                    <p className="text-muted">
                        Identification des étudiants en double selon différents critères
                    </p>
                </div>
            </div>
            
            {/* Onglets */}
            <Card className="mb-4 shadow-sm">
                <Card.Body className="p-0">
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => {
                            setActiveTab(k);
                            setCurrentPage(1);
                            setSelectedDoublon(null);
                        }}
                        className="mb-3"
                    >
                        <Tab
                            eventKey="nomPrenom"
                            title={
                                <>
                                    <FaUsers className="me-1" />
                                    Doublons Nom-Prénom
                                    {doublons.nomPrenom.length > 0 && (
                                        <Badge bg="danger" className="ms-2">
                                            {doublons.nomPrenom.length}
                                        </Badge>
                                    )}
                                </>
                            }
                        />
                        
                        <Tab
                            eventKey="cin"
                            title={
                                <>
                                    <FaAddressCard className="me-1" />
                                    Doublons CIN
                                    {doublons.cin.length > 0 && (
                                        <Badge bg="warning" className="ms-2">
                                            {doublons.cin.length}
                                        </Badge>
                                    )}
                                </>
                            }
                        />
                        
                        <Tab
                            eventKey="telephone"
                            title={
                                <>
                                    <FaPhone className="me-1" />
                                    Doublons Téléphone
                                    {doublons.telephone.length > 0 && (
                                        <Badge bg="info" className="ms-2">
                                            {doublons.telephone.length}
                                        </Badge>
                                    )}
                                </>
                            }
                        />
                        
                        <Tab
                            eventKey="all"
                            title={
                                <>
                                    <FaList className="me-1" />
                                    Tous les Doublons
                                    {doublons.all.length > 0 && (
                                        <Badge bg="secondary" className="ms-2">
                                            {doublons.all.length}
                                        </Badge>
                                    )}
                                </>
                            }
                        />
                    </Tabs>
                </Card.Body>
            </Card>

            {/* Barre de contrôle */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3 align-items-center">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Rechercher</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light">
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder={`Rechercher par ${getTypeLabel(activeTab === 'nomPrenom' ? 'nom_prenom' : activeTab)}...`}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
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
                    <Button variant="outline-danger" onClick={fetchAllData}>
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
                    <p className="mt-3 text-muted">Recherche des doublons...</p>
                </div>
            ) : filteredDoublons.length === 0 ? (
                <Alert variant="success">
                    <Alert.Heading>
                        <FaUser className="me-2" />
                        Aucun doublon détecté
                    </Alert.Heading>
                    <p className="mb-0">
                        {searchTerm ? 
                            `Aucun doublon trouvé pour "${searchTerm}"` :
                            `Félicitations ! Aucun doublon de ${getTypeLabel(activeTab === 'nomPrenom' ? 'nom_prenom' : activeTab)} détecté.`
                        }
                    </p>
                </Alert>
            ) : (
                <>
                    {/* Liste des doublons */}
                    <div className="row">
                        <div className="col-md-12">
                            <Card className="shadow-sm">
                                <Card.Header className="bg-light">
                                    <h5 className="mb-0">
                                        {getCurrentDoublons().length} doublon{getCurrentDoublons().length > 1 ? 's' : ''} détecté{getCurrentDoublons().length > 1 ? 's' : ''}
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <div className="table-responsive">
                                        <Table hover className="mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th width="5%">#</th>
                                                    <th width="25%">
                                                        {activeTab === 'all' ? 'Étudiant' : 'Valeur en double'}
                                                    </th>
                                                    <th width="10%">Type</th>
                                                    <th width="10%">Nombre</th>
                                                    <th width="30%">
                                                        {activeTab === 'all' ? 'Causes' : 'Détails'}
                                                    </th>
                                                    <th width="20%">Matricules</th>
                                                    <th width="10%">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentDoublons.map((doublon, index) => (
                                                    <React.Fragment key={`${doublon.cle}-${index}`}>
                                                        <tr
                                                            onClick={() => handleSelectDoublon(doublon)}
                                                            style={{ cursor: 'pointer' }}
                                                            className={selectedDoublon?.cle === doublon.cle ? 'table-warning' : ''}
                                                        >
                                                            <td className="text-center">{indexOfFirstItem + index + 1}</td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    {getIconForType(doublon.type)}
                                                                    <strong>{doublon.valeur}</strong>
                                                                </div>
                                                                {activeTab === 'all' && (
                                                                    <small className="text-muted d-block">
                                                                        {doublon.etudiants[0]?.nom} {doublon.etudiants[0]?.prenom}
                                                                    </small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Badge bg={getBadgeColorForType(doublon.type)}>
                                                                    {getTypeLabel(doublon.type)}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Badge bg="secondary" className="px-3 py-2">
                                                                    {doublon.count}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <small className="text-muted">
                                                                    {doublon.details}
                                                                </small>
                                                            </td>
                                                            <td>
                                                                <div className="font-monospace small">
                                                                    {doublon.etudiants.slice(0, 2).map(e => e.matricule).join(', ')}
                                                                    {doublon.etudiants.length > 2 && '...'}
                                                                </div>
                                                            </td>
                                                            <td className="text-center">
                                                                <Button
                                                                    variant={selectedDoublon?.cle === doublon.cle ? "warning" : "outline-warning"}
                                                                    size="sm"
                                                                    title="Voir les détails"
                                                                >
                                                                    <FaEye />
                                                                </Button>
                                                            </td>
                                                        </tr>

                                                        {/* Détails du doublon sélectionné */}
                                                        {selectedDoublon?.cle === doublon.cle && (
                                                            <tr>
                                                                <td colSpan="7" className="bg-light">
                                                                    <Card className="border-0 bg-transparent">
                                                                        <Card.Body>
                                                                            <h6 className="mb-3">
                                                                                <FaExclamationTriangle className="me-2 text-danger" />
                                                                                Détails des étudiants concernés
                                                                            </h6>
                                                                            <div className="table-responsive">
                                                                                <Table striped bordered hover size="sm">
                                                                                    <thead className={`table-${getBadgeColorForType(doublon.type)}`}>
                                                                                        <tr>
                                                                                            <th>#</th>
                                                                                            <th>Matricule</th>
                                                                                            <th>Nom et Prénom</th>
                                                                                            <th>CIN</th>
                                                                                            <th>Téléphone</th>
                                                                                            <th>Faculté</th>
                                                                                            <th>Niveau</th>
                                                                                            <th>Boursier</th>
                                                                                            <th>Actions</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {doublon.etudiants.map((etudiant, idx) => (
                                                                                            <tr key={idx}>
                                                                                                <td>{idx + 1}</td>
                                                                                                <td className="font-monospace">{etudiant.matricule}</td>
                                                                                                <td>
                                                                                                    <strong>{etudiant.nom} {etudiant.prenom}</strong>
                                                                                                </td>
                                                                                                <td>
                                                                                                    <Badge bg={etudiant.cin ? 'info' : 'secondary'}>
                                                                                                        {etudiant.cin || 'Non renseigné'}
                                                                                                    </Badge>
                                                                                                </td>
                                                                                                <td>
                                                                                                    <Badge bg={etudiant.telephone ? 'success' : 'secondary'}>
                                                                                                        {etudiant.telephone || 'Non renseigné'}
                                                                                                    </Badge>
                                                                                                </td>
                                                                                                <td>
                                                                                                    {etudiant.faculte_nom || '-'}
                                                                                                </td>
                                                                                                <td>
                                                                                                    <Badge bg="primary">{etudiant.niveau}</Badge>
                                                                                                </td>
                                                                                                <td>
                                                                                                    <Badge bg={etudiant.boursier === 'OUI' ? 'success' : 'secondary'}>
                                                                                                        {etudiant.boursier}
                                                                                                    </Badge>
                                                                                                </td>
                                                                                                <td>
                                                                                                    <div className="d-flex gap-1">
                                                                                                        <Button
                                                                                                            variant="outline-info"
                                                                                                            size="sm"
                                                                                                            title="Voir fiche complète"
                                                                                                            onClick={() => window.open(`/etudiants/${etudiant.id}`, '_blank')}
                                                                                                        >
                                                                                                            <FaIdCard />
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                            variant="outline-danger"
                                                                                                            size="sm"
                                                                                                            title="Supprimer cet étudiant"
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                handleDeleteClick(etudiant);
                                                                                                            }}
                                                                                                        >
                                                                                                            <FaTrash />
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </Table>
                                                                            </div>
                                                                            <div className="mt-3 p-3 bg-warning bg-opacity-10 border-start border-warning border-5">
                                                                                <small className="text-dark">
                                                                                    <strong>Cause du doublon :</strong> {doublon.details}
                                                                                </small>
                                                                            </div>
                                                                        </Card.Body>
                                                                    </Card>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
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
                                    } else if (
                                        pageNumber === currentPage - 3 ||
                                        pageNumber === currentPage + 3
                                    ) {
                                        return <Pagination.Ellipsis key={pageNumber} />;
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

            {/* Modal de confirmation de suppression */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>
                        <FaExclamationTriangle className="me-2" />
                        Confirmer la suppression
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Êtes-vous sûr de vouloir supprimer l'étudiant <strong>{etudiantToDelete?.nom} {etudiantToDelete?.prenom}</strong> ?
                    </p>
                    <p className="text-danger">
                        <strong>Attention :</strong> Cette action est irréversible. L'étudiant sera définitivement supprimé de la base de données.
                    </p>
                    <div className="alert alert-warning">
                        <strong>Informations :</strong>
                        <ul className="mb-0 mt-2">
                            <li>Matricule: {etudiantToDelete?.matricule}</li>
                            <li>CIN: {etudiantToDelete?.cin || 'Non renseigné'}</li>
                            <li>Téléphone: {etudiantToDelete?.telephone || 'Non renseigné'}</li>
                            <li>Faculté: {etudiantToDelete?.faculte_nom || 'Non renseignée'}</li>
                        </ul>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Annuler
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        <FaTrash className="me-2" />
                        Supprimer définitivement
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}