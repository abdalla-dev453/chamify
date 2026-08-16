import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("chamaledger_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchCurrentUser()
      .then(({ data }) => setUser(data.data))
      .catch(() => {
        localStorage.removeItem("chamaledger_access_token");
        localStorage.removeItem("chamaledger_refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem("chamaledger_access_token", data.data.access_token);
    localStorage.setItem("chamaledger_refresh_token", data.data.refresh_token);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("chamaledger_access_token");
    localStorage.removeItem("chamaledger_refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}