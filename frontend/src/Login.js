// src/pages/Login.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");  // Changer email par username
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("success");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log(password)
    
    try {
      console.log(password)
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        {
          username: username,  // Envoyer username au lieu de email
          password: password
        }
      );

      if (response.data && response.data.access) {
        // Stocker le token JWT
        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);

        // Stocker les infos utilisateur
        localStorage.setItem("user_email", response.data.email || username);
        localStorage.setItem("user_role", response.data.role || '');
        localStorage.setItem("user_name", response.data.username || '');
        localStorage.setItem("user_id", response.data.user_id || '');

        setMessage("Connexion réussie ✅");
        setType("success");

        // Rediriger selon le rôle
        setTimeout(() => {
          if (response.data.role === 'administrateur') {
            navigate("/authentification");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Erreur de connexion:", err);

      if (err.response) {
        switch (err.response.status) {
          case 401:
            setMessage("Nom d'utilisateur ou mot de passe incorrect");
            break;
          case 400:
            if (err.response.data?.detail) {
              setMessage(err.response.data.detail);
            } else {
              setMessage("Données invalides");
            }
            break;
          default:
            setMessage(`Erreur serveur: ${err.response.status}`);
        }
      } else if (err.request) {
        setMessage("Erreur réseau. Le serveur ne répond pas.");
      } else {
        setMessage("Erreur: " + err.message);
      }
      setType("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Section d'accueil à gauche */}
        <div className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center bg-primary text-white p-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-4">Bienvenue !</h1>
            {/* <p className="lead mb-4">Système de Gestion Scolaire</p> */}

            {/* Logo ou image */}
            <div className="mb-4">
              <i className="fas fa-graduation-cap fa-6x"></i>
            </div>

            <div className="mt-5">
              <p className="fst-italic">
                "Gérez efficacement les étudiants, les inscriptions et les paiements"
              </p>
            </div>
          </div>
        </div>

        {/* Section de login à droite */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-4">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <form onSubmit={handleSubmit} className="border p-4 rounded shadow">
              <h2 className="text-center mb-4 text-primary">Connexion</h2>

              {/* Message pour les petits écrans */}
              <div className="d-block d-md-none text-center mb-4">
                <h4 className="text-primary">Bienvenue !</h4>
                <p className="text-muted">Connectez-vous pour continuer</p>
              </div>

              {/* Affichage du message */}
              {message && (
                <div className={`alert alert-${type} text-center`} role="alert">
                  {message}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Nom d'utilisateur</label> {/* Changer le label */}
                <input
                  type="text"  // Changer de email à text
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Connexion...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Se connecter
                  </>
                )}
              </button>

              {/* Informations sur les comptes de démo */}
              <div className="mt-3 p-3 bg-light rounded">
                {/* <small className="text-muted">
                  <strong>Comptes de test :</strong><br />
                  • Admin: <strong>admin</strong> / 123456<br />
                  • Scolarité: <strong>scolarite</strong> / 123456<br />
                  • Bourse: <strong>bourse</strong> / 123456<br />
                  • Finance: <strong>finance</strong> / 123456
                </small> */}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;