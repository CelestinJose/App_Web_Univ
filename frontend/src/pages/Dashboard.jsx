import React, { useState, useEffect } from "react";
import { 
  FaUserGraduate, FaUniversity, FaMoneyBillWave, FaFileAlt, 
  FaChartLine, FaCalendarAlt, FaClock, FaArrowUp, FaArrowDown,
  FaIdCard, FaPrint, FaUserPlus, FaUserCheck 
} from "react-icons/fa";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { etudiantApi } from '../api'; // Import de l'API

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState({
    totalEtudiants: 0,
    etudiantsInscrits: 0,
    etudiantsReinscrits: 0,
    totalBoursiers: 0,
    montantTotalBourses: 0,
    demandesAttente: 0,
    certificatsGeneres: 0,
    cartesEtudiant: 0,
    parNiveau: {},
    parMois: {},
    tauxBoursiers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activites, setActivites] = useState([]);
  const user = localStorage.getItem("username") || "Administrateur";

  // Charger les données réelles de l'API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Récupérer les statistiques globales
        const statsResponse = await etudiantApi.getStats();
        if (statsResponse.data) {
          const apiStats = statsResponse.data;
          
          // Calculer les statistiques basées sur les données API
          const totalEtudiants = apiStats.total || 0;
          const etudiantsInscrits = apiStats.non_redoublants || 0;
          const etudiantsReinscrits = apiStats.redoublants || 0;
          const totalBoursiers = apiStats.boursiers || 0;
          const montantTotalBourses = apiStats.total_bourses || 0;
          
          setStats(prev => ({
            ...prev,
            totalEtudiants,
            etudiantsInscrits,
            etudiantsReinscrits,
            totalBoursiers,
            montantTotalBourses,
            tauxBoursiers: totalEtudiants > 0 ? (totalBoursiers / totalEtudiants * 100) : 0
          }));
        }
        
        // 2. Récupérer la liste des étudiants pour les graphiques
        const etudiantsResponse = await etudiantApi.getEtudiants({ page_size: 1000 });
        if (etudiantsResponse.data) {
          const etudiants = etudiantsResponse.data.results || etudiantsResponse.data;
          
          if (Array.isArray(etudiants)) {
            // Calculer la répartition par niveau
            const parNiveau = {
              'Licence 1': 0,
              'Licence 2': 0,
              'Licence 3': 0,
              'Master 1': 0,
              'Master 2': 0,
              'Doctorat': 0
            };
            
            // Calculer la répartition boursiers vs non-boursiers
            let boursiersCount = 0;
            let nonBoursiersCount = 0;
            
            etudiants.forEach(etudiant => {
              // Répartition par niveau
              if (etudiant.niveau) {
                if (etudiant.niveau.includes('Licence 1')) parNiveau['Licence 1']++;
                else if (etudiant.niveau.includes('Licence 2')) parNiveau['Licence 2']++;
                else if (etudiant.niveau.includes('Licence 3')) parNiveau['Licence 3']++;
                else if (etudiant.niveau.includes('Master 1')) parNiveau['Master 1']++;
                else if (etudiant.niveau.includes('Master 2')) parNiveau['Master 2']++;
                else if (etudiant.niveau.includes('Doctorat')) parNiveau['Doctorat']++;
              }
              
              // Répartition boursiers
              if (etudiant.boursier === 'OUI') boursiersCount++;
              else nonBoursiersCount++;
            });
            
            setStats(prev => ({
              ...prev,
              parNiveau,
              parNiveauArray: Object.values(parNiveau),
              boursiersData: [boursiersCount, nonBoursiersCount]
            }));
          }
        }
        
        // 3. Récupérer les activités récentes (si votre API le supporte)
        try {
          const activitesResponse = await etudiantApi.getActivites();
          if (activitesResponse.data) {
            setActivites(activitesResponse.data.slice(0, 6)); // Limiter à 6 activités
          } else {
            // Générer des activités simulées basées sur les données
            genererActivitesSimulees();
          }
        } catch (activitesError) {
          console.log("API d'activités non disponible, génération simulée");
          genererActivitesSimulees();
        }
        
        // 4. Récupérer les données mensuelles (si votre API le supporte)
        try {
          const mensuelResponse = await etudiantApi.getInscriptionsMensuelles();
          if (mensuelResponse.data) {
            setStats(prev => ({
              ...prev,
              parMois: mensuelResponse.data
            }));
          }
        } catch (mensuelError) {
          console.log("API mensuelle non disponible");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement du dashboard:", err);
        setError("Impossible de charger les données du dashboard");
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Fonction pour générer des activités simulées
  const genererActivitesSimulees = () => {
    const nomsEtudiants = ["RAKOTO Jean", "RASOA Marie", "RANDRIANARIVELO Paul", 
                          "RAZAFINDRAKOTO Alice", "RABE Marc", "RAHARIMANANA Julie"];
    const actions = [
      "Nouvel étudiant inscrit",
      "Certificat de scolarité généré",
      "Carte étudiante imprimée",
      "Bourse attribuée",
      "Réinscription validée",
      "Demande de document traitée"
    ];
    const delais = ["Il y a 10 min", "Il y a 25 min", "Il y a 40 min", "Il y a 1h", "Il y a 2h", "Il y a 3h"];
    
    const activitesSimulees = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      action: actions[i],
      user: nomsEtudiants[i],
      time: delais[i],
      icon: getIconForAction(actions[i])
    }));
    
    setActivites(activitesSimulees);
  };
  
  const getIconForAction = (action) => {
    switch(action) {
      case "Nouvel étudiant inscrit":
        return <FaUserPlus className="text-success" />;
      case "Certificat de scolarité généré":
      case "Demande de document traitée":
        return <FaFileAlt className="text-info" />;
      case "Carte étudiante imprimée":
        return <FaIdCard className="text-warning" />;
      case "Bourse attribuée":
        return <FaMoneyBillWave className="text-success" />;
      case "Réinscription validée":
        return <FaUserCheck className="text-primary" />;
      default:
        return <FaFileAlt className="text-secondary" />;
    }
  };

  // Données pour le graphique des inscriptions par niveau
  const chartDataNiveaux = {
    labels: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat'],
    datasets: [
      {
        label: 'Nombre d\'étudiants',
        data: stats.parNiveauArray || [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Données pour le graphique des inscriptions mensuelles
  const chartDataMensuel = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Inscriptions',
        data: stats.parMois?.inscriptions || [45, 52, 48, 65, 72, 85, 92, 88, 95, 102, 98, 110],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4
      },
      {
        label: 'Réinscriptions',
        data: stats.parMois?.reinscriptions || [12, 15, 18, 22, 25, 28, 30, 32, 35, 38, 40, 42],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  };

  // Données pour le graphique en camembert (boursiers vs non-boursiers)
  const chartDataBoursiers = {
    labels: ['Boursiers', 'Non boursiers'],
    datasets: [
      {
        data: stats.boursiersData || [0, 0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const optionsBar = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Répartition par niveau'
      }
    }
  };

  const optionsLine = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution des inscriptions mensuelles'
      }
    }
  };

  const optionsPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Répartition boursiers / Non boursiers'
      }
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Erreur de chargement</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">Veuillez vérifier votre connexion et réessayer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* En-tête */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-primary">
            <FaChartLine className="me-2" />
            Tableau de bord
          </h1>
          <p className="text-muted">
            Bienvenue, <span className="fw-bold">{user}</span> - Vue d'ensemble du système
          </p>
          <div className="text-muted">
            <FaCalendarAlt className="me-1" />
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start-primary border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Étudiants
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {stats.totalEtudiants.toLocaleString()}
                  </div>
                  <div className="mt-2 mb-0 text-muted">
                    <small>
                      <FaUserCheck className="me-1" />
                      {stats.etudiantsInscrits} inscrits ({stats.etudiantsReinscrits} réinscrits)
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="icon-circle bg-primary">
                    <FaUserGraduate className="text-white fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start-success border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-success text-uppercase mb-1">
                    Étudiants boursiers
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {stats.totalBoursiers.toLocaleString()}
                  </div>
                  <div className="mt-2 mb-0 text-muted">
                    <small>
                      <FaMoneyBillWave className="me-1" />
                      {stats.tauxBoursiers.toFixed(1)}% des étudiants
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="icon-circle bg-success">
                    <FaMoneyBillWave className="text-white fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start-info border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-info text-uppercase mb-1">
                    Montant total bourses
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {stats.montantTotalBourses.toLocaleString()} MGA
                  </div>
                  <div className="mt-2 mb-0 text-muted">
                    <small>
                      Moyenne: {stats.totalBoursiers > 0 ? 
                        Math.round(stats.montantTotalBourses / stats.totalBoursiers).toLocaleString() : 0} MGA/étudiant
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="icon-circle bg-info">
                    <FaUniversity className="text-white fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-start-warning border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                    Répartition par niveau
                  </div>
                  <div className="row no-gutters align-items-center">
                    <div className="col-auto">
                      <div className="h5 mb-0 me-3 fw-bold text-gray-800">
                        {Object.values(stats.parNiveau || {}).reduce((a, b) => a + b, 0)}
                      </div>
                    </div>
                    <div className="col">
                      <div className="mt-2 mb-0 text-muted">
                        <small>
                          <FaChartLine className="me-1" />
                          {Object.keys(stats.parNiveau || {}).length} niveaux
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="icon-circle bg-warning">
                    <FaPrint className="text-white fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deuxième ligne de cartes */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card bg-primary text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Inscrits (N)</div>
                  <div className="h3 mb-0">{stats.etudiantsInscrits}</div>
                </div>
                <div className="icon-circle bg-white">
                  <FaUserPlus className="text-primary fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Nouveaux étudiants</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card bg-warning text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Réinscrits (R)</div>
                  <div className="h3 mb-0">{stats.etudiantsReinscrits}</div>
                </div>
                <div className="icon-circle bg-white">
                  <FaUserCheck className="text-warning fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Étudiants redoublants</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card bg-success text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Ratio boursiers</div>
                  <div className="h3 mb-0">
                    {stats.tauxBoursiers.toFixed(1)}%
                  </div>
                </div>
                <div className="icon-circle bg-white">
                  <FaChartLine className="text-success fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Sur {stats.totalEtudiants} étudiants</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card bg-info text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Moyenne bourse</div>
                  <div className="h3 mb-0">
                    {stats.totalBoursiers > 0 ? 
                      Math.round(stats.montantTotalBourses / stats.totalBoursiers).toLocaleString() : 0} MGA
                  </div>
                </div>
                <div className="icon-circle bg-white">
                  <FaMoneyBillWave className="text-info fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Par étudiant boursier</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="row mb-4">
        <div className="col-xl-8 col-lg-7">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Évolution des inscriptions</h6>
            </div>
            <div className="card-body">
              <div className="chart-area">
                <Line data={chartDataMensuel} options={optionsLine} height={100} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-lg-5">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Répartition des boursiers</h6>
            </div>
            <div className="card-body">
              <div className="chart-pie">
                <Pie data={chartDataBoursiers} options={optionsPie} />
              </div>
              <div className="mt-4 text-center small">
                <span className="me-3">
                  <i className="fas fa-circle text-primary"></i> Boursiers ({stats.totalBoursiers})
                </span>
                <span>
                  <i className="fas fa-circle text-gray-300"></i> Non boursiers ({stats.totalEtudiants - stats.totalBoursiers})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dernière ligne : graphique bar et activités */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Répartition par niveau</h6>
            </div>
            <div className="card-body">
              <Bar data={chartDataNiveaux} options={optionsBar} />
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 fw-bold text-primary">Activités récentes</h6>
              <span className="badge bg-primary">{activites.length} nouvelles</span>
            </div>
            <div className="card-body">
              <div className="activity-feed">
                {activites.length > 0 ? (
                  activites.map((activite) => (
                    <div key={activite.id} className="feed-item mb-3">
                      <div className="d-flex align-items-start">
                        <div className="feed-icon me-3">
                          {activite.icon}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold">{activite.action}</div>
                          <div className="text-muted small">{activite.user}</div>
                          <div className="text-muted smaller">
                            <FaClock className="me-1" /> {activite.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-muted">
                    Aucune activité récente
                  </div>
                )}
              </div>
              <div className="text-center mt-3">
                <button className="btn btn-outline-primary btn-sm">
                  Voir toutes les activités
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 fw-bold text-primary">Résumé du système - Données en temps réel</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 text-center">
                  <div className="h4 text-primary">{stats.etudiantsInscrits}</div>
                  <div className="text-muted">Inscrits (N)</div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="h4 text-warning">{stats.etudiantsReinscrits}</div>
                  <div className="text-muted">Réinscrits (R)</div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="h4 text-success">
                    {stats.totalBoursiers}
                  </div>
                  <div className="text-muted">Boursiers</div>
                </div>
                <div className="col-md-3 text-center">
                  <div className="h4 text-info">
                    {stats.montantTotalBourses.toLocaleString()} MGA
                  </div>
                  <div className="text-muted">Bourses totales</div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6 text-center">
                  <div className="text-muted">
                    <small>Total étudiants: <strong>{stats.totalEtudiants}</strong></small>
                  </div>
                </div>
                <div className="col-md-6 text-center">
                  <div className="text-muted">
                    <small>Taux de boursiers: <strong>{stats.tauxBoursiers.toFixed(1)}%</strong></small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
        }
        .chart-area, .chart-pie {
          position: relative;
          height: 300px;
        }
        .activity-feed {
          max-height: 300px;
          overflow-y: auto;
        }
        .feed-item {
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .feed-item:last-child {
          border-bottom: none;
        }
        .feed-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background-color: #f8f9fa;
        }
        .border-start-3 {
          border-left-width: 3px !important;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;