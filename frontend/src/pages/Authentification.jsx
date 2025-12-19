import React, { useState, useEffect } from "react";
import { 
  FaUser, FaLock, FaEye, FaEyeSlash, FaSignInAlt, FaUserPlus, 
  FaUsers, FaEdit, FaTrash, FaCheck, FaTimes, FaKey, FaEnvelope,
  FaUserShield, FaUserCheck, FaUserTimes, FaCalendarAlt, FaPhone,
  FaSearch, FaExclamationTriangle, FaSpinner, FaSync
} from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import { authApi } from "../api";

export default function Authentification() {
  // États pour les utilisateurs (CRUD)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // États pour les formulaires
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "scolarite" // Valeur par défaut
  });
  
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Rôles disponibles (selon votre modèle Django)
  const roles = [
    { value: "administrateur", label: "Administrateur", color: "danger" },
    { value: "scolarite", label: "Scolarité", color: "warning" },
    { value: "bourse", label: "Bourse", color: "info" },
    { value: "finance", label: "Finance", color: "secondary" }
  ];

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    // Vérifier le rôle de l'utilisateur connecté
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setUserRole(userInfo.role);
    
    fetchUsers();
  }, []);

  // Fonction pour charger les utilisateurs depuis l'API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error("Non authentifié");
      }
      
      const response = await fetch('http://127.0.0.1:8000/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      setError("Impossible de charger les utilisateurs. Vérifiez votre connexion ou vos permissions.");
      
      // En cas d'erreur 401 (non authentifié), rediriger vers la page de login
      if (error.message.includes('401')) {
        localStorage.clear();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter un nouvel utilisateur
  const handleAddUser = async () => {
    // Vérifier que seul l'administrateur peut ajouter des utilisateurs
    if (userRole !== 'administrateur') {
      alert("Seul l'administrateur peut ajouter de nouveaux utilisateurs.");
      return;
    }
    
    // Validation des champs
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (newUser.password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/users/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erreur ${response.status}`);
      }
      
      const createdUser = await response.json();
      
      // Ajouter l'utilisateur à la liste locale
      setUsers([...users, createdUser]);
      
      // Réinitialiser le formulaire
      setNewUser({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "scolarite"
      });
      
      setShowAddModal(false);
      alert("Utilisateur créé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Fonction pour modifier un utilisateur
  const handleEditUser = async () => {
    // Vérifier que seul l'administrateur peut modifier des utilisateurs
    if (userRole !== 'administrateur') {
      alert("Seul l'administrateur peut modifier les utilisateurs.");
      return;
    }
    
    if (!editingUser) return;
    
    if (!editingUser.username || !editingUser.email || !editingUser.role) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/users/${editingUser.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: editingUser.username,
          email: editingUser.email,
          role: editingUser.role
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erreur ${response.status}`);
      }
      
      const updatedUser = await response.json();
      
      // Mettre à jour l'utilisateur dans la liste locale
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      setShowEditModal(false);
      setEditingUser(null);
      alert("Utilisateur mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Fonction pour supprimer un utilisateur
  const handleDeleteUser = async () => {
    // Vérifier que seul l'administrateur peut supprimer des utilisateurs
    if (userRole !== 'administrateur') {
      alert("Seul l'administrateur peut supprimer des utilisateurs.");
      return;
    }
    
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/users/${userToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok && response.status !== 204) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      // Supprimer l'utilisateur de la liste locale
      setUsers(users.filter(u => u.id !== userToDelete.id));
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      alert("Utilisateur supprimé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Fonction pour changer le mot de passe (uniquement pour l'utilisateur connecté)
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    try {
      // Récupérer l'ID de l'utilisateur connecté
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const userId = userInfo.id;
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/change-password/${userId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
          confirm_password: passwordData.confirmPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erreur ${response.status}`);
      }
      
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      setShowChangePasswordModal(false);
      alert("Mot de passe changé avec succès !");
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Filtrer les utilisateurs localement
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole ? user.role === filterRole : true;
    
    return matchesSearch && matchesRole;
  });

  // Rafraîchir les données
  const refreshData = () => {
    fetchUsers();
  };

  // Vérifier si l'utilisateur est administrateur
  const isAdmin = userRole === 'administrateur';

  return (
    <div className="container-fluid py-4">
      {/* En-tête */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="text-primary">
                <FaUserShield className="me-2" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-muted mb-0">
                {isAdmin ? "Mode administrateur" : "Mode utilisateur"}
                <Badge bg={isAdmin ? "danger" : "info"} className="ms-2">
                  {isAdmin ? "ADMIN" : userRole?.toUpperCase()}
                </Badge>
              </p>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                onClick={() => setShowChangePasswordModal(true)}
                className="me-2"
              >
                <FaKey className="me-1" /> Changer mon mot de passe
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={refreshData}
                disabled={loading}
              >
                <FaSync className={loading ? "fa-spin me-1" : "me-1"} />
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="row mb-4">
        <div className="col-md-3">
          <Card className="text-center border-start-primary border-start-3 shadow">
            <Card.Body>
              <FaUsers className="text-primary display-6 mb-3" />
              <Card.Title className="text-primary">Total utilisateurs</Card.Title>
              <h2 className="text-dark">{users.length}</h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center border-start-success border-start-3 shadow">
            <Card.Body>
              <FaUserShield className="text-success display-6 mb-3" />
              <Card.Title className="text-success">Administrateurs</Card.Title>
              <h2 className="text-dark">
                {users.filter(u => u.role === "administrateur").length}
              </h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center border-start-warning border-start-3 shadow">
            <Card.Body>
              <FaUserCheck className="text-warning display-6 mb-3" />
              <Card.Title className="text-warning">Gestionnaires</Card.Title>
              <h2 className="text-dark">
                {users.filter(u => u.role === "scolarite").length}
              </h2>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-3">
          <Card className="text-center border-start-info border-start-3 shadow">
            <Card.Body>
              <FaUsers className="text-info display-6 mb-3" />
              <Card.Title className="text-info">Autres rôles</Card.Title>
              <h2 className="text-dark">
                {users.filter(u => !["administrateur", "scolarite"].includes(u.role)).length}
              </h2>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      {/* Barre d'outils */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-8">
              <div className="row g-2">
                <div className="col-md-6">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Rechercher par nom d'utilisateur ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </div>
                <div className="col-md-6">
                  <Form.Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="">Tous les rôles</option>
                    {roles.map((role, index) => (
                      <option key={index} value={role.value}>{role.label}</option>
                    ))}
                  </Form.Select>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              {isAdmin ? (
                <Button 
                  variant="primary" 
                  onClick={() => setShowAddModal(true)}
                  className="d-inline-flex align-items-center"
                >
                  <FaUserPlus className="me-2" /> Ajouter un utilisateur
                </Button>
              ) : (
                <Alert variant="info" className="mb-0 py-2">
                  <FaUserShield className="me-2" />
                  Seul l'administrateur peut ajouter des utilisateurs
                </Alert>
              )}
            </div>
          </div>
          
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Badge bg="info">
                    {filteredUsers.length} utilisateur(s)
                  </Badge>
                  {(filterRole || searchTerm) && (
                    <Badge bg="secondary" className="ms-2">Filtré</Badge>
                  )}
                  {!isAdmin && (
                    <Badge bg="warning" className="ms-2">Lecture seule</Badge>
                  )}
                </div>
                <div className="text-muted">
                  Connecté en tant que : {userRole}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages d'erreur */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Erreur :</strong> {error}
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={refreshData}>
            Réessayer
          </Button>
        </Alert>
      )}
      
      {/* Tableau des utilisateurs */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Chargement des utilisateurs...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-light">
                  <tr>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        {/* <FaSearch className="text-muted mb-3" size={48} /> */}
                        <p className="text-muted">Aucun utilisateur trouvé</p>
                        {users.length === 0 && (
                          <p className="text-muted small">La liste des utilisateurs est vide</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const role = roles.find(r => r.value === user.role);
                      const isCurrentUser = user.id === JSON.parse(localStorage.getItem('userInfo') || '{}').id;
                      
                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="fw-medium">{user.username}</div>
                            {isCurrentUser && (
                              <Badge bg="primary" className="mt-1">Vous</Badge>
                            )}
                          </td>
                          <td>
                            <div>
                              <FaEnvelope className="me-1 text-muted" />
                              {user.email || "Non défini"}
                            </div>
                          </td>
                          <td>
                            {role ? (
                              <Badge bg={role.color}>{role.label}</Badge>
                            ) : (
                              <Badge bg="secondary">{user.role}</Badge>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="outline-warning"
                                    onClick={() => {
                                      setEditingUser({...user});
                                      setShowEditModal(true);
                                    }}
                                    title="Modifier"
                                    size="sm"
                                    disabled={isCurrentUser && user.role === "administrateur"}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setShowDeleteModal(true);
                                    }}
                                    title="Supprimer"
                                    size="sm"
                                    disabled={isCurrentUser || user.role === "administrateur"}
                                  >
                                    <FaTrash />
                                  </Button>
                                </>
                              )}
                              {!isAdmin && (
                                <span className="text-muted">Actions non autorisées</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal Ajout d'utilisateur */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Ajouter un nouvel utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Alert variant="info">
              <FaUserShield className="me-2" />
              Seul l'administrateur peut créer de nouveaux utilisateurs
            </Alert>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom d'utilisateur *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaUser />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                      placeholder="ex: john.doe"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Identifiant unique pour la connexion
                  </Form.Text>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>@</InputGroup.Text>
                    <Form.Control
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                      placeholder="ex: john.doe@tul.mg"
                    />
                  </InputGroup>
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Rôle *</Form.Label>
                  <Form.Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    {roles.map((role, index) => (
                      <option key={index} value={role.value}>{role.label}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Définit les permissions de l'utilisateur
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaLock />
                    </InputGroup.Text>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                      placeholder="Minimum 6 caractères"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                  <small className="text-muted">Minimum 6 caractères</small>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le mot de passe *</Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    required
                    placeholder="Retapez le mot de passe"
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleAddUser} disabled={!isAdmin}>
            <FaUserPlus className="me-2" /> Créer l'utilisateur
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal Modification d'utilisateur */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>Modifier l'utilisateur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingUser && (
            <>
              <Alert variant="info">
                Modification de : <strong>{editingUser.username}</strong>
                {editingUser.id === JSON.parse(localStorage.getItem('userInfo') || '{}').id && (
                  <Badge bg="primary" className="ms-2">Vous</Badge>
                )}
              </Alert>
              
              <Form>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Nom d'utilisateur *</Form.Label>
                      <Form.Control
                        type="text"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                        required
                        disabled={editingUser.id === JSON.parse(localStorage.getItem('userInfo') || '{}').id}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Rôle *</Form.Label>
                      <Form.Select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        disabled={editingUser.id === JSON.parse(localStorage.getItem('userInfo') || '{}').id}
                      >
                        {roles.map((role, index) => (
                          <option key={index} value={role.value}>{role.label}</option>
                        ))}
                      </Form.Select>
                      {editingUser.id === JSON.parse(localStorage.getItem('userInfo') || '{}').id && (
                        <Form.Text className="text-muted">
                          Vous ne pouvez pas modifier votre propre rôle
                        </Form.Text>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button variant="warning" onClick={handleEditUser} disabled={!isAdmin}>
            <FaEdit className="me-2" /> Mettre à jour
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal Suppression d'utilisateur */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToDelete && (
            <div className="text-center">
              <FaTrash className="text-danger mb-3" size={48} />
              <h5>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</h5>
              <p className="mt-3">
                <strong>{userToDelete.username}</strong><br />
                <span className="text-muted">({userToDelete.email})</span>
              </p>
              <Alert variant="warning" className="mt-3">
                <FaExclamationTriangle className="me-2" />
                {userToDelete.role === "administrateur" ? (
                  "Vous ne pouvez pas supprimer un administrateur."
                ) : (
                  "Cette action est irréversible. Toutes les données de l'utilisateur seront perdues."
                )}
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            <FaTimes className="me-1" /> Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteUser} 
            disabled={!isAdmin || (userToDelete && userToDelete.role === "administrateur")}
          >
            <FaTrash className="me-1" /> Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal Changement de mot de passe */}
      <Modal show={showChangePasswordModal} onHide={() => setShowChangePasswordModal(false)}>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Changer mon mot de passe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Alert variant="info">
              <FaKey className="me-2" />
              Vous allez modifier votre mot de passe personnel
            </Alert>
            
            <Form.Group className="mb-3">
              <Form.Label>Ancien mot de passe *</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  required
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Nouveau mot de passe *</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
              </InputGroup>
              <small className="text-muted">Minimum 6 caractères</small>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirmer le nouveau mot de passe *</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </InputGroup>
            </Form.Group>
            
            <Form.Check
              type="checkbox"
              label="Afficher les mots de passe"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="mb-3"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChangePasswordModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleChangePassword}>
            <FaCheck className="me-2" /> Changer le mot de passe
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Pied de page */}
      <footer className="mt-5 pt-3 border-top">
        <div className="row">
          <div className="col-md-6">
            <p className="text-muted">
              <small>
                Système de gestion des utilisateurs - Université de Toliara<br />
                {isAdmin ? "Mode administrateur" : "Mode utilisateur"}
              </small>
            </p>
          </div>
          <div className="col-md-6 text-end">
            <p className="text-muted">
              <small>
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}<br />
                Version 1.0.0
              </small>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}