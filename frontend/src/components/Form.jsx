import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../services/constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function Form({ route, method }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [charge, setCharge] = useState(0); // État pour le pourcentage de chargement
    const navigate = useNavigate();
    const [errors, setErrors] = useState({}); // État pour stocker les erreurs

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({}); // Réinitialiser les erreurs avant chaque soumission

        try {
            const res = await api.post(route, {
                username,
                password,
                email,
                first_name: firstName,
                last_name: lastName,
            });

            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                // toast.success(
                //     <span>
                //         Bienvenue, <strong>{username}</strong> ! Heureux de vous revoir.
                //     </span>
                // );

                // Simuler le chargement jusqu'à 100%
                for (let i = 0; i <= 100; i++) {
                    setCharge(i);
                    await new Promise((resolve) => setTimeout(resolve, 20)); // Délai pour simuler le chargement
                }

                navigate("/Dashboard"); // Redirection vers la page d'accueil
            } else {
                toast.success("Inscription réussie ! Bienvenue parmi nous.");
                // Simuler le chargement jusqu'à 100%
                for (let i =  0; i <= 100; i++) {
                    setCharge(i);
                    await new Promise((resolve) => setTimeout(resolve, 20)); // Délai pour simuler le chargement
                }

                navigate("/login"); // Redirection vers la page de connexion après inscription
            }            
        } catch (error) {
            // Vérifier si ce sont des erreurs de validation
            if (error.response && error.response.status === 400) {
                setErrors(error.response.data); // Récupérer les erreurs et les stocker
            } else if (error.response?.status === 401) {
                // Erreur de connexion incorrecte
                toast.error("Aucun compte actif trouvé avec les identifiants fournis");
            } else {
                toast.error(error.response?.data?.detail || "Une erreur est survenue");
            }
        } finally {
            setLoading(false);
            setCharge(0); // Réinitialiser le pourcentage de chargement
        }
    };

    return (
        <div className="relative">
            {loading && <LoadingIndicator charge={charge} />}
            {!loading && ( // Afficher le formulaire uniquement si pas en chargement
                <form onSubmit={handleSubmit} className="form-container mt-[1px] text-left">
                    <h1 className="text-2xl font-semibold mt-[0] mb-6 text-center">{method === "login" ? "Authentification" : "Inscriptions"}</h1>
                    {method === "register" && (
                        <>
                            <input
                                className="form-input"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Prénom"
                                required
                            />
                            {errors.first_name && <span className="error-text text-danger">{errors.first_name}</span>}
                            <input
                                className="form-input"
                                type="text"
                                value={lastName}
 onChange={(e) => setLastName(e.target.value)}
                                placeholder="Nom"
                                required
                            />
                            {errors.last_name && <span className="error-text text-danger">{errors.last_name}</span>}
                            <input
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                            />
                            {errors.email && <span className="error-text text-danger">{errors.email}</span>}
                        </>
                    )}
                    <input
                        className="form-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nom d'utilisateur"
                    />
                    {errors.username && <span className="error-text text-danger text-left">{errors.username}</span>}
                    <input
                        className="form-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                    />
                    {errors.password && <span className="error-text text-danger">{errors.password}</span>}
                    <button className="form-button" type="submit">
                        {method === "login" ? "Connecter" : "S'inscrire"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default Form;