import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { setToken } from "../lib/api";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setTokenState(storedToken);
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    const accessToken = data.accessToken;

    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    setTokenState(accessToken);
    setIsAuthenticated(true);

    return accessToken;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/register", { email, password });
    return data.id;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setTokenState(null);
    setIsAuthenticated(false);
    navigate("/login");
  }, [navigate]);

  return {
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };
}
