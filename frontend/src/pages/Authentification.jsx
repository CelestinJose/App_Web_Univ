import React, { useState, useEffect } from "react";
import {
  FaUser, FaLock, FaEye, FaEyeSlash, FaUserPlus,
  FaUsers, FaEdit, FaTrash, FaCheck, FaTimes, FaKey, FaEnvelope,
  FaUserShield, FaUserCheck, FaCircle, FaClock, FaInfoCircle,
  FaSearch, FaExclamationTriangle, FaSync, FaPlug
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
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from "../api";

export default function Authentification() {
  // États pour les utilisateurs (CRUD)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // États pour les utilisateurs connectés
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);

  // États pour les notifications Toast
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    title: '',
    message: '',
    variant: 'success', // success, danger, warning, info
    icon: null
  });

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
    role: "scolarite"
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

  // Rôles disponibles
  const roles = [
    { value: "administrateur", label: "Administrateur", color: "danger" },
    { value: "scolarite", label: "Scolarité", color: "warning" },
    { value: "bourse", label: "Bourse", color: "info" },
    { value: "finance", label: "Finance", color: "secondary" }
  ];

  // Fonction pour afficher une notification
  const showNotification = (title, message, variant = 'success', icon = null) => {
    setToastConfig({
      title,
      message,
      variant,
      icon
    });
    setShowToast(true);

    // Auto-hide après 5 secondes
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  // Fonction pour afficher une erreur
  const showError = (title, errors) => {
    let message = '';
    if (typeof errors === 'string') {
      message = errors;
    } else if (errors && typeof errors === 'object') {
      // Traiter les erreurs d'API Django
      for (const [field, errorMessages] of Object.entries(errors)) {
        if (Array.isArray(errorMessages)) {
          message += `${field}: ${errorMessages.join(', ')}\n`;
        } else {
          message += `${field}: ${errorMessages}\n`;
        }
      }
    }

    showNotification(title, message.trim(), 'danger', <FaExclamationTriangle />);
  };

  // Fonction pour décoder le JWT
  const decodeJWT = (token) => {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Erreur décodage JWT:", error);
      return null;
    }
  };

  // Fonction pour mettre à jour le statut "dernière vue"
  const updateLastSeen = async () => {
    try {
      await api.post('/auth/users/update_last_seen/');
    } catch (error) {
      console.error("Erreur lors de la mise à jour de last_seen:", error);
    }
  };

  // Fonction pour récupérer les utilisateurs en ligne
  const fetchOnlineUsers = async () => {
    if (!isAdmin) return; // Seul l'admin peut voir les utilisateurs en ligne
    
    try {
      const response = await api.get('/auth/users/online/');
      if (response.data) {
        setOnlineUsers(response.data);
        setOnlineCount(response.data.length);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs en ligne:", error);
      // Ne pas afficher d'erreur si c'est juste que l'utilisateur n'est pas admin
      if (error.response?.status !== 403) {
        console.log("Erreur détaillée:", error.response?.data);
      }
    }
  };

  useEffect(() => {
    const getUserInfo = () => {
      const storedId = localStorage.getItem("user_id");
      const storedRole = localStorage.getItem("user_role");
      const storedUsername = localStorage.getItem("user_name");

      if (!storedId || !storedRole || !storedUsername) {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
          const decoded = decodeJWT(accessToken);
          if (decoded) {
            localStorage.setItem("user_id", decoded.user_id || '');
            localStorage.setItem("user_name", decoded.username || '');
            localStorage.setItem("user_role", decoded.role || '');
            return {
              id: decoded.user_id || '',
              username: decoded.username || '',
              email: decoded.email || localStorage.getItem("user_email") || '',
              role: decoded.role || ''
            };
          }
        }
      }

      return {
        id: storedId || '',
        username: storedUsername || '',
        email: localStorage.getItem("user_email") || '',
        role: storedRole || ''
      };
    };

    const userInfo = getUserInfo();
    setUserRole(userInfo.role);
    setCurrentUserId(userInfo.id);
    fetchUsers();
    
    // Mettre à jour le statut de dernière activité immédiatement
    updateLastSeen();

    // Mettre à jour toutes les 30 secondes
    const updateInterval = setInterval(updateLastSeen, 30000);
    
    // Mettre à jour la liste des utilisateurs en ligne toutes les 10 secondes (admin seulement)
    let onlineInterval;
    if (userInfo.role === 'administrateur') {
      fetchOnlineUsers();
      onlineInterval = setInterval(fetchOnlineUsers, 10000);
    }

    return () => {
      clearInterval(updateInterval);
      if (onlineInterval) clearInterval(onlineInterval);
    };
  }, []);

  // Fonction pour charger les utilisateurs depuis l'API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/users/');
      if (response.data) {
        setUsers(response.data);
        
        // Mettre à jour les utilisateurs en ligne si admin
        if (isAdmin) {
          const online = response.data.filter(user => user.is_online && user.id !== parseInt(currentUserId));
          setOnlineUsers(online);
          setOnlineCount(online.length);
        }
      } else {
        throw new Error("Réponse invalide de l'API");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setError("Session expirée. Veuillez vous reconnecter.");
            localStorage.clear();
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            break;
          case 403:
            setError("Accès refusé. Vous n'avez pas les permissions nécessaires.");
            break;
          case 404:
            setError("Endpoint API non trouvé. Vérifiez l'URL.");
            break;
          default:
            setError(`Erreur serveur (${error.response.status}): ${error.response.data?.detail || 'Erreur inconnue'}`);
        }
      } else if (error.request) {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion réseau.");
      } else {
        setError(`Erreur: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter un nouvel utilisateur
  const handleAddUser = async () => {
    if (!isAdmin) {
      showNotification("Permission refusée", "Seul l'administrateur peut ajouter de nouveaux utilisateurs.", 'warning');
      return;
    }

    // Validation des champs
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.role) {
      showNotification("Validation", "Veuillez remplir tous les champs obligatoires", 'warning');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      showNotification("Validation", "Les mots de passe ne correspondent pas", 'warning');
      return;
    }

    if (newUser.password.length < 6) {
      showNotification("Validation", "Le mot de passe doit contenir au moins 6 caractères", 'warning');
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      };

      const response = await api.post('/auth/users/', userData);

      if (response.data) {
        setUsers([...users, response.data]);
        setNewUser({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "scolarite"
        });
        setShowAddModal(false);
        showNotification("Succès", "Utilisateur créé avec succès !", 'success', <FaUserPlus />);
        
        // Rafraîchir la liste des utilisateurs en ligne
        if (isAdmin) {
          fetchOnlineUsers();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      if (error.response?.data) {
        showError("Erreur de création", error.response.data);
      } else {
        showNotification("Erreur", "Erreur réseau lors de la création de l'utilisateur", 'danger');
      }
    }
  };

  // Fonction pour modifier un utilisateur
  const handleEditUser = async () => {
    if (!isAdmin) {
      showNotification("Permission refusée", "Seul l'administrateur peut modifier les utilisateurs.", 'warning');
      return;
    }

    if (!editingUser) return;

    if (!editingUser.username || !editingUser.email || !editingUser.role) {
      showNotification("Validation", "Veuillez remplir tous les champs obligatoires", 'warning');
      return;
    }

    if (editingUser.id === currentUserId && editingUser.role !== "administrateur") {
      showNotification("Action non autorisée", "Vous ne pouvez pas modifier votre propre rôle d'administrateur.", 'warning');
      return;
    }

    try {
      const userData = {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role
      };

      const response = await api.put(`/auth/users/${editingUser.id}/`, userData);

      if (response.data) {
        setUsers(users.map(u => u.id === response.data.id ? response.data : u));
        setShowEditModal(false);
        setEditingUser(null);
        showNotification("Succès", "Utilisateur mis à jour avec succès !", 'success', <FaEdit />);
        
        // Rafraîchir la liste des utilisateurs en ligne
        if (isAdmin) {
          fetchOnlineUsers();
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      if (error.response?.data) {
        showError("Erreur de mise à jour", error.response.data);
      } else {
        showNotification("Erreur", "Erreur réseau lors de la mise à jour de l'utilisateur", 'danger');
      }
    }
  };

  // Fonction pour supprimer un utilisateur
  const handleDeleteUser = async () => {
    if (!isAdmin) {
      showNotification("Permission refusée", "Seul l'administrateur peut supprimer des utilisateurs.", 'warning');
      return;
    }

    if (!userToDelete) return;

    if (userToDelete.id === currentUserId) {
      showNotification("Action non autorisée", "Vous ne pouvez pas supprimer votre propre compte.", 'warning');
      return;
    }

    if (userToDelete.role === "administrateur") {
      showNotification("Action non autorisée", "Vous ne pouvez pas supprimer un administrateur.", 'warning');
      return;
    }

    try {
      await api.delete(`/auth/users/${userToDelete.id}/`);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      showNotification("Succès", "Utilisateur supprimé avec succès !", 'success', <FaTrash />);
      
      // Rafraîchir la liste des utilisateurs en ligne
      if (isAdmin) {
        fetchOnlineUsers();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      if (error.response?.status === 403) {
        showNotification("Permission refusée", "Vous n'avez pas la permission de supprimer cet utilisateur.", 'warning');
      } else if (error.response?.data) {
        showError("Erreur de suppression", error.response.data);
      } else {
        showNotification("Erreur", "Erreur réseau lors de la suppression de l'utilisateur", 'danger');
      }
    }
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showNotification("Validation", "Veuillez remplir tous les champs", 'warning');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification("Validation", "Les nouveaux mots de passe ne correspondent pas", 'warning');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification("Validation", "Le mot de passe doit contenir au moins 6 caractères", 'warning');
      return;
    }

    try {
      const response = await api.post('/auth/change-password/', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });

      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setShowChangePasswordModal(false);
      showNotification("Succès", "Mot de passe changé avec succès !", 'success', <FaKey />);
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      if (error.response?.data) {
        showError("Erreur de changement de mot de passe", error.response.data);
      } else {
        showNotification("Erreur", "Erreur réseau lors du changement de mot de passe", 'danger');
      }
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole ? user.role === filterRole : true;
    return matchesSearch && matchesRole;
  });

  const refreshData = () => {
    fetchUsers();
    if (isAdmin) {
      fetchOnlineUsers();
    }
  };

  const isAdmin = userRole === 'administrateur';

  return (
    <div className="container-fluid py-4">
      {/* Notifications Toast */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={5000}
          autohide
          bg={toastConfig.variant}
          className="text-white"
        >
          <Toast.Header closeButton className={`bg-${toastConfig.variant} text-white`}>
            {toastConfig.icon && <span className="me-2">{toastConfig.icon}</span>}
            <strong className="me-auto">{toastConfig.title}</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {toastConfig.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

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
                {isAdmin ? "Mode administrateur" : "Mode consultation"}
                <Badge bg={isAdmin ? "danger" : "info"} className="ms-2">
                  {isAdmin ? "ADMIN" : userRole?.toUpperCase() || "UTILISATEUR"}
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

      {/* Section utilisateurs connectés (visible seulement pour admin) */}
      {isAdmin && (
        <div className="row mb-4">
          <div className="col-12">
            <Card className="border-primary">
              <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                <div>
                  <FaPlug className="me-2" />
                  <strong>Utilisateurs actuellement connectés</strong>
                </div>
                <Badge bg="light" text="dark">
                  <FaCircle className="text-success me-1" />
                  {onlineCount} en ligne
                </Badge>
              </Card.Header>
              <Card.Body>
                {onlineUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <FaUsers className="text-muted mb-3" size={48} />
                    <p className="text-muted">Aucun utilisateur connecté</p>
                  </div>
                ) : (
                  <div className="row">
                    {onlineUsers.map(user => {
                      const role = roles.find(r => r.value === user.role);
                      return (
                        <div key={user.id} className="col-md-3 mb-3">
                          <Card className="h-100 border-success">
                            <Card.Body className="text-center">
                              <div className="mb-3">
                                <div className="position-relative d-inline-block">
                                  <FaUser 
                                    className="text-success" 
                                    size={40} 
                                  />
                                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
                                    <span className="visually-hidden">En ligne</span>
                                  </span>
                                </div>
                              </div>
                              <Card.Title className="h6 mb-1">
                                {user.username}
                              </Card.Title>
                              <Card.Text className="mb-1">
                                {role ? (
                                  <Badge bg={role.color} className="mb-2">
                                    {role.label}
                                  </Badge>
                                ) : (
                                  <Badge bg="secondary">{user.role}</Badge>
                                )}
                              </Card.Text>
                              <Card.Text className="text-muted small">
                                <FaClock className="me-1" />
                                {user.last_seen_human || 'Dernière activité'}
                              </Card.Text>
                              {user.email && (
                                <Card.Text className="small">
                                  <FaEnvelope className="me-1" />
                                  {user.email}
                                </Card.Text>
                              )}
                            </Card.Body>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="text-muted small">
                <FaInfoCircle className="me-1" />
                Section réservée à l'administrateur. Statut mis à jour toutes les 10 secondes.
              </Card.Footer>
            </Card>
          </div>
        </div>
      )}

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
                  {isAdmin && onlineCount > 0 && (
                    <Badge bg="success" className="ms-2">
                      <FaCircle className="me-1" style={{ fontSize: '0.6rem' }} />
                      {onlineCount} en ligne
                    </Badge>
                  )}
                </div>
                <div className="text-muted">
                  Connecté en tant que : {userRole || "Non défini"}
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
                    <th>#</th>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Rôle et Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <FaSearch className="text-muted mb-3" size={48} />
                        <p className="text-muted">Aucun utilisateur trouvé</p>
                        {users.length === 0 && (
                          <p className="text-muted small">La liste des utilisateurs est vide</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => {
                      const role = roles.find(r => r.value === user.role);
                      const isCurrentUser = user.id === parseInt(currentUserId);
                      const isOnline = user.is_online;

                      return (
                        <tr key={user.id}>
                          <td>{index + 1}</td>
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
                            <div className="d-flex align-items-center">
                              {role ? (
                                <Badge bg={role.color}>{role.label}</Badge>
                              ) : (
                                <Badge bg="secondary">{user.role}</Badge>
                              )}
                              {isOnline && (
                                <Badge bg="success" className="ms-2" pill>
                                  <FaCircle className="me-1" style={{ fontSize: '0.6rem' }} />
                                  En ligne
                                </Badge>
                              )}
                            </div>
                            {user.last_seen_human && (
                              <div className="text-muted small mt-1">
                                <FaClock className="me-1" />
                                {user.last_seen_human}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              {isAdmin ? (
                                <>
                                  <Button
                                    variant="outline-warning"
                                    onClick={() => {
                                      setEditingUser({ ...user });
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
                              ) : (
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
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
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
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
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
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
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
                {editingUser.id === parseInt(currentUserId) && (
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
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        required
                        disabled={editingUser.id === parseInt(currentUserId)}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
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
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        disabled={editingUser.id === parseInt(currentUserId)}
                      >
                        {roles.map((role, index) => (
                          <option key={index} value={role.value}>{role.label}</option>
                        ))}
                      </Form.Select>
                      {editingUser.id === parseInt(currentUserId) && (
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
                {userToDelete.id === parseInt(currentUserId) ? (
                  "Vous ne pouvez pas supprimer votre propre compte."
                ) : userToDelete.role === "administrateur" ? (
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
            disabled={!isAdmin ||
              (userToDelete && userToDelete.role === "administrateur") ||
              (userToDelete && userToDelete.id === parseInt(currentUserId))}
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
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
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
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
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
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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
                {isAdmin ? "Mode administrateur" : "Mode consultation"}
                {isAdmin && onlineCount > 0 && (
                  <>
                    <br />
                    <FaCircle className="text-success me-1" />
                    {onlineCount} utilisateur(s) en ligne
                  </>
                )}
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