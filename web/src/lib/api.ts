import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.port === "8082"
    ? `${window.location.protocol}//${window.location.hostname}:8081`
    : ""); // относительный путь, если фронт и бэк на одном origin

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const setToken = (t?: string | null) => {
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
  else delete api.defaults.headers.common.Authorization;
};

export const getUserRole = (): string | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
};

// Сбрасываем токен при 401 и перенаправляем на логин
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      setToken(null);
      // Перенаправляем на логин если не на странице логина/регистрации
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
