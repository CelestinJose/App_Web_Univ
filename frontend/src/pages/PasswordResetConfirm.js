import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function PasswordResetConfirm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("info");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation du mot de passe
    if (newPassword !== confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas");
      setType("danger");
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage("❌ Le mot de passe doit contenir au moins 6 caractères");
      setType("danger");
      return;
    }
    
    setLoading(true);
    
    axios.post("http://127.0.0.1:8000/api/password-reset-confirm/", {
      email,
      code,
      new_password: newPassword
    })
    .then(res => {
      setMessage("✅ Mot de passe réinitialisé avec succès !");
      setType("success");
      setLoading(false);
      
      // Redirection vers la page de connexion après 3 secondes
      setTimeout(() => navigate("/login"), 3000);
    })
    .catch(err => {
      const errorMsg = err.response?.data?.error || err.message;
      setMessage(`❌ Erreur: ${errorMsg}`);
      setType("danger");
      setLoading(false);
    });
  };

  const handleResendCode = () => {
    if (!email) {
      setMessage("❌ Veuillez entrer votre email pour renvoyer le code");
      setType("danger");
      return;
    }
    
    setLoading(true);
    
    axios.post("http://127.0.0.1:8000/api/password-reset-request/", { email })
      .then(res => {
        setMessage("📧 Nouveau code envoyé ! Vérifiez votre boîte email");
        setType("success");
        setLoading(false);
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
        <div className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center bg-success text-white p-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-4">Nouveau mot de passe</h1>
            <p className="lead mb-4">Créez un mot de passe sécurisé pour votre compte</p>

            {/* Image de sécurité */}
            <div className="mb-4">
              <img
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                alt="Sécurité mot de passe"
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: "300px", objectFit: "cover" }}
              />
            </div>

            <div className="mt-5">
              <h5 className="mb-3">Conseils de sécurité :</h5>
              <ul className="text-start ps-4">
                <li className="mb-2">
                  <i className="fas fa-check-circle me-2"></i>
                  Minimum 6 caractères
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle me-2"></i>
                  Utilisez des majuscules et minuscules
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle me-2"></i>
                  Ajoutez des chiffres et symboles
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle me-2"></i>
                  Évitez les mots courants
                </li>
                <li>
                  <i className="fas fa-check-circle me-2"></i>
                  Ne réutilisez pas d'anciens mots de passe
                </li>
              </ul>
              
              <div className="alert alert-light text-dark mt-4" role="alert">
                <i className="fas fa-shield-alt me-2 text-success"></i>
                <strong>Important :</strong> Après réinitialisation, vous serez redirigé vers la page de connexion
              </div>
            </div>
          </div>
        </div>

        {/* Section formulaire à droite */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-4">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <form onSubmit={handleSubmit} className="border p-4 rounded shadow">
              <h2 className="text-center mb-4 text-success">Nouveau mot de passe</h2>

              {/* Message pour les petits écrans */}
              <div className="d-block d-md-none text-center mb-4">
                <h4 className="text-success">Définir un nouveau mot de passe</h4>
                <p className="text-muted">Entrez le code reçu et votre nouveau mot de passe</p>
              </div>

              {/* Affichage du message */}
              {message && (
                <div className={`alert alert-${type} text-center`} role="alert">
                  {message}
                  {type === "success" && (
                    <div className="mt-2">
                      <small>Redirection vers la page de connexion...</small>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-envelope me-2 text-success"></i>
                  Email
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
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-key me-2 text-success"></i>
                  Code de réinitialisation
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="123456"
                  maxLength="6"
                  disabled={loading}
                />
                <small className="text-muted">Code à 6 chiffres reçu par email</small>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <i className="fas fa-lock me-2 text-success"></i>
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
                <small className="text-muted">Minimum 6 caractères</small>
              </div>

              <div className="mb-4">
                <label className="form-label">
                  <i className="fas fa-lock me-2 text-success"></i>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-success w-100 py-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Réinitialiser le mot de passe
                  </>
                )}
              </button>

              {/* Bouton pour renvoyer le code */}
              <button 
                type="button" 
                onClick={handleResendCode}
                className="btn btn-outline-secondary w-100 py-2 mb-3"
                disabled={loading}
              >
                <i className="fas fa-redo me-2"></i>
                Renvoyer le code
              </button>

              {/* Lien vers la demande de réinitialisation */}
              <div className="text-center mt-3">
                <Link to="/password-reset-request" className="text-decoration-none text-info">
                  <i className="fas fa-arrow-left me-1"></i>
                  Retour à la demande de réinitialisation
                </Link>
              </div>

              {/* Lien vers la connexion */}
              <div className="text-center mt-2">
                <Link to="/login" className="text-decoration-none text-primary">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Retour à la connexion
                </Link>
              </div>

              {/* Aide supplémentaire */}
              <div className="alert alert-light border mt-4" role="alert">
                <h6 className="alert-heading">
                  <i className="fas fa-clock me-2 text-success"></i>
                  Validité du code
                </h6>
                <p className="mb-0 small">
                  Le code de réinitialisation est valable pendant 15 minutes.
                  S'il a expiré, cliquez sur "Renvoyer le code".
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordResetConfirm;