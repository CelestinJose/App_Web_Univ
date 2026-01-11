// src/pages/Mentions.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Alert, 
  Card, Spinner, InputGroup, Badge,
  Dropdown, Pagination, Row, Col,
  Breadcrumb, Tabs, Tab
} from 'react-bootstrap';
import { 
  FaGraduationCap, FaEdit, FaTrash, FaPlus, FaSearch, 
  FaSync, FaFilter, FaBook, FaUniversity, FaSort,
  FaList, FaInfoCircle, FaCalendarAlt,
  FaExclamationTriangle, FaArrowLeft
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Mentions() {
  const [mentions, setMentions] = useState([]);
  const [domaines, setDomaines] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomaine, setSelectedDomaine] = useState('');
  const [selectedFaculte, setSelectedFaculte] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' ou 'edit'
  const [mentionToDelete, setMentionToDelete] = useState(null);
  const [currentMention, setCurrentMention] = useState({
    id: null,
    code: '',
    nom: '',
    description: '',
    domaine: '',
    duree_etude: 3,
    statut: 'ACTIVE'
  });
  
  // États pour tri
  const [sortField, setSortField] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Tabs pour détails
  const [activeTab, setActiveTab] = useState('liste');
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Charger les mentions
  const fetchMentions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching mentions...');
      const response = await api.get('/mentions/');
      
      const data = response.data;
      let mentionsArray = [];
      
      if (data && data.results && Array.isArray(data.results)) {
        mentionsArray = data.results;
      } else if (Array.isArray(data)) {
        mentionsArray = data;
      } else if (data && typeof data === 'object') {
        const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          mentionsArray = possibleArrays[0];
        } else if (data.id !== undefined) {
          mentionsArray = [data];
        } else {
          mentionsArray = Object.values(data);
        }
      }
      
      if (!Array.isArray(mentionsArray)) {
        console.error('Format de données invalide pour mentions:', data);
        mentionsArray = [];
      }
      
      console.log(`Mentions chargées: ${mentionsArray.length} éléments`);
      setMentions(mentionsArray);
    } catch (err) {
      console.error('Erreur chargement mentions:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors du chargement des mentions';
      setError(`Erreur: ${errorMessage}`);
      setMentions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les domaines et facultés
  const fetchReferences = async () => {
    setLoadingReferences(true);
    try {
      console.log('Fetching références...');
      const [domainesRes, facultesRes] = await Promise.all([
        api.get('/domaines/'),
        api.get('/facultes/')
      ]);
      
      // Gestion des domaines
      const domainesData = domainesRes.data;
      let domainesArray = [];
      
      if (domainesData && domainesData.results && Array.isArray(domainesData.results)) {
        domainesArray = domainesData.results;
      } else if (Array.isArray(domainesData)) {
        domainesArray = domainesData;
      } else if (domainesData && typeof domainesData === 'object') {
        const possibleArrays = Object.values(domainesData).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          domainesArray = possibleArrays[0];
        } else if (domainesData.id !== undefined) {
          domainesArray = [domainesData];
        } else {
          domainesArray = Object.values(domainesData);
        }
      }
      
      if (!Array.isArray(domainesArray)) {
        console.error('Format de données invalide pour domaines:', domainesData);
        domainesArray = [];
      }
      
      // Gestion des facultés
      const facultesData = facultesRes.data;
      let facultesArray = [];
      
      if (facultesData && facultesData.results && Array.isArray(facultesData.results)) {
        facultesArray = facultesData.results;
      } else if (Array.isArray(facultesData)) {
        facultesArray = facultesData;
      } else if (facultesData && typeof facultesData === 'object') {
        const possibleArrays = Object.values(facultesData).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          facultesArray = possibleArrays[0];
        } else if (facultesData.id !== undefined) {
          facultesArray = [facultesData];
        } else {
          facultesArray = Object.values(facultesData);
        }
      }
      
      if (!Array.isArray(facultesArray)) {
        console.error('Format de données invalide pour facultés:', facultesData);
        facultesArray = [];
      }
      
      console.log(`Domaines chargés: ${domainesArray.length} éléments`);
      console.log(`Facultés chargées: ${facultesArray.length} éléments`);
      
      setDomaines(domainesArray);
      setFacultes(facultesArray);
    } catch (err) {
      console.error('Erreur chargement références:', err);
      setDomaines([]);
      setFacultes([]);
    } finally {
      setLoadingReferences(false);
    }
  };
  
  useEffect(() => {
    fetchMentions();
    fetchReferences();
    
    // Vérifier si un domaine est spécifié dans l'URL
    const params = new URLSearchParams(location.search);
    const domaineId = params.get('domaine');
    if (domaineId) {
      setSelectedDomaine(domaineId);
    }
  }, [location]);
  
  // Ouvrir modal pour ajouter
  const handleAdd = () => {
    const defaultDomaine = Array.isArray(domaines) && domaines.length > 0 ? domaines[0].id : '';
    setCurrentMention({
      id: null,
      code: '',
      nom: '',
      description: '',
      domaine: defaultDomaine,
      duree_etude: 3,
      statut: 'ACTIVE'
    });
    setModalMode('add');
    setShowModal(true);
  };
  
  // Ouvrir modal pour modifier
  const handleEdit = (mention) => {
    setCurrentMention({
      id: mention.id,
      code: mention.code || '',
      nom: mention.nom || '',
      description: mention.description || '',
      domaine: mention.domaine || '',
      duree_etude: mention.duree_etude || 3,
      statut: mention.statut || 'ACTIVE'
    });
    setModalMode('edit');
    setShowModal(true);
  };
  
  // Sauvegarder (ajout ou modification)
  const handleSave = async () => {
    // Validation
    if (!currentMention.code.trim()) {
      setError('Le code est requis');
      return;
    }
    if (!currentMention.nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!currentMention.domaine) {
      setError('Veuillez sélectionner un domaine');
      return;
    }
    
    try {
      if (modalMode === 'add') {
        await api.post('/mentions/', currentMention);
      } else {
        await api.put(`/mentions/${currentMention.id}/`, currentMention);
      }
      fetchMentions();
      setShowModal(false);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data || 'Erreur lors de la sauvegarde';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };
  
  // Supprimer une mention
  // Ouvrir la modale de suppression
  const handleDeleteOpen = (mention) => {
    setMentionToDelete(mention);
    setShowDeleteModal(true);
  };

  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    if (!mentionToDelete) return;
    try {
      await api.delete(`/mentions/${mentionToDelete.id}/`);
      fetchMentions();
      setShowDeleteModal(false);
      setError('');
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };
  
  // Filtrer les mentions avec vérification
  const filteredMentions = Array.isArray(mentions) 
    ? mentions.filter(mention => {
        if (!mention) return false;
        
        const matchesSearch = searchTerm === '' ||
          (mention.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (mention.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (mention.description && mention.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesDomaine = selectedDomaine === '' || 
          mention.domaine === parseInt(selectedDomaine) ||
          mention.domaine === selectedDomaine;
        
        const matchesStatut = selectedStatut === '' || mention.statut === selectedStatut;
        
        // Filtrer par faculté si sélectionné
        if (selectedFaculte !== '') {
          const domaine = Array.isArray(domaines) ? domaines.find(d => d.id === mention.domaine) : null;
          if (!domaine || domaine.faculte !== parseInt(selectedFaculte)) {
            return false;
          }
        }
        
        return matchesSearch && matchesDomaine && matchesStatut;
      })
    : [];
  
  // Trier les mentions avec vérification
  const sortedMentions = Array.isArray(filteredMentions) 
    ? [...filteredMentions].sort((a, b) => {
        if (sortField === 'domaine_nom' || sortField === 'faculte_nom') {
          const domaineA = Array.isArray(domaines) ? domaines.find(d => d.id === a.domaine) : null;
          const domaineB = Array.isArray(domaines) ? domaines.find(d => d.id === b.domaine) : null;
          
          if (!domaineA || !domaineB) return 0;
          
          if (sortField === 'faculte_nom') {
            const faculteA = Array.isArray(facultes) ? facultes.find(f => f.id === domaineA.faculte) : null;
            const faculteB = Array.isArray(facultes) ? facultes.find(f => f.id === domaineB.faculte) : null;
            const nomA = faculteA ? (faculteA.nom || '') : '';
            const nomB = faculteB ? (faculteB.nom || '') : '';
            return sortDirection === 'asc' ? nomA.localeCompare(nomB) : nomB.localeCompare(nomA);
          } else {
            return sortDirection === 'asc' 
              ? (domaineA.nom || '').localeCompare(domaineB.nom || '') 
              : (domaineB.nom || '').localeCompare(domaineA.nom || '');
          }
        }
        
        if (sortField === 'duree_etude') {
          const aValue = a[sortField] || 0;
          const bValue = b[sortField] || 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      })
    : [];
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(sortedMentions) 
    ? sortedMentions.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil((Array.isArray(sortedMentions) ? sortedMentions.length : 0) / itemsPerPage);
  
  // Changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDomaine('');
    setSelectedFaculte('');
    setSelectedStatut('');
    setCurrentPage(1);
  };
  
  // Obtenir les informations du domaine et faculté
  const getDomaineInfo = (domaineId) => {
    const domaine = Array.isArray(domaines) ? domaines.find(d => d.id === domaineId) : null;
    if (!domaine) return { domaineNom: 'N/A', domaineCode: 'N/A', faculteNom: 'N/A', faculteCode: 'N/A' };
    
    const faculte = Array.isArray(facultes) ? facultes.find(f => f.id === domaine.faculte) : null;
    return {
      domaineNom: domaine.nom || 'N/A',
      domaineCode: domaine.code || 'N/A',
      faculteNom: faculte ? (faculte.nom || 'N/A') : 'N/A',
      faculteCode: faculte ? (faculte.code || 'N/A') : 'N/A'
    };
  };
  
  // Gestion du tri
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Statistiques
  const stats = {
    total: Array.isArray(mentions) ? mentions.length : 0,
    actifs: Array.isArray(mentions) ? mentions.filter(m => m && m.statut === 'ACTIVE').length : 0,
    inactifs: Array.isArray(mentions) ? mentions.filter(m => m && m.statut === 'INACTIVE').length : 0,
    parNiveau: {
      licence: Array.isArray(mentions) ? mentions.filter(m => m && (m.duree_etude || 3) === 3).length : 0,
      master: Array.isArray(mentions) ? mentions.filter(m => m && (m.duree_etude || 3) > 3).length : 0
    }
  };
  
  return (
    <div className="container-fluid py-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item href="/dashboard">Accueil</Breadcrumb.Item>
        <Breadcrumb.Item href="/parametres-academiques">Paramètres Académiques</Breadcrumb.Item>
        <Breadcrumb.Item active>Gestion des Mentions</Breadcrumb.Item>
      </Breadcrumb>
      
      <h2 className="mb-4">
        <FaGraduationCap className="me-2 text-primary" />
        Gestion des Mentions
      </h2>
      
      {/* Bouton retour si domaine spécifié */}
      {selectedDomaine && (
        <Button 
          variant="outline-secondary" 
          size="sm" 
          className="mb-3"
          onClick={() => {
            setSelectedDomaine('');
            resetFilters();
          }}
        >
          <FaArrowLeft className="me-1" />
          Retour à toutes les mentions
        </Button>
      )}
      
      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="liste" title={<><FaList className="me-1" /> Liste des mentions</>}>
          {/* Statistiques */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-primary shadow-sm">
                <Card.Body className="p-3">
                  <Card.Title className="text-primary h6 mb-2">Total Mentions</Card.Title>
                  <div className="h2 text-primary">{stats.total}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-success shadow-sm">
                <Card.Body className="p-3">
                  <Card.Title className="text-success h6 mb-2">Mentions Actives</Card.Title>
                  <div className="h2 text-success">{stats.actifs}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-warning shadow-sm">
                <Card.Body className="p-3">
                  <Card.Title className="text-warning h6 mb-2">Mentions Inactives</Card.Title>
                  <div className="h2 text-warning">{stats.inactifs}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-info shadow-sm">
                <Card.Body className="p-3">
                  <Card.Title className="text-info h6 mb-2">Actions</Card.Title>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleAdd}
                    disabled={!Array.isArray(domaines) || domaines.length === 0}
                  >
                    <FaPlus className="me-1" /> Nouvelle mention
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              <Alert.Heading>
                <FaExclamationTriangle className="me-2" />
                Erreur
              </Alert.Heading>
              <p>{error}</p>
            </Alert>
          )}
          
          {/* Message si pas de domaines */}
          {!loadingReferences && (!Array.isArray(domaines) || domaines.length === 0) && (
            <Alert variant="warning" className="mb-4">
              <FaInfoCircle className="me-2" />
              <strong>Aucun domaine disponible.</strong> Vous devez d'abord créer des domaines.
              <Button 
                variant="outline-warning" 
                size="sm" 
                className="ms-3"
                onClick={() => navigate('/domaines')}
              >
                <FaBook className="me-1" />
                Créer un domaine
              </Button>
            </Alert>
          )}
          
          {/* Barre de filtres */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Recherche</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Nom, code, description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={!Array.isArray(mentions) || mentions.length === 0}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Domaine</Form.Label>
                    <Form.Select
                      value={selectedDomaine}
                      onChange={(e) => setSelectedDomaine(e.target.value)}
                      disabled={!Array.isArray(domaines) || domaines.length === 0}
                    >
                      <option value="">Tous les domaines</option>
                      {Array.isArray(domaines) && domaines.map(domaine => (
                        <option key={domaine.id} value={domaine.id}>
                          {domaine.code || ''} - {domaine.nom || ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Faculté</Form.Label>
                    <Form.Select
                      value={selectedFaculte}
                      onChange={(e) => setSelectedFaculte(e.target.value)}
                      disabled={!Array.isArray(facultes) || facultes.length === 0}
                    >
                      <option value="">Toutes les facultés</option>
                      {Array.isArray(facultes) && facultes.map(faculte => (
                        <option key={faculte.id} value={faculte.id}>
                          {faculte.code || ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      value={selectedStatut}
                      onChange={(e) => setSelectedStatut(e.target.value)}
                      disabled={!Array.isArray(mentions) || mentions.length === 0}
                    >
                      <option value="">Tous les statuts</option>
                      <option value="ACTIVE">Actif</option>
                      <option value="INACTIVE">Inactif</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={2} className="d-flex align-items-end">
                  <div className="d-flex gap-2 w-100">
                    <Button 
                      variant="outline-secondary" 
                      onClick={resetFilters}
                      className="flex-grow-1"
                      disabled={!Array.isArray(mentions) || mentions.length === 0}
                    >
                      <FaFilter className="me-1" /> Réinitialiser
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      onClick={fetchMentions}
                      title="Actualiser"
                      disabled={loading}
                    >
                      <FaSync />
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Tableau des mentions */}
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Chargement des mentions...</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table striped hover className="mb-0">
                      <thead className="table-primary text-dark">
                        <tr>
                          <th style={{ width: '5%' }}>#</th>
                          <th style={{ width: '10%' }}>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('code')}
                              disabled={!Array.isArray(sortedMentions) || sortedMentions.length === 0}
                            >
                              Code <FaSort />
                            </Button>
                          </th>
                          <th style={{ width: '25%' }}>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('nom')}
                              disabled={!Array.isArray(sortedMentions) || sortedMentions.length === 0}
                            >
                              Mention <FaSort />
                            </Button>
                          </th>
                          <th style={{ width: '20%' }}>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('domaine_nom')}
                              disabled={!Array.isArray(sortedMentions) || sortedMentions.length === 0}
                            >
                            Domaine <FaSort />
                            </Button>
                          </th>
                          <th style={{ width: '15%' }}>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('faculte_nom')}
                              disabled={!Array.isArray(sortedMentions) || sortedMentions.length === 0}
                            >
                               Faculté <FaSort />
                            </Button>
                          </th>
                          <th style={{ width: '10%' }}>
                            <Button 
                              variant="link" 
                              className="p-0 text-dark text-decoration-none"
                              onClick={() => handleSort('duree_etude')}
                              disabled={!Array.isArray(sortedMentions) || sortedMentions.length === 0}
                            >
                           Durée <FaSort />
                            </Button>
                          </th>
                          <th style={{ width: '10%' }}>Statut</th>
                          <th style={{ width: '15%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(currentItems) && currentItems.map((mention, index) => {
                          const { domaineNom, domaineCode, faculteNom, faculteCode } = getDomaineInfo(mention.domaine);
                          
                          return (
                            <tr key={mention.id || `mention-${index}`}>
                              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td>
                                <strong className="text-primary">{mention.code || 'N/A'}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{mention.nom || 'N/A'}</strong>
                                  {mention.description && (
                                    <div className="small text-muted">
                        
                                      {mention.description.length > 40 
                                        ? `${mention.description.substring(0, 40)}...` 
                                        : mention.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                 
                                  <div>
                                    <div><strong>{domaineCode}</strong></div>
                                    <div className="small">{domaineNom}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  
                                  <div>
                                    <div><strong>{faculteCode}</strong></div>
                                    <div className="small">{faculteNom}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="info">
                                 
                                  {mention.duree_etude || 3} an(s)
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={mention.statut === 'ACTIVE' ? 'success' : 'secondary'}>
                                  {mention.statut === 'ACTIVE' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => handleEdit(mention)}
                                    title="Modifier"
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteOpen(mention)}
                                    title="Supprimer"
                                    disabled={!mention.id}
                                  >
                                    <FaTrash />
                                  </Button>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    title="Détails"
                                    onClick={() => setActiveTab('details')}
                                  >
                                    Détails
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                  
                  {(!Array.isArray(currentItems) || currentItems.length === 0) && !loading && (
                    <div className="text-center py-5">
                      <p className="text-muted">
                        {searchTerm || selectedDomaine || selectedFaculte || selectedStatut
                          ? `Aucune mention trouvée avec ces critères`
                          : "Aucune mention disponible"}
                      </p>
                      {!searchTerm && !selectedDomaine && !selectedFaculte && !selectedStatut && (
                        <Button 
                          variant="primary" 
                          onClick={handleAdd}
                          disabled={!Array.isArray(domaines) || domaines.length === 0}
                        >
                          <FaPlus className="me-2" />
                          Créer la première mention
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3 p-3 border-top">
                      <Pagination>
                        <Pagination.First 
                          onClick={() => paginate(1)} 
                          disabled={currentPage === 1} 
                        />
                        <Pagination.Prev 
                          onClick={() => paginate(currentPage - 1)} 
                          disabled={currentPage === 1} 
                        />
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <Pagination.Item
                                key={pageNumber}
                                active={pageNumber === currentPage}
                                onClick={() => paginate(pageNumber)}
                              >
                                {pageNumber}
                              </Pagination.Item>
                            );
                          }
                          return null;
                        })}
                        
                        <Pagination.Next 
                          onClick={() => paginate(currentPage + 1)} 
                          disabled={currentPage === totalPages} 
                        />
                        <Pagination.Last 
                          onClick={() => paginate(totalPages)} 
                          disabled={currentPage === totalPages} 
                        />
                      </Pagination>
                    </div>
                  )}
                  
                  {/* Résumé */}
                  <div className="p-3 border-top bg-light">
                    <small className="text-muted">
                      Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, (Array.isArray(sortedMentions) ? sortedMentions.length : 0))} 
                      {' '}sur {Array.isArray(sortedMentions) ? sortedMentions.length : 0} mention{(Array.isArray(sortedMentions) && sortedMentions.length > 1) ? 's' : ''}
                    </small>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="details" title={<><FaInfoCircle className="me-1" /> Détails par faculté</>}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-4">Répartition des mentions par faculté</h5>
              {loadingReferences ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Chargement des données...</p>
                </div>
              ) : (
                <Row>
                  {Array.isArray(facultes) && facultes.map(faculte => {
                    const domainesFaculte = Array.isArray(domaines) ? domaines.filter(d => d.faculte === faculte.id) : [];
                    const mentionsFaculte = Array.isArray(mentions) ? mentions.filter(m => 
                      domainesFaculte.some(d => d.id === m.domaine)
                    ) : [];
                    
                    if (mentionsFaculte.length === 0) return null;
                    
                    return (
                      <Col md={6} lg={4} key={faculte.id} className="mb-4">
                        <Card>
                          <Card.Header className="bg-primary text-white">
                            <h6 className="mb-0">
                              <FaUniversity className="me-2" />
                              {faculte.code || ''} - {faculte.nom || ''}
                            </h6>
                          </Card.Header>
                          <Card.Body>
                            <div className="mb-3">
                              <Badge bg="info" className="me-2">
                                {mentionsFaculte.length} mention{mentionsFaculte.length > 1 ? 's' : ''}
                              </Badge>
                              <Badge bg="success">
                                {mentionsFaculte.filter(m => m.statut === 'ACTIVE').length} active{mentionsFaculte.filter(m => m.statut === 'ACTIVE').length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            <div className="small">
                              {domainesFaculte.map(domaine => {
                                const mentionsDomaine = mentionsFaculte.filter(m => m.domaine === domaine.id);
                                if (mentionsDomaine.length === 0) return null;
                                
                                return (
                                  <div key={domaine.id} className="mb-3">
                                    <div className="fw-bold text-secondary">
                                      <FaBook className="me-1" />
                                      {domaine.code || ''} - {domaine.nom || ''}
                                    </div>
                                    <ul className="list-unstyled ms-3 mt-1">
                                      {mentionsDomaine.map(mention => (
                                        <li key={mention.id} className="mb-1">
                                          <FaGraduationCap className="me-2 text-success" />
                                          {mention.code || ''} - {mention.nom || ''}
                                          <Badge bg="light" text="dark" className="ms-2">
                                            {mention.duree_etude || 3} an(s)
                                          </Badge>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              })}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    );
                  })}
                  
                  {(!Array.isArray(facultes) || facultes.length === 0) && !loadingReferences && (
                    <div className="text-center py-5 w-100">
                      <p className="text-muted">Aucune faculté disponible</p>
                    </div>
                  )}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Modal pour ajouter/modifier */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className={modalMode === 'add' ? "bg-primary text-white" : "bg-success text-white"}>
          <Modal.Title>
            {modalMode === 'add' ? 'Ajouter une Mention' : 'Modifier la Mention'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code de la Mention *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentMention.code}
                    onChange={(e) => setCurrentMention({...currentMention, code: e.target.value})}
                    placeholder="Ex: INFO-L, MATH-M, LETT-L"
                    required
                  />
                  <Form.Text className="text-muted">
                    Code unique (ex: INFO-L pour Informatique Licence)
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select
                    value={currentMention.statut}
                    onChange={(e) => setCurrentMention({...currentMention, statut: e.target.value})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Nom de la Mention *</Form.Label>
              <Form.Control
                type="text"
                value={currentMention.nom}
                onChange={(e) => setCurrentMention({...currentMention, nom: e.target.value})}
                placeholder="Ex: Informatique, Mathématiques Appliquées, Lettres Modernes"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Domaine *</Form.Label>
              {loadingReferences ? (
                <div className="text-center py-2">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Chargement des domaines...</span>
                </div>
              ) : (
                <Form.Select
                  value={currentMention.domaine}
                  onChange={(e) => setCurrentMention({...currentMention, domaine: e.target.value})}
                  required
                  disabled={!Array.isArray(domaines) || domaines.length === 0}
                >
                  <option value="">Sélectionner un domaine</option>
                  {Array.isArray(domaines) && domaines.map(domaine => {
                    const faculte = Array.isArray(facultes) ? facultes.find(f => f.id === domaine.faculte) : null;
                    return (
                      <option key={domaine.id} value={domaine.id}>
                        {domaine.code || ''} - {domaine.nom || ''} 
                        {faculte && ` (${faculte.code || ''})`}
                      </option>
                    );
                  })}
                </Form.Select>
              )}
              {!loadingReferences && (!Array.isArray(domaines) || domaines.length === 0) && (
                <Form.Text className="text-danger">
                  <FaExclamationTriangle className="me-1" />
                  Aucun domaine disponible. Créez d'abord un domaine.
                </Form.Text>
              )}
            </Form.Group>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaCalendarAlt className="me-1" />
                    Durée d'étude (années)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="5"
                    value={currentMention.duree_etude}
                    onChange={(e) => setCurrentMention({...currentMention, duree_etude: parseInt(e.target.value) || 3})}
                  />
                  <Form.Text className="text-muted">
                    Licence: 3 ans, Master: 5 ans
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={currentMention.description}
                onChange={(e) => setCurrentMention({...currentMention, description: e.target.value})}
                placeholder="Description de la mention (objectifs, compétences, débouchés professionnels, programme...)"
              />
              <Form.Text className="text-muted">
                Décrivez les objectifs pédagogiques et les débouchés professionnels
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button 
            variant={modalMode === 'add' ? "primary" : "success"}
            onClick={handleSave}
            disabled={!Array.isArray(domaines) || domaines.length === 0}
          >
            {modalMode === 'add' ? 'Créer la mention' : 'Modifier la mention'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FaExclamationTriangle className="me-2" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {mentionToDelete && (
            <div>
              <p className="text-danger fw-bold mb-3">
                Êtes-vous sûr de vouloir supprimer cette mention ?
              </p>
              <div className="bg-light p-3 rounded">
                <p className="mb-1">
                  <strong>Code:</strong> {mentionToDelete.code}
                </p>
                <p className="mb-1">
                  <strong>Nom:</strong> {mentionToDelete.nom}
                </p>
                {mentionToDelete.description && (
                  <p className="mb-1">
                    <strong>Description:</strong> {mentionToDelete.description.substring(0, 100)}...
                  </p>
                )}
                <p className="mb-0">
                  <strong>Durée d'étude:</strong> {mentionToDelete.duree_etude} an(s)
                </p>
              </div>
              <p className="text-muted mt-3 small">
                Cette action ne peut pas être annulée.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
          >
            <FaTrash className="me-2" />
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}