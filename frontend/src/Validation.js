import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Validation() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);
  const [type, setType] = useState("success");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://127.0.0.1:8000/api/validate/", { email, code })
      .then(res => {
        setMessage("✅ Compte validé avec succès ! Vous pouvez maintenant vous connecter");
        setType("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || err.message;
        setMessage(`❌ Erreur: ${errorMsg}`);
        setType("danger");
      });
  };

  const handleResendCode = () => {
    if (!email) {
      setMessage("❌ Veuillez entrer votre email pour renvoyer le code");
      setType("danger");
      return;
    }
    
    axios.post("http://127.0.0.1:8000/api/resend-code/", { email })
      .then(res => {
        setMessage("📧 Nouveau code envoyé ! Vérifiez votre boîte email");
        setType("success");
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || err.message;
        setMessage(`❌ Erreur: ${errorMsg}`);
        setType("danger");
      });
  };

  return (
    <div className="container-fluid vh-100">
      <div className="row h-100">
        {/* Section d'information à gauche */}
        <div className="col-md-6 d-none d-md-flex flex-column justify-content-center align-items-center bg-warning text-dark p-5">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-4">Validation du compte</h1>
            <p className="lead mb-4">Finalisez votre inscription en confirmant votre email</p>

            {/* Image de validation */}
            <div className="mb-4">
              <img
                src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                alt="Validation"
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: "300px", objectFit: "cover" }}
              />
            </div>

            <div className="mt-5">
              <h5 className="mb-3">Comment ça marche ?</h5>
              <ol className="text-start ps-4">
                <li className="mb-2">1. Entrez l'email utilisé lors de l'inscription</li>
                <li className="mb-2">2. Saisissez le code à 6 chiffres reçu par email</li>
                <li className="mb-2">3. Cliquez sur "Valider mon compte"</li>
                <li>4. Vous serez redirigé vers la page de connexion</li>
              </ol>
              
              <div className="alert alert-info mt-4" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                Le code est valable pendant 24 heures. Vérifiez vos spams si vous ne l'avez pas reçu.
              </div>
            </div>
          </div>
        </div>

        {/* Section de validation à droite */}
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-4">
          <div className="w-100" style={{ maxWidth: "400px" }}>
            <form onSubmit={handleSubmit} className="border p-4 rounded shadow">
              <h2 className="text-center mb-4 text-warning">Validation</h2>

              {/* Message pour les petits écrans */}
              <div className="d-block d-md-none text-center mb-4">
                <h4 className="text-warning">Validez votre compte</h4>
                <p className="text-muted">Entrez le code reçu par email</p>
              </div>

              {/* Affichage du message Bootstrap */}
              {message && (
                <div className={`alert alert-${type} text-center`} role="alert">
                  {message}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                />
                <small className="text-muted">L'email utilisé lors de l'inscription</small>
              </div>

              <div className="mb-4">
                <label className="form-label">
                  Code de validation
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="123456"
                  maxLength="6"
                />
                <small className="text-muted">Code à 6 chiffres reçu par email</small>
              </div>

              <button type="submit" className="btn btn-warning w-100 py-2 mb-3">
                <i className="fas fa-check-circle me-2"></i>
                Valider mon compte
              </button>

              {/* Bouton pour renvoyer le code */}
              <button 
                type="button" 
                onClick={handleResendCode}
                className="btn btn-outline-secondary w-100 py-2 mb-3"
              >
                <i className="fas fa-redo me-2"></i>
                Renvoyer le code
              </button>

              {/* Lien vers l'inscription */}
              <div className="text-center mt-3">
                <p className="text-muted mb-2">Vous n'avez pas encore de compte ?</p>
                <Link to="/register" className="text-decoration-none text-success">
                  <i className="fas fa-user-plus me-1"></i>
                  Créer un compte
                </Link>
              </div>

              {/* Lien vers la connexion */}
              <div className="text-center mt-2">
                <p className="text-muted mb-2">Déjà validé votre compte ?</p>
                <Link to="/login" className="text-decoration-none text-primary">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Se connecter
                </Link>
              </div>

              {/* Aide supplémentaire */}
              <div className="alert alert-light border mt-4" role="alert">
                <h6 className="alert-heading">
                  <i className="fas fa-question-circle me-2 text-warning"></i>
                  Besoin d'aide ?
                </h6>
                <p className="mb-0 small">
                  Si vous rencontrez des problèmes, contactez le support à 
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

export default Validation;