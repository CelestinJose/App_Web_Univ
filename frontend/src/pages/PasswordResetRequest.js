import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("info");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    axios.post("http://127.0.0.1:8000/api/password-reset-request/", { email })
      .then(res => {
        setMessage("✅ Code envoyé ! Vérifiez votre boîte email");
        setType("success");
        setLoading(false);
        // Redirection automatique vers la page reset-password
        setTimeout(() => navigate("/reset-password"), 2000);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || err.message;
        setMessage(`❌ Erreur: ${errorMsg}`);
        setType("danger");
        setLoading(false);
      });
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Section d'information à gauche */}
        <div className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center bg-info text-white p-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-4">Mot de passe oublié ?</h1>
            <p className="lead mb-4">Pas de panique, nous allons vous aider à le réinitialiser</p>

            {/* Image d'aide */}
            <div className="mb-4">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                alt="Réinitialisation mot de passe"
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: "300px", objectFit: "cover" }}
              />
            </div>

            <div className="mt-5">
              <h5 className="mb-3">Procédure de récupération :</h5>
              <ol className="text-start ps-4">
                <li className="mb-2">
                  <i className="fas fa-envelope me-2"></i>
                  Entrez votre email ci-contre
                </li>
                <li className="mb-2">
                  <i className="fas fa-key me-2"></i>
                  Recevez un code de réinitialisation
                </li>
                <li className="mb-2">
                  <i className="fas fa-lock me-2"></i>
                  Saisissez votre nouveau mot de passe
                </li>
                <li>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Connectez-vous avec vos nouveaux identifiants
                </li>
              </ol>
              
              <div className="alert alert-light text-dark mt-4" role="alert">
                <i className="fas fa-shield-alt me-2 text-info"></i>
                <strong>Sécurité :</strong> Le code de réinitialisation est valable 15 minutes
              </div>
            </div>
          </div>
        </div>

        {/* Section formulaire à droite */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-4">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <form onSubmit={handleSubmit} className="border p-4 rounded shadow">
              <h2 className="text-center mb-4 text-info">Réinitialisation</h2>

              {/* Message pour les petits écrans */}
              <div className="d-block d-md-none text-center mb-4">
                <h4 className="text-info">Mot de passe oublié</h4>
                <p className="text-muted">Entrez votre email pour recevoir un code</p>
              </div>

              {/* Affichage du message */}
              {message && (
                <div className={`alert alert-${type} text-center`} role="alert">
                  {message}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label">
                  <i className="fas fa-envelope me-2 text-info"></i>
                  Adresse email
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  disabled={loading}
                />
                <small className="text-muted">
                  Entrez l'email associé à votre compte
                </small>
              </div>

              <button 
                type="submit" 
                className="btn btn-info w-100 py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Envoyer le code
                  </>
                )}
              </button>

              {/* Bouton retour */}
              <Link to="/login" className="btn btn-outline-secondary w-100 py-2 mb-3">
                <i className="fas fa-arrow-left me-2"></i>
                Retour à la connexion
              </Link>

              {/* Liens utiles */}
              <div className="text-center mt-4">
                <p className="text-muted mb-2">Vous n'avez pas de compte ?</p>
                <Link to="/register" className="text-decoration-none text-success">
                  <i className="fas fa-user-plus me-1"></i>
                  Créer un compte
                </Link>
              </div>

              {/* Assistance */}
              <div className="alert alert-light border mt-4" role="alert">
                <h6 className="alert-heading">
                  <i className="fas fa-headset me-2 text-info"></i>
                  Assistance
                </h6>
                <p className="mb-0 small">
                  Si vous ne recevez pas l'email, vérifiez vos spams ou contactez le support :
                  <a href="mailto:support@example.com" className="text-decoration-none ms-1">support@example.com</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetRequest;