import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import api from '../api';
import './Navbar.css';
import logoUnivToliara from '../assets/logo-univ-toliara.png';

const Navbar = () => {
  const [showSide, setShowSide] = useState(true);
  const [showDrop1, setShowDrop1] = useState(false); // Inscription
  const [showDrop2, setShowDrop2] = useState(false); // Réinscription
  const [showDrop6, setShowDrop6] = useState(false); // Bourses
  const [showDrop4, setShowDrop4] = useState(false); // Doublon
  const [showDropImpression, setShowDropImpression] = useState(false); // Impression
  const [showDropImpressionBourses, setShowDropImpressionBourses] = useState(false); // Impression bourses
  const [showDrop5, setShowDrop5] = useState(false); // Paramètres Académiques
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    first_name: '',
    username: '',
    email: '',
    role: ''
  });

  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/current-user/');

      if (response.data) {
        setUserInfo({
          first_name: response.data.first_name || response.data.username || 'Utilisateur',
          username: response.data.username || 'user',
          email: response.data.email || '',
          role: response.data.role || ''
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des informations utilisateur:", err);

      const storedEmail = localStorage.getItem("user_email");
      const storedUsername = localStorage.getItem("user_name");
      const storedRole = localStorage.getItem("user_role");

      setUserInfo({
        first_name: storedUsername || 'Utilisateur',
        username: storedUsername || 'user',
        email: storedEmail || 'email@example.com',
        role: storedRole || ''
      });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (token) {
      fetchUserInfo();
    } else {
      navigate("/login");
    }

    const handleResize = () => {
      if (window.innerWidth < 720) setShowSide(false);
      else setShowSide(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  const toggleSideBar = () => setShowSide(!showSide);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("refreshToken");

    setShowLogoutModal(false);
    navigate("/login");
  };

  const getMenuPermissions = () => {
    const role = userInfo.role;

    switch (role) {
      case 'administrateur':
        return {
          showInscription: true,
          showReinscription: true,
          showEtudiant: true,
          showDoublon: true,
          showParametres: true,
          showBourses: true,
          showPaiement: true,
          showAuthentification: true,
          showDashboard: true
        };

      case 'scolarite':
        return {
          showInscription: true,
          showReinscription: true,
          showEtudiant: true,
          showDoublon: false,
          showParametres: false,
          showBourses: false,
          showPaiement: false,
          showAuthentification: false,
          showDashboard: true
        };

      case 'bourse':
        return {
          showInscription: false,
          showReinscription: false,
          showEtudiant: true,
          showDoublon: true,
          showParametres: false,
          showBourses: true,
          showPaiement: false,
          showAuthentification: false,
          showDashboard: true
        };

      case 'finance':
        return {
          showInscription: false,
          showReinscription: false,
          showEtudiant: true,
          showDoublon: false,
          showParametres: false,
          showBourses: false,
          showPaiement: true,
          showAuthentification: false,
          showDashboard: true
        };

      default:
        return {
          showInscription: false,
          showReinscription: false,
          showEtudiant: false,
          showDoublon: false,
          showParametres: false,
          showBourses: false,
          showPaiement: false,
          showAuthentification: false,
          showDashboard: true
        };
    }
  };

  const permissions = getMenuPermissions();

  return (
    <div className="w-[185px] bg-blue-600 text-white h-full flex flex-col">
      {/* En-tête avec logo et nom de l'université */}
      <div className="h-auto min-h-[50px] flex flex-col items-center justify-center py-2 border-b border-blue-500">
        {/* Logo */}
        <div className="mb-1">
          <div
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            <img
              src={logoUnivToliara}
              alt="Logo Université de Toliara"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>

        {/* Nom de l'application */}
        <div className="text-center">
          <div className="text-sm font-bold">EDU-UNIV/TUL</div>
        </div>
      </div>

      {/* Informations utilisateur */}
      <div className="p-4 text-center border-b border-blue-500">
        <div className="text-sm font-medium">{userInfo.first_name}</div>
        <div className="text-xs text-blue-200">{userInfo.email}</div>
        <div className="mt-1">
          <span className="px-2 py-1 bg-blue-700 rounded text-xs">
            {userInfo.role ? userInfo.role.toUpperCase() : 'UTILISATEUR'}
          </span>
        </div>
      </div>

      {/* Menu de navigation */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        {/* Accueil - Toujours visible */}
        {permissions.showDashboard && (
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
            <i className="fas fa-home mr-2"></i>Accueil
          </Link>
        )}

        {/* Service Inscription */}
        {permissions.showInscription && (
          <div>
            <div
              onClick={() => setShowDrop1(!showDrop1)}
              className="sidebar-link flex justify-between items-center"
            >
              <span><i className="fas fa-user-plus mr-2"></i>Service Inscription</span>
              <i className={`fas fa-chevron-down transition-transform ${showDrop1 ? 'rotate-180' : 'rotate-0'}`}></i>
            </div>

            {showDrop1 && (
              <div className="sidebar-submenu">
                {/* Première ligne: Nouvelle inscription */}
                <Link
                  to="/inscription"
                  className={`sidebar-link ${isActive('/inscription')}`}
                >
                  Nouvelle inscription
                </Link>

                {/* Deuxième ligne: Impression avec sous-menu */}
                <div className="relative">
                  <div
                    onClick={() => setShowDropImpression(!showDropImpression)}
                    className="sidebar-link flex justify-between items-center cursor-pointer"
                  >
                    <span>Impression</span>
                    <i
                      className={`fas fa-chevron-down transition-transform ${showDropImpression ? 'rotate-180' : ''}`}
                    ></i>
                  </div>

                  {showDropImpression && (
                    <div className="sidebar-submenu-nested ml-4 mt-1">
                      <Link
                        to="/impression"
                        className={`sidebar-link ${isActive('/impression')}`}
                      >
                        <i className="fas fa-list mr-2"></i>Liste des étudiants
                      </Link>
                      <Link
                        to="/list-etudiants"
                        className={`sidebar-link ${isActive('/list-etudiants')}`}
                      >
                        <i className="fas fa-id-card mr-2"></i>Carte & Certificat
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Réinscription */}
        {permissions.showReinscription && (
          <div>
            <div onClick={() => setShowDrop2(!showDrop2)} className="sidebar-link flex justify-between items-center">
              <span><i className="fas fa-redo mr-2"></i>Service Réinscription</span>
              <i className={`fas fa-chevron-down transition-transform ${showDrop2 ? 'rotate-180' : 'rotate-0'}`}></i>
            </div>
            {showDrop2 && (
              <div className="sidebar-submenu">
                <Link to="/reinscription" className={`sidebar-link ${isActive('/reinscription')}`}>
                  <i className="fas fa-redo mr-2"></i>Réinscription</Link>
              </div>
            )}
          </div>
        )}

        {/* Détection Doublons */}
        {permissions.showDoublon && (
          <div>
            <div onClick={() => setShowDrop4(!showDrop4)} className="sidebar-link flex justify-between items-center">
              <span><i className="fas fa-clone mr-2"></i>Détection Doublons</span>
              <i className={`fas fa-chevron-down transition-transform ${showDrop4 ? 'rotate-180' : 'rotate-0'}`}></i>
            </div>
            {showDrop4 && (
              <div className="sidebar-submenu">
                <Link to="/doublonsnom-prenom" className={`sidebar-link ${isActive('/doublonsnom-prenom')}`}>
                  Doublon Identité
                </Link>
                <Link to="/Doublonbourse" className={`sidebar-link ${isActive('/Doublonbourse')}`}>
                  Doublon Bourse par Identité
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Paramètres Académiques */}
        {permissions.showParametres && (
          <div>
            <div onClick={() => setShowDrop5(!showDrop5)} className="sidebar-link flex justify-between items-center">
              <span><i className="fas fa-cogs mr-2"></i>Paramètres Académiques</span>
              <i className={`fas fa-chevron-down transition-transform ${showDrop5 ? 'rotate-180' : 'rotate-0'}`}></i>
            </div>
            {showDrop5 && (
              <div className="sidebar-submenu">
                <Link to="/facultes" className={`sidebar-link ${isActive('/facultes')}`}>
                  <i className="fas fa-university mr-2"></i>Facultés
                </Link>
                <Link to="/domaines" className={`sidebar-link ${isActive('/domaines')}`}>
                  <i className="fas fa-book mr-2"></i>Domaines
                </Link>
                <Link to="/mentions" className={`sidebar-link ${isActive('/mentions')}`}>
                  <i className="fas fa-graduation-cap mr-2"></i>Mentions
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Service Bourses avec sous-menu */}
        {permissions.showBourses && (
          <div>
            <div
              onClick={() => setShowDrop6(!showDrop6)}
              className="sidebar-link flex justify-between items-center cursor-pointer"
            >
              <span><i className="fas fa-hand-holding-usd mr-2"></i>Service Bourses</span>
              <i className={`fas fa-chevron-down transition-transform ${showDrop6 ? 'rotate-180' : 'rotate-0'}`}></i>
            </div>

            {showDrop6 && (
              <div className="sidebar-submenu">
                {/* Section Bourses */}
                <Link to="/bourses" className={`sidebar-link ${isActive('/bourses')}`}>
                  <i className="fas fa-hand-holding-usd mr-2"></i>
                  <span className="flex-1">Bourses</span>
                  <span className="text-xs bg-green-500 px-1.5 py-0.5 rounded">24</span>
                </Link>

                {/* Section Impression avec sous-menu */}
                <div className="relative">
                  <div
                    onClick={() => setShowDropImpressionBourses(!showDropImpressionBourses)}
                    className="sidebar-link flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center">
                      <i className="fas fa-print mr-2"></i>
                      <span>Impression</span>
                    </div>
                    <i className={`fas fa-chevron-down transition-transform ${showDropImpressionBourses ? 'rotate-180' : ''}`}></i>
                  </div>

                  {showDropImpressionBourses && (
                    <div className="sidebar-submenu-nested ml-4 mt-1">
                      {/* Impression - Bourses */}
                      <Link
                        to="/impression-bourses"
                        className={`sidebar-link ${isActive('/impression-bourses')}`}
                      >
                        <i className="fas fa-hand-holding-usd mr-2 text-xs"></i>
                        <span>Bourses</span>
                      </Link>

                      {/* Impression - Non bourses */}
                      <Link
                        to="/impression-non-bourses"
                        className={`sidebar-link ${isActive('/impression-non-bourses')}`}
                      >
                        <i className="fas fa-ban mr-2 text-xs"></i>
                        <span>Non bourses</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Paiement */}
        {permissions.showPaiement && (
          <Link to="/paiement" className={`sidebar-link ${isActive('/paiement')}`}>
            <i className="fas fa-credit-card mr-2"></i>Service Paiement
          </Link>
        )}

        {/* Service Authentification */}
        {permissions.showAuthentification && (
          <Link to="/authentification" className={`sidebar-link ${isActive('/authentification')}`}>
            <i className="fas fa-sign-in-alt mr-2"></i>Service Authentification
          </Link>
        )}

        {/* Déconnexion - Toujours visible */}
        <div onClick={() => setShowLogoutModal(true)} className="sidebar-link cursor-pointer mt-auto">
          <i className="fas fa-sign-out-alt mr-2"></i> Déconnexion
        </div>
      </div>

      {/* Modal Déconnexion */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation de déconnexion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir vous déconnecter ?
          <p className="text-muted small mt-2">
            Connecté en tant que: <strong>{userInfo.username}</strong> ({userInfo.role})
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleLogout}>Déconnexion</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Navbar;