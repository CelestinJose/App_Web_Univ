import React, { useState, useEffect } from "react";
import {
  FaUserGraduate, FaUniversity, FaMoneyBillWave,
  FaChartLine, FaCalendarAlt, FaClock, FaUserPlus, FaUserCheck, FaRedo, FaUserTimes
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
    triplants: 0,
    totalBoursiers: 0,
    montantTotalBourses: 0,
    tauxBoursiers: 0,
    parNiveau: {},
    parMois: {
      inscriptions: Array(12).fill(0),
      reinscriptions: Array(12).fill(0),
      labels: Array(12).fill('')
    },
    boursiersData: [0, 0],
    parNiveauArray: Array(6).fill(0)
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activites, setActivites] = useState([]);

  // Fonction pour analyser les inscriptions par mois basée sur created_at
  const analyserInscriptionsParMois = (etudiants) => {
    // Initialiser les données pour les 12 derniers mois
    const moisActuel = new Date();
    const dataParMois = {
      inscriptions: Array(12).fill(0),
      reinscriptions: Array(12).fill(0),
      labels: Array(12).fill('')
    };

    // Récupérer les 12 derniers mois
    for (let i = 0; i < 12; i++) {
      const date = new Date(moisActuel.getFullYear(), moisActuel.getMonth() - i, 1);
      dataParMois.labels[11 - i] = date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit'
      });
    }

    // Analyser chaque étudiant
    etudiants.forEach(etudiant => {
      if (etudiant.created_at) {
        const dateInscription = new Date(etudiant.created_at);
        const moisInscription = dateInscription.getMonth();
        const anneeInscription = dateInscription.getFullYear();
        const moisActuelDate = new Date();
        const moisActuel = moisActuelDate.getMonth();
        const anneeActuel = moisActuelDate.getFullYear();

        // Calculer l'index (0-11) pour les 12 derniers mois
        const moisDiff = (anneeActuel - anneeInscription) * 12 + (moisActuel - moisInscription);

        if (moisDiff >= 0 && moisDiff < 12) {
          const index = 11 - moisDiff;

          if (etudiant.code_redoublement === 'N') {
            // Nouvel inscrit
            dataParMois.inscriptions[index]++;
          } else if (etudiant.code_redoublement === 'R' || etudiant.code_redoublement === 'T') {
            // Réinscription (R ou T)
            dataParMois.reinscriptions[index]++;
          }
        }
      }
    });

    return dataParMois;
  };

  // Fonction pour générer des activités basées sur les inscriptions récentes
  const genererActivitesReelles = (etudiants) => {
    // Trier les étudiants par date d'inscription (du plus récent au plus ancien)
    const etudiantsTries = [...etudiants]
      .filter(e => e.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6); // Prendre les 6 plus récents

    const activitesReelles = etudiantsTries.map((etudiant, index) => {
      const dateInscription = new Date(etudiant.created_at);
      const maintenant = new Date();
      const difference = maintenant - dateInscription;

      // Calculer le temps écoulé de manière lisible
      let tempsEcoule = '';
      const minutes = Math.floor(difference / (1000 * 60));
      const heures = Math.floor(minutes / 60);
      const jours = Math.floor(heures / 24);

      if (jours > 0) {
        tempsEcoule = `Il y a ${jours} jour${jours > 1 ? 's' : ''}`;
      } else if (heures > 0) {
        tempsEcoule = `Il y a ${heures} heure${heures > 1 ? 's' : ''}`;
      } else {
        tempsEcoule = `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }

      // Déterminer le type d'inscription
      let typeInscription = '';
      let icon = null;

      switch (etudiant.code_redoublement) {
        case 'N':
          typeInscription = 'Nouvel étudiant inscrit';
          icon = <FaUserPlus className="text-success" />;
          break;
        case 'R':
          typeInscription = 'Étudiant réinscrit';
          icon = <FaRedo className="text-warning" />;
          break;
        case 'T':
          typeInscription = 'Étudiant triplant';
          icon = <FaUserTimes className="text-danger" />;
          break;
        default:
          typeInscription = 'Étudiant inscrit';
          icon = <FaUserGraduate className="text-info" />;
      }

      return {
        id: etudiant.id || index + 1,
        action: typeInscription,
        user: `${etudiant.nom} ${etudiant.prenom}`,
        details: `Matricule: ${etudiant.matricule} | ${etudiant.faculte || 'Non spécifié'}`,
        time: tempsEcoule,
        icon: icon,
        boursier: etudiant.boursier === 'OUI',
        niveau: etudiant.niveau || 'Non spécifié'
      };
    });

    setActivites(activitesReelles);
  };

  // Charger les données réelles de l'API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Récupérer les statistiques globales
        const statsResponse = await etudiantApi.getStats();
        let apiStats = {};
        if (statsResponse.data) {
          apiStats = statsResponse.data;
        }

        // 2. Récupérer la liste des étudiants pour les graphiques
        const etudiantsResponse = await etudiantApi.getEtudiants({ page_size: 1000 });
        let etudiants = [];

        if (etudiantsResponse.data) {
          if (Array.isArray(etudiantsResponse.data.results)) {
            etudiants = etudiantsResponse.data.results;
          } else if (Array.isArray(etudiantsResponse.data)) {
            etudiants = etudiantsResponse.data;
          }
        }

        if (Array.isArray(etudiants) && etudiants.length > 0) {
          // ANALYSE DES DONNÉES RÉELLES
          const inscriptionsParMois = analyserInscriptionsParMois(etudiants);

          // Calculer les statistiques réelles
          let totalEtudiants = etudiants.length;
          let inscritsCount = 0;
          let reinscritsCount = 0;
          let triplantsCount = 0;
          let boursiersCount = 0;
          let montantTotalBourses = 0;

          // Répartition par niveau
          const parNiveau = {
            'Licence 1': 0,
            'Licence 2': 0,
            'Licence 3': 0,
            'Master 1': 0,
            'Master 2': 0,
            'Doctorat': 0,
            'Autre': 0
          };

          etudiants.forEach(etudiant => {
            // Type d'inscription
            switch (etudiant.code_redoublement) {
              case 'N':
                inscritsCount++;
                break;
              case 'R':
                reinscritsCount++;
                break;
              case 'T':
                triplantsCount++;
                break;
            }

            // Boursiers
            if (etudiant.boursier === 'OUI') {
              boursiersCount++;
              montantTotalBourses += parseFloat(etudiant.bourse || 0);
            }

            // Répartition par niveau
            if (etudiant.niveau) {
              const niveau = etudiant.niveau.toLowerCase();
              if (niveau.includes('licence 1') || niveau.includes('l1')) parNiveau['Licence 1']++;
              else if (niveau.includes('licence 2') || niveau.includes('l2')) parNiveau['Licence 2']++;
              else if (niveau.includes('licence 3') || niveau.includes('l3')) parNiveau['Licence 3']++;
              else if (niveau.includes('master 1') || niveau.includes('m1')) parNiveau['Master 1']++;
              else if (niveau.includes('master 2') || niveau.includes('m2')) parNiveau['Master 2']++;
              else if (niveau.includes('doctorat') || niveau.includes('d')) parNiveau['Doctorat']++;
              else parNiveau['Autre']++;
            } else {
              parNiveau['Autre']++;
            }
          });

          // Calculer le taux de boursiers
          const tauxBoursiers = totalEtudiants > 0 ? (boursiersCount / totalEtudiants * 100) : 0;

          // Mettre à jour les statistiques
          setStats({
            totalEtudiants,
            etudiantsInscrits: inscritsCount,
            etudiantsReinscrits: reinscritsCount,
            triplants: triplantsCount,
            totalBoursiers: boursiersCount,
            montantTotalBourses,
            tauxBoursiers,
            parNiveau,
            parNiveauArray: [
              parNiveau['Licence 1'],
              parNiveau['Licence 2'],
              parNiveau['Licence 3'],
              parNiveau['Master 1'],
              parNiveau['Master 2'],
              parNiveau['Doctorat'] + parNiveau['Autre']
            ],
            boursiersData: [boursiersCount, totalEtudiants - boursiersCount],
            parMois: inscriptionsParMois
          });

          // Générer les activités réelles
          genererActivitesReelles(etudiants);
        } else {
          // Si aucune donnée d'étudiants, utiliser les stats de l'API
          if (apiStats) {
            setStats(prev => ({
              ...prev,
              totalEtudiants: apiStats.total || 0,
              etudiantsInscrits: apiStats.non_redoublants || 0,
              etudiantsReinscrits: apiStats.redoublants || 0,
              triplants: apiStats.triplants || 0,
              totalBoursiers: apiStats.boursiers || 0,
              montantTotalBourses: apiStats.total_bourses || 0,
              tauxBoursiers: apiStats.taux_boursiers || 0
            }));
          }
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

  // Données pour le graphique des inscriptions par niveau
  const chartDataNiveaux = {
    labels: ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Autre/Doctorat'],
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

  // Données pour le graphique des inscriptions mensuelles (RÉELLES)
  const chartDataMensuel = {
    labels: stats.parMois.labels || ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    datasets: [
      {
        label: 'Nouveaux inscrits (N)',
        data: stats.parMois.inscriptions || Array(12).fill(0),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Réinscriptions (R/T)',
        data: stats.parMois.reinscriptions || Array(12).fill(0),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        fill: true
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Répartition par niveau d\'étude'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution des inscriptions sur 12 mois'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const optionsPie = {
    responsive: true,
    maintainAspectRatio: false,
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

  // Fonction pour formater le montant
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
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
            Bienvenue, - Vue d'ensemble du système
          </p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="row g-4 mb-4">

        {/* Total Étudiants */}
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
          <div className="card border-start-primary border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Étudiants
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {stats.totalEtudiants.toLocaleString()}
                  </div>
                  <div className="mt-2 text-muted">
                    <small>
                      <FaUserCheck className="me-1" />
                      {stats.etudiantsInscrits} N • {stats.etudiantsReinscrits} R/T
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

        {/* Étudiants boursiers */}
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
          <div className="card border-start-success border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-success text-uppercase mb-1">
                    Étudiants boursiers
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {stats.totalBoursiers.toLocaleString()}
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

        {/* Types d'inscription */}
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
          <div className="card border-start-warning border-start-3 shadow h-100 py-2">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                    Types d'inscription
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {stats.triplants} triplants
                  </div>
                  <div className="mt-2 text-muted">
                    <small>
                      <FaUserTimes className="me-1" />
                      {stats.etudiantsReinscrits} réinscrits
                    </small>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="icon-circle bg-warning">
                    <FaRedo className="text-white fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deuxième ligne de cartes */}
      <div className="row g-4 mb-4">

        {/* Nouveaux inscrits */}
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
          <div className="card bg-primary text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Nouveaux inscrits (N)</div>
                  <div className="h3 mb-0">{stats.etudiantsInscrits}</div>
                </div>
                <div className="icon-circle bg-white">
                  <FaUserPlus className="text-primary fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Étudiants non redoublants</small>
              </div>
            </div>
          </div>
        </div>

        {/* Réinscrits */}
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
          <div className="card bg-warning text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Réinscrits (R)</div>
                  <div className="h3 mb-0">
                    {stats.etudiantsReinscrits - stats.triplants}
                  </div>
                </div>
                <div className="icon-circle bg-white">
                  <FaRedo className="text-warning fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Étudiants redoublants</small>
              </div>
            </div>
          </div>
        </div>

        {/* Triplants */}
        <div className="col-xl-4 col-lg-4 col-md-6 col-sm-12">
          <div className="card bg-danger text-white shadow h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-white-50 small">Triplants (T)</div>
                  <div className="h3 mb-0">{stats.triplants}</div>
                </div>
                <div className="icon-circle bg-white">
                  <FaUserTimes className="text-danger fa-2x" />
                </div>
              </div>
              <div className="mt-3">
                <small>Étudiants triplants</small>
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
              <h6 className="m-0 fw-bold text-primary">
                Évolution des inscriptions sur 12 mois
              </h6>
            </div>
            <div className="card-body">
              <div className="chart-area" style={{ height: '350px' }}>
                <Line data={chartDataMensuel} options={optionsLine} />
              </div>
              <div className="mt-3 text-muted small">
                <FaCalendarAlt className="me-1" />
                Données calculées à partir des dates d'inscription réelles
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
              <div className="chart-pie" style={{ height: '250px' }}>
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
              <h6 className="m-0 fw-bold text-primary">Répartition par niveau d'étude</h6>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <Bar data={chartDataNiveaux} options={optionsBar} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <h6 className="m-0 fw-bold text-primary">Inscriptions récentes</h6>
              <span className="badge bg-primary">{activites.length} nouvelles</span>
            </div>
            <div className="card-body">
              <div className="activity-feed" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                            {activite.details}
                          </div>
                          <div className="text-muted smaller">
                            <FaClock className="me-1" /> {activite.time}
                            {activite.boursier && (
                              <span className="ms-2 text-success">
                                <FaMoneyBillWave className="me-1" /> Boursier
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-muted">
                    Aucune inscription récente
                  </div>
                )}
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
              <h6 className="m-0 fw-bold text-primary">Synthèse des inscriptions</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-2">
                  <div className="h4 text-primary">{stats.totalEtudiants}</div>
                  <div className="text-muted">Total</div>
                </div>
                <div className="col-md-2">
                  <div className="h4 text-success">{stats.etudiantsInscrits}</div>
                  <div className="text-muted">Nouveaux (N)</div>
                </div>
                <div className="col-md-2">
                  <div className="h4 text-warning">{stats.etudiantsReinscrits - stats.triplants}</div>
                  <div className="text-muted">Réinscrits (R)</div>
                </div>
                <div className="col-md-2">
                  <div className="h4 text-danger">{stats.triplants}</div>
                  <div className="text-muted">Triplants (T)</div>
                </div>
                <div className="col-md-2">
                  <div className="h4 text-info">{stats.totalBoursiers}</div>
                  <div className="text-muted">Boursiers</div>
                </div>
                <div className="col-md-2">
                  <div className="h4 text-dark">{formatMontant(stats.montantTotalBourses)}</div>
                  <div className="text-muted">MGA total</div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-4 text-center">
                  <div className="text-muted">
                    <small>Taux boursiers: <strong>{stats.tauxBoursiers.toFixed(1)}%</strong></small>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="text-muted">
                    <small>Inscriptions/mois: <strong>{Math.round(stats.totalEtudiants / 12)}</strong></small>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="text-muted">
                    <small>Dernière mise à jour: <strong>{new Date().toLocaleTimeString('fr-FR')}</strong></small>
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
        .border-start-3 {
          border-left-width: 3px !important;
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
      `}</style>
    </div>
  );
}

export default Dashboard;