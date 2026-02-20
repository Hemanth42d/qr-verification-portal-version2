import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Attach access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === "TOKEN_EXPIRED" && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
