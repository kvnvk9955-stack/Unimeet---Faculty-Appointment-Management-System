import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem("unimeet_access_token", accessToken);
  if (refreshToken) localStorage.setItem("unimeet_refresh_token", refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem("unimeet_access_token");
  localStorage.removeItem("unimeet_refresh_token");
};

const getAccessToken = () => localStorage.getItem("unimeet_access_token");
const getRefreshToken = () => localStorage.getItem("unimeet_refresh_token");

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true // Ensure cross-origin cookies work if needed
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    return response.data; // Return the inner data object { success: true, data: ... }
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (!error.response) {
      return { success: false, message: "Network error. Is the server running?" };
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register')) {
        return error.response.data;
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken: getRefreshToken()
        });
        
        if (refreshRes.data.success) {
          const { accessToken, refreshToken } = refreshRes.data.data;
          setTokens(accessToken, refreshToken);
          
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          processQueue(null, accessToken);
          isRefreshing = false;
          
          return axiosInstance(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        clearTokens();
        localStorage.removeItem("unimeet_user");
        window.location.href = "/login";
        return { success: false, message: "Session expired, please log in again." };
      }
    }
    
    // Always return a graceful object to avoid unhandled rejections crashing the app
    return error.response.data || { success: false, message: "An error occurred" };
  }
);

export const apiClient = {
  get: (url) => axiosInstance.get(url),
  post: (url, data) => axiosInstance.post(url, data),
  put: (url, data) => axiosInstance.put(url, data),
  patch: (url, data) => axiosInstance.patch(url, data),
  delete: (url) => axiosInstance.delete(url, { data: {} })
};