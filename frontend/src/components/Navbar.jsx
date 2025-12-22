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
  const [showDrop3, setShowDrop3] = useState(false); // Étudiant
  const [showDrop4, setShowDrop4] = useState(false); // Doublon
  const [showDrop5, setShowDrop5] = useState(false); // Paramètres Académiques (Nouveau)
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
      // Utilisez le bon endpoint
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

      // Fallback: essayez de récupérer depuis localStorage
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
      // Si pas de token, rediriger vers login
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
          <div className="text-sm font-bold">EDU-UNIV</div>
          {/* <div className="text-xs text-blue-200">Université de Toliara</div> */}
        </div>
      </div>

      <div className="p-4 text-center border-b border-blue-500">
        <div className="text-sm font-medium">{userInfo.first_name}</div>
        <div className="text-xs text-blue-200">{userInfo.email}</div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
          <i className="fas fa-home mr-2"></i>Accueil
        </Link>

        {/* Inscription */}
        <div>
          <div
            onClick={() => setShowDrop1(!showDrop1)}
            className="sidebar-link flex justify-between items-center"
          >
            <span><i className="fas fa-user-plus mr-2"></i>Service Inscription</span>
            <i className={`fas fa-chevron-down transition-transform ${showDrop1 ? 'rotate-180' : 'rotate-0'}`}></i>
          </div>

          {showDrop1 && (
            <>
              <div className="sidebar-submenu">
                <Link
                  to="/inscription"
                  className={`sidebar-link ${isActive('/inscription')}`}
                >
                  Nouvelle inscription
                </Link>
              </div>

              <div className="sidebar-submenu">
                <Link
                  to="/impression"
                  className={`sidebar-link ${isActive('/impression')}`}
                >
                  Impression
                </Link>
              </div>
            </>
          )}

        </div>

        {/* Réinscription */}
        <div>
          <div onClick={() => setShowDrop2(!showDrop2)} className="sidebar-link flex justify-between items-center">
            <span><i className="fas fa-redo mr-2"></i>Service Réinscription</span>
            <i className={`fas fa-chevron-down transition-transform ${showDrop2 ? 'rotate-180' : 'rotate-0'}`}></i>
          </div>
          {showDrop2 && (
            <div className="sidebar-submenu">
              <Link to="/reinscription" className={`sidebar-link ${isActive('/reinscription')}`}>Réinscription</Link>
            </div>
          )}
        </div>

        {/* Étudiant */}
        <div>
          <div onClick={() => setShowDrop3(!showDrop3)} className="sidebar-link flex justify-between items-center">
            <span><i className="fas fa-user-graduate mr-2"></i>Service Étudiant</span>
            <i className={`fas fa-chevron-down transition-transform ${showDrop3 ? 'rotate-180' : 'rotate-0'}`}></i>
          </div>
          {showDrop3 && (
            <div className="sidebar-submenu">
              <Link to="/list-etudiants" className={`sidebar-link ${isActive('/list-etudiants')}`}>Liste Étudiants</Link>
            </div>
          )}
        </div>

        {/* Doublon */}
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

        {/* NOUVEAU : Paramètres Académiques */}
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

        {/* Bourses */}
        <Link to="/bourses" className={`sidebar-link ${isActive('/bourses')}`}>
          <i className="fas fa-hand-holding-usd mr-2"></i>Service Bourses
        </Link>

        {/* Paiement */}
        <Link to="/paiement" className={`sidebar-link ${isActive('/paiement')}`}>
          <i className="fas fa-credit-card mr-2"></i>Service Paiement
        </Link>

        {/* Authentification */}
        <Link to="/authentification" className={`sidebar-link ${isActive('/authentification')}`}>
          <i className="fas fa-sign-in-alt mr-2"></i>Service Authentification
        </Link>

        {/* Déconnexion */}
        <div onClick={() => setShowLogoutModal(true)} className="sidebar-link cursor-pointer mt-auto">
          <i className="fas fa-sign-out-alt mr-2"></i> Déconnexion
        </div>
      </div>

      {/* Modal Déconnexion */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation de déconnexion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Êtes-vous sûr de vouloir vous déconnecter ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleLogout}>Déconnexion</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Navbar;