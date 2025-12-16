import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import api from '../api'; // Import corrigé
import './Navbar.css';

const Navbar = () => {
  const [showSide, setShowSide] = useState(true);
  const [showDrop1, setShowDrop1] = useState(false); // Inscription
  const [showDrop2, setShowDrop2] = useState(false); // Réinscription
  const [showDrop3, setShowDrop3] = useState(false); // Étudiant
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    first_name: 'Utilisateur',
    username: 'user',
    email: 'email@example.com'
  });

  const location = useLocation();
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      // Utiliser l'API configurée
      const res = await api.get('/user-info/');
      setUserInfo({
        first_name: res.data.first_name || 'Utilisateur',
        username: res.data.username || 'user',
        email: res.data.email || 'email@example.com'
      });
    } catch (err) {
      console.error("Erreur récupération utilisateur:", err);
      // Continuer avec les valeurs par défaut
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
    if (token) {
      fetchUser();
    }
    
    const handleResize = () => {
      if (window.innerWidth < 720) setShowSide(false);
      else setShowSide(true);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSideBar = () => setShowSide(!showSide);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    // Supprimer tous les tokens possibles
    localStorage.removeItem("access_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("refreshToken");
    
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <div className="w-[185px] bg-blue-600 text-white h-full flex flex-col">
      <div className="h-[50px] flex items-center justify-center text-lg font-bold border-b border-blue-500">
        EDU-UNIV/TUL
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
            <div className="sidebar-submenu">
              <Link to="/inscription" className={`sidebar-link ${isActive('/inscription')}`}>
                Nouvelle inscription
              </Link>
            </div>
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