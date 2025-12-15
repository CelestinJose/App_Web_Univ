import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../services/constants";
import LoadingIndicator from "./LoadingIndicator";
import { toast } from "react-toastify";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [charge, setCharge] = useState(0);
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const res = await api.post('/api/token/', {
                username,
                password,
            });

            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

            // Simuler le chargement jusqu'à 100%
            for (let i = 0; i <= 100; i++) {
                setCharge(i);
                await new Promise((resolve) => setTimeout(resolve, 20));
            }

            navigate("/Dashboard");
        } catch (error) {
            if (error.response && error.response.status === 401) {
                toast.error("Aucun compte actif trouvé avec les identifiants fournis");
            } else {
                toast.error(error.response?.data?.detail || "Une erreur est survenue");
            }
        } finally {
            setLoading(false);
            setCharge(0);
        }
    };

    return (
        <div className="relative">
            {loading && <LoadingIndicator charge={charge} />}
            {!loading && (
                <form onSubmit={handleSubmit} className="form-container mt-[1px] text-left">
                    <h1 className="text-2xl font-semibold mt-[0] mb-6 text-center">Authentification</h1>
                    <input
                        className="form-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nom d'utilisateur"
                        required
                    />
                    {errors.username && <span className="error-text text-danger">{errors.username}</span>}
                    <input
                        className="form-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mot de passe"
                        required
                    />
                    {errors.password && <span className="error-text text-danger">{errors.password}</span>}
                    <button className="form-button" type="submit">Connecter</button>
                </form>
            )}
        </div>
    );
}

export default LoginForm;