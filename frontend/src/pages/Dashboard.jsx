import React, { useState, useEffect } from "react";
import {
  FaUserGraduate, FaUniversity, FaMoneyBillWave,
  FaChartLine, FaCalendarAlt, FaClock, FaUserPlus, FaUserCheck, FaRedo, FaUserTimes,
  FaBuilding, FaCoins, FaFileInvoiceDollar, FaUsers, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle
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
import { etudiantApi, bourseApi } from '../api'; // Import des APIs
import api from '../api'; // Votre API principale

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
  const [userInfo, setUserInfo] = useState({
    role: '',
    faculte: null,
    username: 'Utilisateur',
    first_name: 'Utilisateur',
    email: ''
  });
  const [stats, setStats] = useState({
    // Statistiques générales (pour admin)
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
    parNiveauArray: Array(6).fill(0),
    
    // Statistiques pour finance
    paiementsAttente: 0,
    montantAttente: 0,
    paiementsValides: 0,
    montantValide: 0,
    paiementsRejetes: 0,
    montantRejete: 0,
    
    // Statistiques pour bourse
    demandesBourseAttente: 0,
    boursesAttribuees: 0,
    montantBoursesAttribuees: 0,
    boursesRefusees: 0,
    
    // Statistiques pour scolarité
    etudiantsFaculte: 0,
    inscriptionsJour: 0,
    reinscriptionsJour: 0,
    tauxReussiteFaculte: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activites, setActivites] = useState([]);

  // Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get('/auth/current-user/');
        if (response.data) {
          setUserInfo({
            role: response.data.role || '',
            faculte: response.data.faculte || null,
            username: response.data.username || 'Utilisateur',
            first_name: response.data.first_name || response.data.username || 'Utilisateur',
            email: response.data.email || ''
          });
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur:", err);
        // Récupérer depuis localStorage
        const storedRole = localStorage.getItem("user_role");
        const storedUsername = localStorage.getItem("user_name");
        const storedEmail = localStorage.getItem("user_email");
        
        setUserInfo({
          role: storedRole || 'administrateur',
          faculte: null,
          username: storedUsername || 'Utilisateur',
          first_name: storedUsername || 'Utilisateur',
          email: storedEmail || ''
        });
      }
    };

    fetchUserInfo();
  }, []);

  // Déterminer quelles statistiques afficher selon le rôle
  const getDashboardPermissions = () => {
    const role = userInfo.role;

    switch (role) {
      case 'administrateur':
        return {
          showAllStats: true,
          showFinanceStats: true,
          showBourseStats: true,
          showScolariteStats: true,
          showGeneralStats: true,
          showGraphiques: true,
          showActivites: true,
          welcomeMessage: 'Vue d\'ensemble complète du système'
        };

      case 'scolarite':
        return {
          showAllStats: false,
          showFinanceStats: false,
          showBourseStats: false,
          showScolariteStats: true,
          showGeneralStats: true,
          showGraphiques: true,
          showActivites: true,
          welcomeMessage: `Tableau de bord Scolarité - ${userInfo.faculte?.nom || 'Votre faculté'}`
        };

      case 'bourse':
        return {
          showAllStats: false,
          showFinanceStats: false,
          showBourseStats: true,
          showScolariteStats: false,
          showGeneralStats: false,
          showGraphiques: true,
          showActivites: true,
          welcomeMessage: 'Tableau de bord Service Bourses'
        };

      case 'finance':
        return {
          showAllStats: false,
          showFinanceStats: true,
          showBourseStats: false,
          showScolariteStats: false,
          showGeneralStats: false,
          showGraphiques: true,
          showActivites: true,
          welcomeMessage: 'Tableau de bord Service Finances'
        };

      default:
        return {
          showAllStats: false,
          showFinanceStats: false,
          showBourseStats: false,
          showScolariteStats: false,
          showGeneralStats: true,
          showGraphiques: false,
          showActivites: false,
          welcomeMessage: 'Tableau de bord'
        };
    }
  };

  // Charger les données selon le rôle
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const permissions = getDashboardPermissions();
        
        // Récupérer les données de base pour tous les rôles
        const etudiantsResponse = await etudiantApi.getEtudiants({ page_size: 1000 });
        let etudiants = [];

        if (etudiantsResponse.data) {
          if (Array.isArray(etudiantsResponse.data.results)) {
            etudiants = etudiantsResponse.data.results;
          } else if (Array.isArray(etudiantsResponse.data)) {
            etudiants = etudiantsResponse.data;
          }
        }

        // Filtrer les étudiants par faculté si l'utilisateur est scolarité
        let etudiantsFiltres = [...etudiants];
        if (userInfo.role === 'scolarite' && userInfo.faculte) {
          etudiantsFiltres = etudiants.filter(etudiant => 
            etudiant.faculte && etudiant.faculte.code === userInfo.faculte.code
          );
        }

        // Statistiques générales (pour admin et scolarité)
        if (permissions.showGeneralStats) {
          const totalEtudiants = etudiantsFiltres.length;
          let inscritsCount = 0;
          let reinscritsCount = 0;
          let triplantsCount = 0;
          let boursiersCount = 0;
          let montantTotalBourses = 0;

          etudiantsFiltres.forEach(etudiant => {
            switch (etudiant.code_redoublement) {
              case 'N': inscritsCount++; break;
              case 'R': reinscritsCount++; break;
              case 'T': triplantsCount++; break;
            }
            if (etudiant.boursier === 'OUI') {
              boursiersCount++;
              montantTotalBourses += parseFloat(etudiant.bourse || 0);
            }
          });

          setStats(prev => ({
            ...prev,
            totalEtudiants,
            etudiantsInscrits: inscritsCount,
            etudiantsReinscrits: reinscritsCount,
            triplants: triplantsCount,
            totalBoursiers: boursiersCount,
            montantTotalBourses,
            tauxBoursiers: totalEtudiants > 0 ? (boursiersCount / totalEtudiants * 100) : 0,
            boursiersData: [boursiersCount, totalEtudiants - boursiersCount]
          }));
        }

        // Statistiques finances (pour finance et admin)
        // if (permissions.showFinanceStats) {
        //   try {
        //     const paiementsResponse = await paiementApi.getPaiements();
        //     if (paiementsResponse.data) {
        //       const paiements = Array.isArray(paiementsResponse.data.results) 
        //         ? paiementsResponse.data.results 
        //         : paiementsResponse.data;
              
        //       let paiementsAttente = 0;
        //       let montantAttente = 0;
        //       let paiementsValides = 0;
        //       let montantValide = 0;
        //       let paiementsRejetes = 0;
        //       let montantRejete = 0;

        //       paiements.forEach(paiement => {
        //         const montant = parseFloat(paiement.montant || 0);
        //         if (paiement.statut === 'EN_ATTENTE') {
        //           paiementsAttente++;
        //           montantAttente += montant;
        //         } else if (paiement.statut === 'VALIDE') {
        //           paiementsValides++;
        //           montantValide += montant;
        //         } else if (paiement.statut === 'REJETE') {
        //           paiementsRejetes++;
        //           montantRejete += montant;
        //         }
        //       });

        //       setStats(prev => ({
        //         ...prev,
        //         paiementsAttente,
        //         montantAttente,
        //         paiementsValides,
        //         montantValide,
        //         paiementsRejetes,
        //         montantRejete
        //       }));
        //     }
        //   } catch (err) {
        //     console.error("Erreur chargement paiements:", err);
        //   }
        // }

        // Statistiques bourses (pour bourse et admin)
        if (permissions.showBourseStats) {
          try {
            const boursesResponse = await bourseApi.getBourses();
            if (boursesResponse.data) {
              const bourses = Array.isArray(boursesResponse.data.results) 
                ? boursesResponse.data.results 
                : boursesResponse.data;
              
              let demandesAttente = 0;
              let boursesAttribuees = 0;
              let montantBoursesAttribuees = 0;
              let boursesRefusees = 0;

              bourses.forEach(bourse => {
                const montant = parseFloat(bourse.montant || 0);
                if (bourse.statut === 'EN_ATTENTE') {
                  demandesAttente++;
                } else if (bourse.statut === 'ATTRIBUE') {
                  boursesAttribuees++;
                  montantBoursesAttribuees += montant;
                } else if (bourse.statut === 'REFUSE') {
                  boursesRefusees++;
                }
              });

              setStats(prev => ({
                ...prev,
                demandesBourseAttente: demandesAttente,
                boursesAttribuees,
                montantBoursesAttribuees,
                boursesRefusees
              }));
            }
          } catch (err) {
            console.error("Erreur chargement bourses:", err);
          }
        }

        // Générer les activités récentes
        if (etudiantsFiltres.length > 0) {
          const etudiantsTries = [...etudiantsFiltres]
            .filter(e => e.created_at)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

          const activitesReelles = etudiantsTries.map((etudiant, index) => {
            const dateInscription = new Date(etudiant.created_at);
            const maintenant = new Date();
            const difference = maintenant - dateInscription;
            const heures = Math.floor(difference / (1000 * 60 * 60));

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
              details: `Matricule: ${etudiant.matricule}`,
              time: heures > 24 ? `Il y a ${Math.floor(heures/24)} jours` : `Il y a ${heures} heures`,
              icon: icon,
              boursier: etudiant.boursier === 'OUI'
            };
          });

          setActivites(activitesReelles);
        }

        setLoading(false);
      } catch (err) {
        console.error("Erreur chargement dashboard:", err);
        setError("Impossible de charger les données du dashboard");
        setLoading(false);
      }
    };

    if (userInfo.role) {
      fetchDashboardData();
    }
  }, [userInfo.role, userInfo.faculte]);

  // Fonction pour formater le montant
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  // Données pour les graphiques
  const chartDataBoursiers = {
    labels: ['Boursiers', 'Non boursiers'],
    datasets: [{
      data: stats.boursiersData || [0, 0],
      backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)'],
      borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
      borderWidth: 1
    }]
  };

  const optionsPie = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Répartition boursiers / Non boursiers' }
    }
  };

  // Rendu conditionnel selon le rôle
  const permissions = getDashboardPermissions();

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
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* En-tête avec message personnalisé */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="text-primary">
            <FaChartLine className="me-2" />
            Tableau de bord
          </h1>
          <p className="text-muted">
            Bienvenue, <strong>{userInfo.first_name}</strong> - {permissions.welcomeMessage}
          </p>
          <div className="badge bg-primary">
            {userInfo.role ? userInfo.role.toUpperCase() : 'UTILISATEUR'}
            {userInfo.faculte && ` - ${userInfo.faculte.nom}`}
          </div>
        </div>
      </div>

      {/* CARTES DE STATISTIQUES - Affichage conditionnel par rôle */}

      {/* Cartes pour ADMIN et SCOLARITÉ */}
      {(userInfo.role === 'administrateur' || userInfo.role === 'scolarite') && (
        <div className="row g-4 mb-4">
          {/* Total Étudiants */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
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
                    {userInfo.role === 'scolarite' && (
                      <div className="mt-2 text-muted small">
                        <FaBuilding className="me-1" /> Votre faculté
                      </div>
                    )}
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
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
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
                    <div className="mt-2 text-muted small">
                      {stats.tauxBoursiers.toFixed(1)}% du total
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

          {/* Nouveaux inscrits */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
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
              </div>
            </div>
          </div>

          {/* Réinscrits */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card bg-warning text-white shadow h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-white-50 small">Réinscrits (R/T)</div>
                    <div className="h3 mb-0">{stats.etudiantsReinscrits}</div>
                  </div>
                  <div className="icon-circle bg-white">
                    <FaRedo className="text-warning fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cartes pour FINANCE */}
      {userInfo.role === 'finance' && (
        <div className="row g-4 mb-4">
          {/* Paiements en attente */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card border-start-warning border-start-3 shadow h-100 py-2">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col me-2">
                    <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                      Paiements en attente
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {stats.paiementsAttente}
                    </div>
                    <div className="mt-2 text-muted small">
                      {formatMontant(stats.montantAttente)} MGA
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="icon-circle bg-warning">
                      <FaHourglassHalf className="text-white fa-2x" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paiements validés */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card border-start-success border-start-3 shadow h-100 py-2">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col me-2">
                    <div className="text-xs fw-bold text-success text-uppercase mb-1">
                      Paiements validés
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {stats.paiementsValides}
                    </div>
                    <div className="mt-2 text-muted small">
                      {formatMontant(stats.montantValide)} MGA
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="icon-circle bg-success">
                      <FaCheckCircle className="text-white fa-2x" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Montant total traité */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card bg-info text-white shadow h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-white-50 small">Montant total traité</div>
                    <div className="h3 mb-0">
                      {formatMontant(stats.montantValide + stats.montantRejete)} MGA
                    </div>
                  </div>
                  <div className="icon-circle bg-white">
                    <FaFileInvoiceDollar className="text-info fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paiements rejetés */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card bg-danger text-white shadow h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-white-50 small">Paiements rejetés</div>
                    <div className="h3 mb-0">{stats.paiementsRejetes}</div>
                    <div className="mt-2 small">
                      {formatMontant(stats.montantRejete)} MGA
                    </div>
                  </div>
                  <div className="icon-circle bg-white">
                    <FaExclamationTriangle className="text-danger fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cartes pour BOURSE */}
      {userInfo.role === 'bourse' && (
        <div className="row g-4 mb-4">
          {/* Demandes en attente */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card border-start-warning border-start-3 shadow h-100 py-2">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col me-2">
                    <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                      Demandes en attente
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {stats.demandesBourseAttente}
                    </div>
                    <div className="mt-2 text-muted small">
                      À traiter
                    </div>
                  </div>
                  <div className="col-auto">
                    <div className="icon-circle bg-warning">
                      <FaHourglassHalf className="text-white fa-2x" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bourses attribuées */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card border-start-success border-start-3 shadow h-100 py-2">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col me-2">
                    <div className="text-xs fw-bold text-success text-uppercase mb-1">
                      Bourses attribuées
                    </div>
                    <div className="h5 mb-0 fw-bold text-gray-800">
                      {stats.boursesAttribuees}
                    </div>
                    <div className="mt-2 text-muted small">
                      {formatMontant(stats.montantBoursesAttribuees)} MGA
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

          {/* Bourses refusées */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card bg-secondary text-white shadow h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-white-50 small">Bourses refusées</div>
                    <div className="h3 mb-0">{stats.boursesRefusees}</div>
                  </div>
                  <div className="icon-circle bg-white">
                    <FaUserTimes className="text-secondary fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Montant total bourses */}
          <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
            <div className="card bg-primary text-white shadow h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-white-50 small">Montant total attribué</div>
                    <div className="h3 mb-0">
                      {formatMontant(stats.montantBoursesAttribuees)} MGA
                    </div>
                  </div>
                  <div className="icon-circle bg-white">
                    <FaCoins className="text-primary fa-2x" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRAPHIQUES - Affichage conditionnel */}
      {permissions.showGraphiques && (
        <div className="row mb-4">
          {userInfo.role !== 'finance' && (
            <div className="col-xl-6 col-lg-6">
              <div className="card shadow mb-4">
                <div className="card-header py-3">
                  <h6 className="m-0 fw-bold text-primary">Répartition des boursiers</h6>
                </div>
                <div className="card-body">
                  <div className="chart-pie" style={{ height: '250px' }}>
                    <Pie data={chartDataBoursiers} options={optionsPie} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activités récentes - Pour tous les rôles */}
          <div className={userInfo.role !== 'finance' ? 'col-xl-6 col-lg-6' : 'col-xl-12'}>
            <div className="card shadow">
              <div className="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 className="m-0 fw-bold text-primary">Activités récentes</h6>
                <span className="badge bg-primary">{activites.length}</span>
              </div>
              <div className="card-body">
                <div className="activity-feed" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {activites.length > 0 ? (
                    activites.map((activite) => (
                      <div key={activite.id} className="feed-item mb-3">
                        <div className="d-flex align-items-start">
                          <div className="feed-icon me-3">{activite.icon}</div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{activite.action}</div>
                            <div className="text-muted small">{activite.user}</div>
                            <div className="text-muted smaller">{activite.details}</div>
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
                      Aucune activité récente
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYNTHESE - Admin seulement */}
      {userInfo.role === 'administrateur' && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header py-3">
                <h6 className="m-0 fw-bold text-primary">Synthèse générale</h6>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-2">
                    <div className="h4 text-primary">{stats.totalEtudiants}</div>
                    <div className="text-muted">Total étudiants</div>
                  </div>
                  <div className="col-md-2">
                    <div className="h4 text-success">{stats.etudiantsInscrits}</div>
                    <div className="text-muted">Nouveaux (N)</div>
                  </div>
                  <div className="col-md-2">
                    <div className="h4 text-warning">{stats.etudiantsReinscrits}</div>
                    <div className="text-muted">Réinscrits (R/T)</div>
                  </div>
                  <div className="col-md-2">
                    <div className="h4 text-info">{stats.totalBoursiers}</div>
                    <div className="text-muted">Boursiers</div>
                  </div>
                  <div className="col-md-2">
                    <div className="h4 text-dark">{formatMontant(stats.montantTotalBourses)}</div>
                    <div className="text-muted">MGA bourses</div>
                  </div>
                  <div className="col-md-2">
                    <div className="h4 text-secondary">
                      {formatMontant(stats.montantValide + stats.montantRejete)}
                    </div>
                    <div className="text-muted">MGA paiements</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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