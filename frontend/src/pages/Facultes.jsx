// src/pages/Facultes.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Alert, 
  Card, Spinner, InputGroup, Badge,
  Row, Col
} from 'react-bootstrap';
import { 
  FaUniversity, FaEdit, FaTrash, FaPlus, 
  FaSearch, FaSync, FaExclamationTriangle 
} from 'react-icons/fa';
import api from '../api';

export default function Facultes() {
  const [facultes, setFacultes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' ou 'edit'
  const [currentFaculte, setCurrentFaculte] = useState({
    id: null,
    nom: '',
    code: '',
    description: '',
    statut: 'ACTIVE'
  });
  
  // Charger les facultés avec gestion robuste
  const fetchFacultes = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching facultes...');
      const response = await api.get('/facultes/');
      
      // Debug: voir la structure de la réponse
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        hasResults: response.data && response.data.results !== undefined
      });
      
      const data = response.data;
      let facultesArray = [];
      
      // Gestion des différents formats de réponse
      if (data && data.results && Array.isArray(data.results)) {
        // Format paginé DRF: {"results": [...], "count": X}
        facultesArray = data.results;
        console.log('Format détecté: paginé (results)');
      } else if (Array.isArray(data)) {
        // Format liste simple: [...]
        facultesArray = data;
        console.log('Format détecté: liste simple');
      } else if (data && typeof data === 'object') {
        // Autre format d'objet, essayons d'extraire un tableau
        console.log('Format détecté: objet, tentative d\'extraction...');
        
        // Essaye de trouver un tableau dans l'objet
        const possibleArrays = Object.values(data).filter(item => Array.isArray(item));
        if (possibleArrays.length > 0) {
          facultesArray = possibleArrays[0];
          console.log('Tableau extrait de l\'objet');
        } else {
          // Si c'est un seul objet, le mettre dans un tableau
          if (data.id !== undefined) {
            facultesArray = [data];
            console.log('Objet unique converti en tableau');
          } else {
            // Sinon, utiliser les valeurs de l'objet
            facultesArray = Object.values(data);
            console.log('Conversion des valeurs d\'objet en tableau');
          }
        }
      }
      
      // S'assurer que c'est bien un tableau
      if (!Array.isArray(facultesArray)) {
        console.error('ERREUR: Format de données invalide après traitement:', {
          originalData: data,
          processedData: facultesArray,
          type: typeof facultesArray
        });
        facultesArray = [];
      }
      
      console.log(`Facultés chargées: ${facultesArray.length} éléments`);
      setFacultes(facultesArray);
      
    } catch (err) {
      console.error('Erreur complète:', {
        message: err.message,
        response: err.response,
        config: err.config
      });
      
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors du chargement des facultés';
      setError(`Erreur: ${errorMessage}`);
      setFacultes([]); // Toujours définir un tableau vide
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFacultes();
  }, []);
  
  // Ouvrir modal pour ajouter
  const handleAdd = () => {
    setCurrentFaculte({
      id: null,
      nom: '',
      code: '',
      description: '',
      statut: 'ACTIVE'
    });
    setModalMode('add');
    setShowModal(true);
  };
  
  // Ouvrir modal pour modifier
  const handleEdit = (faculte) => {
    setCurrentFaculte({
      id: faculte.id,
      nom: faculte.nom || '',
      code: faculte.code || '',
      description: faculte.description || '',
      statut: faculte.statut || 'ACTIVE'
    });
    setModalMode('edit');
    setShowModal(true);
  };
  
  // Sauvegarder (ajout ou modification)
  const handleSave = async () => {
    // Validation
    if (!currentFaculte.code.trim()) {
      setError('Le code est requis');
      return;
    }
    if (!currentFaculte.nom.trim()) {
      setError('Le nom est requis');
      return;
    }
    
    try {
      if (modalMode === 'add') {
        await api.post('/facultes/', currentFaculte);
      } else {
        await api.put(`/facultes/${currentFaculte.id}/`, currentFaculte);
      }
      fetchFacultes();
      setShowModal(false);
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data || 'Erreur lors de la sauvegarde';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
    }
  };
  
  // Supprimer une faculté
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette faculté ?')) {
      try {
        await api.delete(`/facultes/${id}/`);
        fetchFacultes();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };
  
  // Filtrer les facultés avec vérification
  const filteredFacultes = Array.isArray(facultes) 
    ? facultes.filter(faculte => {
        if (!faculte) return false;
        const nom = faculte.nom || '';
        const code = faculte.code || '';
        const description = faculte.description || '';
        
        const searchLower = searchTerm.toLowerCase();
        return nom.toLowerCase().includes(searchLower) ||
               code.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower);
      })
    : [];
  
  // Statistiques avec vérification
  const stats = {
    total: Array.isArray(facultes) ? facultes.length : 0,
    actifs: Array.isArray(facultes) ? facultes.filter(f => f && f.statut === 'ACTIVE').length : 0,
    inactifs: Array.isArray(facultes) ? facultes.filter(f => f && f.statut === 'INACTIVE').length : 0
  };
  
  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">
        <FaUniversity className="me-2 text-primary" />
        Gestion des Facultés
      </h2>
      
      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-primary shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-primary h6 mb-2">Total Facultés</Card.Title>
              <div className="h2 text-primary">{stats.total}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-success shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-success h6 mb-2">Facultés Actives</Card.Title>
              <div className="h2 text-success">{stats.actifs}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-warning h6 mb-2">Facultés Inactives</Card.Title>
              <div className="h2 text-warning">{stats.inactifs}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info shadow-sm">
            <Card.Body className="p-3">
              <Card.Title className="text-info h6 mb-2">Actions</Card.Title>
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <FaPlus className="me-1" /> Nouvelle Faculté
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
          <Button variant="outline-danger" size="sm" onClick={fetchFacultes}>
            <FaSync className="me-2" />
            Réessayer
          </Button>
        </Alert>
      )}
      
      {/* Message si pas de facultés */}
      {!loading && (!Array.isArray(facultes) || facultes.length === 0) && !error && (
        <Alert variant="info" className="mb-4">
          <p className="mb-0">
            <strong>Aucune faculté disponible.</strong> Créez votre première faculté pour commencer.
          </p>
        </Alert>
      )}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Button variant="primary" onClick={handleAdd} className="me-3">
                <FaPlus className="me-2" />
                Nouvelle Faculté
              </Button>
              <Button variant="outline-secondary" onClick={fetchFacultes} disabled={loading}>
                <FaSync className="me-2" />
                Actualiser
              </Button>
            </div>
            
            <InputGroup style={{ width: '300px' }}>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Rechercher par nom, code ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!Array.isArray(facultes) || facultes.length === 0}
              />
            </InputGroup>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Chargement des facultés...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-primary">
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredFacultes) && filteredFacultes.map((faculte, index) => (
                    <tr key={faculte.id || `faculte-${index}`}>
                      <td>{index + 1}</td>
                      <td>
                        <strong className="text-primary">{faculte.code || 'N/A'}</strong>
                      </td>
                      <td>{faculte.nom || 'N/A'}</td>
                      <td>{faculte.description || '-'}</td>
                      <td>
                        <Badge bg={faculte.statut === 'ACTIVE' ? 'success' : 'secondary'}>
                          {faculte.statut === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEdit(faculte)}
                            title="Modifier"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(faculte.id)}
                            title="Supprimer"
                            disabled={!faculte.id}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {(!Array.isArray(filteredFacultes) || filteredFacultes.length === 0) && !loading && (
                <div className="text-center py-5">
                  <p className="text-muted">
                    {searchTerm 
                      ? `Aucune faculté trouvée pour "${searchTerm}"`
                      : "Aucune faculté disponible"}
                  </p>
                  {!searchTerm && (
                    <Button variant="primary" onClick={handleAdd}>
                      <FaPlus className="me-2" />
                      Créer la première faculté
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal pour ajouter/modifier */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {modalMode === 'add' ? 'Ajouter une Faculté' : 'Modifier la Faculté'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Code *</Form.Label>
              <Form.Control
                type="text"
                value={currentFaculte.code}
                onChange={(e) => setCurrentFaculte({...currentFaculte, code: e.target.value})}
                placeholder="Ex: FST, FLASH, FSHS"
                required
              />
              <Form.Text className="text-muted">
                Code unique pour identifier la faculté
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Nom *</Form.Label>
              <Form.Control
                type="text"
                value={currentFaculte.nom}
                onChange={(e) => setCurrentFaculte({...currentFaculte, nom: e.target.value})}
                placeholder="Ex: Faculté des Sciences et Technologies"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentFaculte.description}
                onChange={(e) => setCurrentFaculte({...currentFaculte, description: e.target.value})}
                placeholder="Description de la faculté..."
              />
              <Form.Text className="text-muted">
                Facultatif : décrivez les spécificités de la faculté
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={currentFaculte.statut}
                onChange={(e) => setCurrentFaculte({...currentFaculte, statut: e.target.value})}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {modalMode === 'add' ? 'Créer la faculté' : 'Modifier la faculté'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}