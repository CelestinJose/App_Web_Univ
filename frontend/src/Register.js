import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("success");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation du mot de passe
    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas ❌");
      setType("danger");
      return;
    }
    
    // Validation de la force du mot de passe
    if (password.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères ❌");
      setType("danger");
      return;
    }
    
    axios.post("http://127.0.0.1:8000/api/register/", { email, password })
      .then(res => {
        setMessage("Inscription réussie ! Vérifiez votre email pour confirmer votre compte 📧");
        setType("success");
        // Redirection après un petit délai
        setTimeout(() => navigate("/validate"), 2000);
      })
      .catch(err => {
        if (err.response && err.response.data && err.response.data.error) {
          setMessage("Erreur: " + err.response.data.error);
          setType("danger");
        } else {
          setMessage("Erreur: " + err.message);
          setType("danger");
        }
      });
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Section d'accueil à gauche */}
        <div className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center bg-success text-white p-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-4">Bienvenue !</h1>
            <p className="lead mb-4">Rejoignez notre communauté et commencez votre parcours</p>

            {/* Image d'inscription */}
            <div className="mb-4">
              <img
                src="https://images.unsplash.com/photo-1551836026-d5c2c5af78e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                alt="Inscription"
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: "300px", objectFit: "cover" }}
              />
            </div>

            <div className="mt-5">
              <p className="fst-italic">
                "Le premier pas vers l'avenir commence par une inscription."
              </p>
              <div className="mt-4">
                <h5>Pourquoi nous rejoindre ?</h5>
                <ul className="list-unstyled text-start mt-3">
                  <li className="mb-2"><i className="fas fa-check-circle me-2"></i> Accès à toutes les fonctionnalités</li>
                  <li className="mb-2"><i className="fas fa-check-circle me-2"></i> Support technique dédié</li>
                  <li className="mb-2"><i className="fas fa-check-circle me-2"></i> Mises à jour régulières</li>
                  <li><i className="fas fa-check-circle me-2"></i> Communauté active</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section d'inscription à droite */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-4">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <form onSubmit={handleSubmit} className="border p-4 rounded shadow">
              <h2 className="text-center mb-4 text-success">Inscription</h2>

              {/* Message pour les petits écrans */}
              <div className="d-block d-md-none text-center mb-4">
                <h4 className="text-success">Rejoignez-nous !</h4>
                <p className="text-muted">Créez votre compte pour commencer</p>
              </div>

              {/* Affichage du message Bootstrap */}
              {message && (
                <div className={`alert alert-${type} text-center`} role="alert">
                  {message}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                />
                <small className="text-muted">Nous vous enverrons un email de confirmation</small>
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
                <small className="text-muted">Minimum 6 caractères</small>
              </div>

              <div className="mb-4">
                <label className="form-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn btn-success w-100 py-2">
                <i className="fas fa-user-plus me-2"></i>
                S'inscrire
              </button>

              {/* Conditions d'utilisation */}
              <div className="form-check mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="terms"
                  required
                />
                <label className="form-check-label small" htmlFor="terms">
                  J'accepte les <Link to="/terms" className="text-decoration-none">conditions d'utilisation</Link> et la <Link to="/privacy" className="text-decoration-none">politique de confidentialité</Link>
                </label>
              </div>

              {/* Lien vers la connexion */}
              <div className="text-center mt-4">
                <Link to="/login" className="text-decoration-none text-primary">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Déjà un compte ? Connectez-vous
                </Link>
              </div>

              {/* Séparateur optionnel */}
              {/* <div className="text-center mt-4">
                <hr className="text-muted" />
                <small className="text-muted">© 2025 Votre Application. Tous droits réservés.</small>
              </div> */}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;