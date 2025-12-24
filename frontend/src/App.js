import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./Login";
import Navbar from './components/Navbar';
import NotFound from "./pages/NotFound";
import AccepBourses from "./pages/AccepBourses";
import NonBourses from "./pages/NonBourses";
import Dashboard from "./pages/Dashboard";
import ListEtudiants from "./pages/ListEtudiants";
import Bourses from "./pages/Bourses";
import Paiement from "./pages/Paiement";
import Reinscription from "./pages/Reinscription";
import Inscription from "./pages/Inscription";
import Authentification from "./pages/Authentification";
import Impression from "./pages/Impression";
import DoublonNomPrenom from "./pages/DoublonNomPrenom";
import DoublonBourse from "./pages/DoublonBourseExact";
import Facultes from "./pages/Facultes";
import Mentions from "./pages/Mentions";
import Domaines from "./pages/Domaines";

// Route protégée par authentification
function PrivateRoute({ children }) {
  // Vérifier les deux noms possibles du token
  const token = localStorage.getItem("access_token") || localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" replace />;
}

// Layout avec navbar (uniquement pour les utilisateurs connectés)
function Layout() {
  return (
    <div className="flex h-screen">
      <Navbar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Page de connexion publique */}
        <Route path="/login" element={<Login />} />

        {/* Routes protégées avec layout */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inscription" element={<Inscription />} />
          <Route path="list-etudiants" element={<ListEtudiants />} />
          <Route path="bourses" element={<Bourses />} />
          <Route path="paiement" element={<Paiement />} />
          <Route path="reinscription" element={<Reinscription />} />
          <Route path="authentification" element={<Authentification />} />
          <Route path="impression" element={<Impression />} />
          <Route path="doublonsnom-prenom" element={<DoublonNomPrenom />} />
          <Route path="Doublonbourse" element={<DoublonBourse />} />
          <Route path="facultes" element={<Facultes />} />
          <Route path="mentions" element={<Mentions />} />
          <Route path="domaines" element={<Domaines />} />
          <Route path="accep-bourses" element={<AccepBourses />} />
          <Route path="non-bourses" element={<NonBourses />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;