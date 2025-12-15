// src/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Adaptez à votre URL Django

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const etudiantApi = {
  // Récupérer tous les étudiants avec pagination
  getEtudiants: (params) => api.get('/etudiants/', { params }),
  
  // Récupérer un étudiant par ID
  getEtudiant: (id) => api.get(`/etudiants/${id}/`),
  
  // Créer un nouvel étudiant
  createEtudiant: (data) => api.post('/etudiants/', data),
  
  // Mettre à jour un étudiant
  updateEtudiant: (id, data) => api.put(`/etudiants/${id}/`, data),
  
  // Supprimer un étudiant
  deleteEtudiant: (id) => api.delete(`/etudiants/${id}/`),
  
  // Récupérer les statistiques
  getStats: () => api.get('/etudiants/stats/'),
  
  // Recherche d'étudiants
  searchEtudiants: (params) => api.get('/etudiants/search/', { params }),
};

export default api;