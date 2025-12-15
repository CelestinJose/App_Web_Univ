import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import LoadingIndicator from "./LoadingIndicator";
import { toast } from "react-toastify";

function RegisterForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [charge, setCharge] = useState(0);
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
                await api.post('/api/user/register/', {
                username,
                password,
                email,
                first_name: firstName,
                last_name: lastName,
            });

            toast.success("Inscription réussie ! Bienvenue parmi nous.");

            // Simuler le chargement jusqu'à 100%
            for (let i = 0; i <= 100; i++) {
                setCharge(i);
                await new Promise((resolve) => setTimeout(resolve, 20));
            }

            navigate("/login");
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setErrors(error.response.data);
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
                    <h1 className="text-2xl font-semibold mt-[0] mb-6 text-center">Inscriptions</h1>
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
                    <button className="form-button" type="submit">S'inscrire</button>
                </form>
            )}
        </div>
    );
}

export default RegisterForm;