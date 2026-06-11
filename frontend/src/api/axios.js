import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const rtt = new Date() - response.config.metadata.startTime;
    if (response.data && typeof response.data === 'object') {
      response.data.client_rtt_ms = rtt;
    }
    return response;
  },
  (error) => {
    const errorMsg = error.response?.data?.error || error.message || 'An unknown error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
