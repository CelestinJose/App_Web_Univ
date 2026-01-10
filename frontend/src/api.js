import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Endpoints d'authentification
export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  refreshToken: (refreshToken) => api.post('/auth/login/refresh/', { refresh: refreshToken }),
  resetPassword: (email) => api.post('/auth/reset-password/', { email }),
  confirmResetPassword: (uid, token, data) => api.post(`/auth/reset-password-confirm/${uid}/${token}/`, data),
};

// Fonction pour gérer les erreurs API
const handleApiError = (error, endpoint) => {
  console.error(`Erreur API ${endpoint}:`, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url
  });

  if (error.response?.status === 404) {
    console.warn(`Endpoint ${endpoint} non trouvé (404)`);
  }

  return Promise.reject(error);
};

// Endpoints étudiants
export const etudiantApi = {
  // Récupérer les étudiants
  getEtudiants: async (params = {}) => {
    try {
      console.log("API: Récupération étudiants avec params:", params);
      const response = await api.get('/etudiants/', { params });
      console.log("API: Réponse brute:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'getEtudiants');
    }
  },

  // 🔹 Ajouter cette méthode
  getCurrentUser: async () => {
    try {
      console.log("API: Récupération de l'utilisateur courant");
      const response = await api.get('/auth/current-user/');
      console.log("API: Utilisateur courant:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'getCurrentUser');
    }
  },

  // Importation en masse
  bulkImport: async (etudiantsData) => {
    try {
      console.log("API: Importation en masse avec", etudiantsData.length, "étudiants");
      const response = await api.post('/etudiants/bulk_import/', etudiantsData);
      console.log("API: Résultat importation:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'bulkImport');
    }
  },

  // Importation depuis Excel
  importExcel: async (file) => {
    try {
      console.log("API: Importation depuis Excel");
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/etudiants/import-excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("API: Résultat import Excel:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'importExcel');
    }
  },

  // Récupérer les statistiques
  getStats: async () => {
    try {
      console.log("API: Récupération des statistiques");
      const response = await api.get('/etudiants/stats/');
      console.log("API: Statistiques reçues:", response.data);
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("Endpoint stats/ non trouvé, tentative avec stats");
        try {
          const response = await api.get('/etudiants/stats');
          return response;
        } catch (secondError) {
          return handleApiError(secondError, 'getStats');
        }
      }
      return handleApiError(error, 'getStats');
    }
  },

  // Autres méthodes
  getEtudiant: (id) => api.get(`/etudiants/${id}/`),
  createEtudiant: (data) => api.post('/etudiants/', data),
  updateEtudiant: (id, data) => api.put(`/etudiants/${id}/`, data),
  patchEtudiant: (id, data) => api.patch(`/etudiants/${id}/`, data),
  deleteEtudiant: (id) => api.delete(`/etudiants/${id}/`),
  searchEtudiants: (params) => api.get('/etudiants/search/', { params }),

  // Méthode pour créer un étudiant avec photo
  createEtudiantWithPhoto: async (formData) => {
    return api.post('/etudiants/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Méthode pour mettre à jour un étudiant avec photo
  updateEtudiantWithPhoto: async (id, formData) => {
    return api.put(`/etudiants/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Méthode pour récupérer la photo
  getEtudiantPhoto: async (id) => {
    return api.get(`/etudiants/${id}/photo/`);
  }
  
};

// API pour les facultés, domaines et mentions
export const faculteApi = {
  getFacultes: async (params = {}) => {
    try {
      const response = await api.get('/facultes/', { params });
      return response;
    } catch (error) {
      console.error("Erreur API getFacultes:", error);
      throw error;
    }
  },

  getFaculte: (id) => api.get(`/facultes/${id}/`),

  createFaculte: (data) => api.post('/facultes/', data),

  updateFaculte: (id, data) => api.put(`/facultes/${id}/`, data),

  deleteFaculte: (id) => api.delete(`/facultes/${id}/`),
};

export const domaineApi = {
  getDomaines: async (params = {}) => {
    try {
      const response = await api.get('/domaines/', { params });
      return response;
    } catch (error) {
      console.error("Erreur API getDomaines:", error);
      throw error;
    }
  },

  getDomaine: (id) => api.get(`/domaines/${id}/`),

  createDomaine: (data) => api.post('/domaines/', data),

  updateDomaine: (id, data) => api.put(`/domaines/${id}/`, data),

  deleteDomaine: (id) => api.delete(`/domaines/${id}/`),
};

export const mentionApi = {
  getMentions: async (params = {}) => {
    try {
      const response = await api.get('/mentions/', { params });
      return response;
    } catch (error) {
      console.error("Erreur API getMentions:", error);
      throw error;
    }
  },

  getMention: (id) => api.get(`/mentions/${id}/`),

  createMention: (data) => api.post('/mentions/', data),

  updateMention: (id, data) => api.put(`/mentions/${id}/`, data),

  deleteMention: (id) => api.delete(`/mentions/${id}/`),
};

// Endpoints bourses
export const bourseApi = {
  // Récupérer toutes les bourses
  getBourses: async (params = {}) => {
    try {
      console.log("API: Récupération bourses avec params:", params);
      const response = await api.get('/bourses/', { params });
      console.log("API: Réponse brute bourses:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'getBourses');
    }
  },

  // Récupérer une bourse spécifique
  getBourse: (id) => api.get(`/bourses/${id}/`),

  // Créer une nouvelle bourse
  createBourse: async (data) => {
    try {
      console.log("API: Création bourse avec data:", data);
      const response = await api.post('/bourses/', data);
      console.log("API: Réponse création bourse:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'createBourse');
    }
  },

  // Mettre à jour une bourse (PUT)
  updateBourse: async (id, data) => {
    try {
      console.log(`API: Mise à jour bourse ${id} avec data:`, data);
      const response = await api.put(`/bourses/${id}/`, data);
      console.log("API: Réponse mise à jour bourse:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'updateBourse');
    }
  },

  // Mettre à jour partiellement une bourse (PATCH)
  patchBourse: async (id, data) => {
    try {
      console.log(`API: Patch bourse ${id} avec data:`, data);
      const response = await api.patch(`/bourses/${id}/`, data);
      console.log("API: Réponse patch bourse:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'patchBourse');
    }
  },

  // Supprimer une bourse
  deleteBourse: (id) => api.delete(`/bourses/${id}/`),

  // Récupérer les bourses d'un étudiant spécifique
  getBoursesByEtudiant: async (etudiantId) => {
    try {
      console.log("API: Récupération bourses pour étudiant:", etudiantId);
      const response = await api.get('/bourses/', { params: { etudiant: etudiantId } });
      return response;
    } catch (error) {
      return handleApiError(error, 'getBoursesByEtudiant');
    }
  },

  // Récupérer les doublons par identité
  getDoublonsIdentite: async () => {
    try {
      console.log("API: Récupération des doublons par identité");
      const response = await api.get('/bourses/doublons_identite/');
      console.log("API: Réponse doublons identité:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'getDoublonsIdentite');
    }
  },

  // Attribuer une bourse unique
  attribuerBourseUnique: async (data) => {
    try {
      console.log("API: Attribution bourse unique avec data:", data);
      const response = await api.post('/bourses/attribuer_bourse_unique/', data);
      console.log("API: Réponse attribution bourse unique:", response.data);
      return response;
    } catch (error) {
      return handleApiError(error, 'attribuerBourseUnique');
    }
  }
};

// Interceptor pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs et refresh token
api.interceptors.response.use(
  (response) => {
    console.log(`API ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await authApi.refreshToken(refreshToken);
        const newAccessToken = response.data.access;

        localStorage.setItem('access_token', newAccessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;