import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import jsPDF from 'jspdf';
import "jspdf-autotable";
import axios from 'axios';

export default function Component() {
    const [familles, setFamilles] = useState([]);
    const [panneaux, setPanneaux] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [filteredBatteries, setFilteredBatteries] = useState([]);
    const [onduleurs, setOnduleurs] = useState([]);
    const [regulateurs, setRegulateurs] = useState([]);
    const [selectedFamille, setSelectedFamille] = useState('');
    const [selectedPanneau, setSelectedPanneau] = useState('');
    const [selectedBatterie, setSelectedBatterie] = useState('');
    const [selectedOnduleur, setSelectedOnduleur] = useState('');
    const [selectedRegulateur, setSelectedRegulateur] = useState('');
    const [result, setResult] = useState({ famille: null, dimensionnement: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Chargement des données et récupération du résultat stocké
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [famillesData, panneauxData, batteriesData, onduleursData, regulateursData] = await Promise.all([
                    axios.get('https://localhost:8000/api/familles/'),
                    axios.get('https://localhost:8000/api/panneaux/'),
                    axios.get('https://localhost:8000/api/batteries/'),
                    axios.get('https://localhost:8000/api/onduleurs/'),
                    axios.get('https://localhost:8000/api/regulateurs/'),
                ]);
                setFamilles(famillesData.data);
                setPanneaux(panneauxData.data);
                setBatteries(batteriesData.data);
                setFilteredBatteries(batteriesData.data); // Initialiser les batteries filtrées
                setOnduleurs(onduleursData.data);
                setRegulateurs(regulateursData.data);

                // Récupérer le résultat du local storage
                const storedResult = localStorage.getItem('dimensionnementResult');
                if (storedResult) {
                    setResult(JSON.parse(storedResult));
                }
            } catch (err) {
                console.error('Erreur lors du fetch des données:', err);
                setError('Impossible de charger les données. Veuillez réessayer.');
            }
        };

        fetchData();
    }, []);

    const calculateDimensionnement = async (event) => {
        event.preventDefault();

        if (!selectedFamille || !selectedPanneau || !selectedOnduleur) {
            toast.error('Veuillez remplir tous les champs.');
            return;
        }

        try {
            const consommationResponse = await axios.get(`https://localhost:8000/api/familles/${selectedFamille}/consommations/`);
            const consommationData = consommationResponse.data;

            if (!Array.isArray(consommationData)) {
                toast.error('Données de consommation non valides.');
                return;
            }

            // Calcul de la consommation totale
            const consommationTotale = consommationData.reduce((total, item) => {
                return total + (item.puissance || 0) * (item.duree_utilisation_quotidienne || 0) * (item.nombres || 1);
            }, 0);

            // Calcul de la puissance continue totale
            const puissanceContinueTotale = consommationData.reduce((total, item) => {
                return total + (item.puissance || 0);
            }, 0);

            // Assurez-vous que la batterie sélectionnée est bien dans la liste filtrée
            const batterie = filteredBatteries.find(b => b.id === parseInt(selectedBatterie));
            if (!batterie) {
                toast.error('Veuillez sélectionner une batterie valide.');
                return;
            }

            // Supposons que vous avez déjà les données sur les régulateurs
            const regulateur = regulateurs.find(r => r.id === parseInt(selectedRegulateur));
            const capaciteRegulateur = regulateur.Tension_entree_maximale * regulateur.Courant_charge_nominal;

            // Calcul de la puissance totale générée par les panneaux solaires
            const panneau = panneaux.find(p => p.id === parseInt(selectedPanneau));
            const productionPanneau = panneau.puissance_nominale * panneau.irradiation_solaire_moyenne;
            const panneauCapacite = consommationTotale / (panneau.irradiation_solaire_moyenne * 0.65);
            const nombrePanneaux = Math.ceil(panneauCapacite / panneau.puissance_nominale);

            // Calcul du nombre de régulateurs nécessaires
            const puissanceGenererTotale = nombrePanneaux * panneau.puissance_nominale;
            const nombreRegulateurs = Math.ceil(puissanceGenererTotale / capaciteRegulateur);

            // Calcul du nombre d'onduleurs nécessaires
            const onduleur = onduleurs.find(b => b.id === parseInt(selectedOnduleur));
            const puissance_utile = onduleur.puissance_nominale * (onduleur.rendement_ond / 100);
            const nombreOnduleurs = Math.ceil(puissanceContinueTotale / puissance_utile);

            // Capacité de stockage requise en Wh
            const capaciteStockageRequiseWh = consommationTotale / batterie.tension; // Consommation totale en Wh

            // Capacité totale des batteries en Ah
            const capaciteTotaleBatteriesAh = capaciteStockageRequiseWh * (batterie.autonomie / (batterie.DOD / 100)) / (batterie.rendement / 100);

            // Calcul du nombre de batteries nécessaires
            const nombreBatteries = Math.ceil(capaciteTotaleBatteriesAh / batterie.capacite); 

            // Récupération des données de la famille sélectionnée
            const selectedFamilleData = familles.find(f => f.id === parseInt(selectedFamille));

            // Mise à jour du résultat et stockage dans le local storage
            const newResult = {
                dimensionnement: {
                    nombre_panneaux: nombrePanneaux,
                    nombre_batteries: nombreBatteries,
                    capacite_panneau: panneauCapacite,
                    nombre_onduleurs: nombreOnduleurs,
                    nombre_regulateurs: nombreRegulateurs,
                    capacite_batterie: capaciteTotaleBatteriesAh,
                    production_panneau: productionPanneau,
                    panneau_details: `${panneau.marque} ${panneau.modele} (Puissance nominale: ${panneau.puissance_nominale}W Irradiation solaire moyenne: ${panneau.irradiation_solaire_moyenne})`,
                    batterie_details: `${batterie.marque} ${batterie.modele} (Capacité: ${batterie.capacite}Ah, Tension: ${batterie.tension}V Autonomie: ${batterie.autonomie}j)`,
                    onduleur_details: `${onduleur.marque} ${onduleur.modele} (Puissance nominale: ${onduleur.puissance_nominale}W, Rendement: ${onduleur.rendement_ond}%)`,
                    consommation_totale: consommationTotale,
                    famille: {
                        nom_fam: selectedFamilleData?.nom_fam,
                        prenom_fam: selectedFamilleData?.prenom_fam
                    }
                },
            };

            setResult(newResult);
            localStorage.setItem('dimensionnementResult', JSON.stringify(newResult)); // Sauvegarder le nouveau résultat

        } catch (error) {
            console.error('Erreur lors du calcul:', error);
            toast.error('Erreur lors du calcul du dimensionnement.');
        }
    };

    return (
        <div className="p-6 mt-2">
            <ToastContainer position="top-right" autoClose={5000} />
            
            <h1 className="text-3xl font-semibold mb-6 text-center text-blue-600">Dimensionnement</h1>
            
            <Form onSubmit={calculateDimensionnement}>
                {/* Groupes de formulaires */}
                <Form.Group controlId="formFamille">
                    <Form.Label><strong>Famille :</strong></Form.Label>
                    <Form.Control as="select" value={selectedFamille} onChange={(e) => setSelectedFamille(e.target.value)}>
                        <option value="">Sélectionner une famille</option>
                        {familles.map(famille => (
                            <option key={famille.id} value={famille.id}>
                                {famille.nom_fam} {famille.prenom_fam}
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>

                {/* Autres champs pour panneaux, batteries... */}

                <Button type="submit">Calculer</Button>
                
                {error && (
                    <Alert variant="danger" className="mt-3">{error}</Alert>
                )}
                
                {result.dimensionnement && (
                    <div className="result-details mt-4 p-4 border border-gray-300 rounded shadow-lg bg-white">
                        <h3 className="mb-4 text-xl font-semibold">Détails du Dimensionnement</h3>
                        {/* Affichage des résultats ici */}
                    </div>
                )}
                
             </Form>
        </div>
    );
}