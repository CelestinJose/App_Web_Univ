// src/pages/Domaines.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Alert, 
  Card, Spinner, InputGroup, Badge,
  Dropdown, Pagination, Row, Col
} from 'react-bootstrap';
import { 
  FaBook, FaEdit, FaTrash, FaPlus, FaSearch, 
  FaSync, FaFilter, FaUniversity, FaSort,
  FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
import api from '../api';

export default function Domaines() {
  const [domaines, setDomaines] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFacultes, setLoadingFacultes] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculte, setSelectedFaculte] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' ou 'edit'
  const [currentDomaine, setCurrentDomaine] = useState({
    id: null,
    code: '',
    nom: '',
    description: '',
    faculte: '',
    statut: 'ACTIVE'
  });
  
  // États pour tri
  const [sortField, setSortField] = useState('nom');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Charger les domaines
  const fetchDomaines = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching domaines...');
      const response = await api.get('/domaines/');
      
      const data = response.data;
      let domainesArray = [];
      
      if (data && data.results && Array.isArray(data.results)) {
        domainesArray = data.results;
      } else if (Array.isArray(data)) {
        domainesArray = data;
      } else if (data && typeof data === 'object') {
        const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          domainesArray = possibleArrays[0];
        } else if (data.id !== undefined) {
          domainesArray = [data];
        } else {
          domainesArray = Object.values(data);
        }
      }
      
      if (!Array.isArray(domainesArray)) {
        console.error('Format de données invalide pour domaines:', data);
        domainesArray = [];
      }
      
      console.log(`Domaines chargés: ${domainesArray.length} éléments`);
      setDomaines(domainesArray);
    } catch (err) {
      console.error('Erreur chargement domaines:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors du chargement des domaines';
      setError(`Erreur: ${errorMessage}`);
      setDomaines([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Charger les facultés pour le select
  const fetchFacultes = async () => {
    setLoadingFacultes(true);
    try {
      console.log('Fetching facultes pour domaines...');
      const response = await api.get('/facultes/');
      
      const data = response.data;
      let facultesArray = [];
      
      if (data && data.results && Array.isArray(data.results)) {
        facultesArray = data.results;
      } else if (Array.isArray(data)) {
        facultesArray = data;
      } else if (data && typeof data === 'object') {
        const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          facultesArray = possibleArrays[0];
        } else if (data.id !== undefined) {
          facultesArray = [data];
        } else {
          facultesArray = Object.values(data);
        }
      }
      
      if (!Array.isArray(facultesArray)) {
        console.error('Format de données invalide pour facultes:', data);
        facultesArray = [];
      }
      
      console.log(`Facultés chargées pour select: ${facultesArray.length} éléments`);
      setFacultes(facultesArray);
    } catch (err) {
      console.error('Erreur chargement facultés:', err);
      setFacultes([]);
    } finally {
      setLoadingFacultes(false);
    }
  };
  
  useEffect(() => {
    fetchDomaines();
    fetchFacultes();
  }, []);
  
  // Ouvrir modal pour ajouter
  const handleAdd = () => {
    const defaultFaculte = Array.isArray(facultes) && facultes.length > 0 ? facultes[0].id : '';
    setCurrentDomaine({
      id: null,
      code: '',
      nom: '',
      description: '',
      faculte: defaultFaculte,
      statut: 'ACTIVE'
    });
    setModalMode('add');
    setShowModal(true);
  };
  
  // Ouvrir modal pour modifier
  const handleEdit = (domaine) => {
    setCurrentDomaine({
      id: domaine.id,
      code: domaine.code || '',
      nom: domaine.nom || '',
      description: domaine.description || '',
      faculte: domaine.faculte || '',
      statut: domaine.statut || 'ACTIVE'
    });
    setModalMode('edit');
    setShowModal(true);
  };
  
  // Sauvegarder (ajout ou modification)
  const handleSave = async () => {
    // Validation
    if (!currentDomaine.code.trim()) {
      setError('Le code est requis');
      return;
    }
    if (!currentDomaine.nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!currentDomaine.faculte) {
      setError('Veuillez sélectionner une faculté');
      return;
    }
    
    try {
      if (modalMode === 'add') {
        await api.post('/domaines/', currentDomaine);
      } else {
        await api.put(`/domaines/${currentDomaine.id}/`, currentDomaine);
      }
      fetchDomaines();
      setShowModal(false);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data || 'Erreur lors de la sauvegarde';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };
  
  // Supprimer un domaine
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce domaine ?')) {
      try {
        await api.delete(`/domaines/${id}/`);
        fetchDomaines();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };
  
  // Filtrer les domaines avec vérification
  const filteredDomaines = Array.isArray(domaines) 
    ? domaines.filter(domaine => {
        if (!domaine) return false;
        
        const matchesSearch = searchTerm === '' ||
          (domaine.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (domaine.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (domaine.description && domaine.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesFaculte = selectedFaculte === '' || 
          domaine.faculte === parseInt(selectedFaculte) ||
          domaine.faculte === selectedFaculte;
        
        const matchesStatut = selectedStatut === '' || domaine.statut === selectedStatut;
        
        return matchesSearch && matchesFaculte && matchesStatut;
      })
    : [];
  
  // Trier les domaines avec vérification
  const sortedDomaines = Array.isArray(filteredDomaines) 
    ? [...filteredDomaines].sort((a, b) => {
        if (sortField === 'faculte_nom') {
          const facA = Array.isArray(facultes) ? facultes.find(f => f.id === a.faculte)?.nom || '' : '';
          const facB = Array.isArray(facultes) ? facultes.find(f => f.id === b.faculte)?.nom || '' : '';
          return sortDirection === 'asc' ? facA.localeCompare(facB) : facB.localeCompare(facA);
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
  const currentItems = Array.isArray(sortedDomaines) 
    ? sortedDomaines.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil((Array.isArray(sortedDomaines) ? sortedDomaines.length : 0) / itemsPerPage);
  
  // Changer de page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFaculte('');
    setSelectedStatut('');
    setCurrentPage(1);
  };
  
  // Obtenir le nom de la faculté
  const getFaculteNom = (faculteId) => {
    if (!Array.isArray(facultes)) return 'N/A';
    const faculte = facultes.find(f => f.id === faculteId);
    return faculte ? `${faculte.code || ''} - ${faculte.nom || ''}` : 'N/A';
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
    total: Array.isArray(domaines) ? domaines.length : 0,
    actifs: Array.isArray(domaines) ? domaines.filter(d => d && d.statut === 'ACTIVE').length : 0,
    inactifs: Array.isArray(domaines) ? domaines.filter(d => d && d.statut === 'INACTIVE').length : 0
  };
  
  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">
        <FaBook className="me-2 text-primary" />
        Gestion des Domaines
      </h2>
      
      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-primary shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-primary h6 mb-2">Total Domaines</Card.Title>
              <div className="h2 text-primary">{stats.total}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-success shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-success h6 mb-2">Domaines Actifs</Card.Title>
              <div className="h2 text-success">{stats.actifs}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-warning h6 mb-2">Domaines Inactifs</Card.Title>
              <div className="h2 text-warning">{stats.inactifs}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-info h6 mb-2">Actions</Card.Title>
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <FaPlus className="me-1" /> Nouveau
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
      
      {/* Message si pas de facultés disponibles */}
      {!loadingFacultes && (!Array.isArray(facultes) || facultes.length === 0) && (
        <Alert variant="warning" className="mb-4">
          <FaInfoCircle className="me-2" />
          <strong>Aucune faculté disponible.</strong> Vous devez d'abord créer des facultés.
          <Button 
            variant="outline-warning" 
            size="sm" 
            className="ms-3"
            onClick={() => window.location.href = '/facultes'}
          >
            <FaUniversity className="me-1" />
            Créer une faculté
          </Button>
        </Alert>
      )}
      
      {/* Barre de filtres */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
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
                    disabled={!Array.isArray(domaines) || domaines.length === 0}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            
            <Col md={3}>
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
                      {faculte.code || ''} - {faculte.nom || ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={selectedStatut}
                  onChange={(e) => setSelectedStatut(e.target.value)}
                  disabled={!Array.isArray(domaines) || domaines.length === 0}
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
                  disabled={!Array.isArray(domaines) || domaines.length === 0}
                >
                  <FaFilter className="me-1" /> Réinitialiser
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={fetchDomaines}
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
      
      {/* Tableau des domaines */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des domaines...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover className="mb-0">
                  <thead className="table-primary">
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '15%' }}>
                        <Button 
                          variant="link" 
                          className="p-0 text-white text-decoration-none"
                          onClick={() => handleSort('code')}
                          disabled={!Array.isArray(sortedDomaines) || sortedDomaines.length === 0}
                        >
                          Code <FaSort />
                        </Button>
                      </th>
                      <th style={{ width: '25%' }}>
                        <Button 
                          variant="link" 
                          className="p-0 text-white text-decoration-none"
                          onClick={() => handleSort('nom')}
                          disabled={!Array.isArray(sortedDomaines) || sortedDomaines.length === 0}
                        >
                          Nom du Domaine <FaSort />
                        </Button>
                      </th>
                      <th style={{ width: '25%' }}>
                        <Button 
                          variant="link" 
                          className="p-0 text-white text-decoration-none"
                          onClick={() => handleSort('faculte_nom')}
                          disabled={!Array.isArray(sortedDomaines) || sortedDomaines.length === 0}
                        >
                          <FaUniversity className="me-1" /> Faculté <FaSort />
                        </Button>
                      </th>
                      <th style={{ width: '10%' }}>Statut</th>
                      <th style={{ width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentItems) && currentItems.map((domaine, index) => (
                      <tr key={domaine.id || `domaine-${index}`}>
                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>
                          <strong className="text-primary">{domaine.code || 'N/A'}</strong>
                        </td>
                        <td>
                          <div>
                            <strong>{domaine.nom || 'N/A'}</strong>
                            {domaine.description && (
                              <div className="small text-muted">
                                {domaine.description.length > 50 
                                  ? `${domaine.description.substring(0, 50)}...` 
                                  : domaine.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaUniversity className="me-2 text-secondary" />
                            <div>
                              <div>{getFaculteNom(domaine.faculte)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={domaine.statut === 'ACTIVE' ? 'success' : 'secondary'}>
                            {domaine.statut === 'ACTIVE' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleEdit(domaine)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(domaine.id)}
                              title="Supprimer"
                              disabled={!domaine.id}
                            >
                              <FaTrash />
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              title="Voir les mentions"
                              onClick={() => window.location.href = `/mentions?domaine=${domaine.id}`}
                              disabled={!domaine.id}
                            >
                              Voir mentions
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {(!Array.isArray(currentItems) || currentItems.length === 0) && !loading && (
                <div className="text-center py-5">
                  <p className="text-muted">
                    {searchTerm || selectedFaculte || selectedStatut
                      ? `Aucun domaine trouvé avec ces critères`
                      : "Aucun domaine disponible"}
                  </p>
                  {!searchTerm && !selectedFaculte && !selectedStatut && (
                    <Button variant="primary" onClick={handleAdd}>
                      <FaPlus className="me-2" />
                      Créer le premier domaine
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
                  Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, (Array.isArray(sortedDomaines) ? sortedDomaines.length : 0))} 
                  {' '}sur {Array.isArray(sortedDomaines) ? sortedDomaines.length : 0} domaine{(Array.isArray(sortedDomaines) && sortedDomaines.length > 1) ? 's' : ''}
                </small>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal pour ajouter/modifier */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {modalMode === 'add' ? 'Ajouter un Domaine' : 'Modifier le Domaine'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code du Domaine *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentDomaine.code}
                    onChange={(e) => setCurrentDomaine({...currentDomaine, code: e.target.value})}
                    placeholder="Ex: INFO, MATH, LETT"
                    required
                  />
                  <Form.Text className="text-muted">
                    Code unique pour identifier le domaine
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select
                    value={currentDomaine.statut}
                    onChange={(e) => setCurrentDomaine({...currentDomaine, statut: e.target.value})}
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Nom du Domaine *</Form.Label>
              <Form.Control
                type="text"
                value={currentDomaine.nom}
                onChange={(e) => setCurrentDomaine({...currentDomaine, nom: e.target.value})}
                placeholder="Ex: Informatique, Mathématiques, Lettres"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Faculté *</Form.Label>
              {loadingFacultes ? (
                <div className="text-center py-2">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Chargement des facultés...</span>
                </div>
              ) : (
                <Form.Select
                  value={currentDomaine.faculte}
                  onChange={(e) => setCurrentDomaine({...currentDomaine, faculte: e.target.value})}
                  required
                  disabled={!Array.isArray(facultes) || facultes.length === 0}
                >
                  <option value="">Sélectionner une faculté</option>
                  {Array.isArray(facultes) && facultes.map(faculte => (
                    <option key={faculte.id} value={faculte.id}>
                      {faculte.code || ''} - {faculte.nom || ''}
                    </option>
                  ))}
                </Form.Select>
              )}
              {!loadingFacultes && (!Array.isArray(facultes) || facultes.length === 0) && (
                <Form.Text className="text-danger">
                  <FaExclamationTriangle className="me-1" />
                  Aucune faculté disponible. Créez d'abord une faculté.
                </Form.Text>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentDomaine.description}
                onChange={(e) => setCurrentDomaine({...currentDomaine, description: e.target.value})}
                placeholder="Description du domaine (objectifs, compétences, débouchés...)"
              />
              <Form.Text className="text-muted">
                Facultatif : décrire les objectifs et spécificités du domaine
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={!Array.isArray(facultes) || facultes.length === 0}
          >
            {modalMode === 'add' ? 'Créer le domaine' : 'Modifier le domaine'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}