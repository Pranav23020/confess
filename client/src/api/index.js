import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds to handle Render cold starts
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for authentication
});

// Confessions API
export const confessionsAPI = {
  getAll: (page = 1, limit = 20) =>
    api.get(`/confessions?page=${page}&limit=${limit}`),

  getById: (id) =>
    api.get(`/confessions/${id}`),

  create: (payload) => {
    if (typeof payload === 'string') {
      return api.post('/confessions', { text: payload });
    }
    if (payload instanceof FormData) {
      return api.post('/confessions', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.post('/confessions', payload);
  },

  delete: (id) =>
    api.delete(`/confessions/${id}`),

  validate: (payload) =>
    api.post('/confessions/validate', payload),
};

// Replies API
export const repliesAPI = {
  create: (confessionId, text, parentReplyId = null) =>
    api.post('/replies', { confessionId, text, parentReplyId }),

  getByConfessionId: (confessionId) =>
    api.get(`/replies/${confessionId}`),
};

// User API
export const userAPI = {
  getActiveCount: () =>
    api.get('/user/active-confession-count'),

  getMyConfessions: () =>
    api.get('/user/my-confessions'),

  getProfile: () =>
    api.get('/user/profile'),

  getMyActivity: (type = 'all') =>
    api.get(`/user/my-activity?type=${type}`),

  updateUsername: (username) =>
    api.put('/user/update-username', { username }),
};

// Reports API
export const reportsAPI = {
  create: (targetType, targetId, reason = 'other', description = '') =>
    api.post('/reports', { targetType, targetId, reason, description }),
  getMyReports: () =>
    api.get('/reports/my')
};

// Likes API
export const likesAPI = {
  toggle: (confessionId) =>
    api.post(`/likes/${confessionId}`),

  check: (confessionId) =>
    api.get(`/likes/${confessionId}/status`),
};

// Explore API
export const exploreAPI = {
  search: ({ q = '', category = 'all', sortBy = 'recent', page = 1, limit = 20 }) =>
    api.get(`/explore/search?q=${encodeURIComponent(q)}&category=${category}&sortBy=${sortBy}&page=${page}&limit=${limit}`),

  trending: (page = 1, limit = 20) =>
    api.get(`/explore/trending?page=${page}&limit=${limit}`),

  confessionOfDay: () =>
    api.get('/explore/confession-of-the-day'),

  stats: () =>
    api.get('/explore/stats'),

  category: (category, page = 1, limit = 20) =>
    api.get(`/explore/categories/${category}?page=${page}&limit=${limit}`),

  topToday: (type = 'likes', limit = 5) =>
    api.get(`/explore/top-today?type=${type}&limit=${limit}`),
};

// Drafts API
export const draftsAPI = {
  get: () => api.get('/drafts'),
  save: (payload) => api.post('/drafts', payload),
  delete: () => api.delete('/drafts')
};

// Polls API
export const pollsAPI = {
  vote: (confessionId, optionIndex) =>
    api.post(`/polls/${confessionId}/vote`, { optionIndex }),

  results: (confessionId) =>
    api.get(`/polls/${confessionId}/results`),
};

// Blocked Keywords API
export const blockedKeywordsAPI = {
  list: () => api.get('/blocked-keywords'),
  add: (keyword) => api.post('/blocked-keywords', { keyword }),
  remove: (id) => api.delete(`/blocked-keywords/${id}`),
};

export default api;
