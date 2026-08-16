/**
 * Single axios instance. Every feature imports THIS, never a fresh axios.create() —
 * that's what makes the JWT refresh-on-401 interceptor below work everywhere at once.
 */
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("chamaledger_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem("chamaledger_refresh_token");
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      );
      const newToken = data.data.access_token;
      localStorage.setItem("chamaledger_access_token", newToken);
      flushQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      localStorage.removeItem("chamaledger_access_token");
      localStorage.removeItem("chamaledger_refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;