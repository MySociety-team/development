import { createContext, useCallback, useEffect, useState } from "react";

import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  register as registerApi
} from "../api/authApi.js";

import {
  clearAuthToken,
  getAuthToken,
  setAuthToken
} from "../../../lib/authStorage.js";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(token && user);

  const login = useCallback(async (credentials) => {
    const response = await loginApi(credentials);

    const newToken = response.data.token;
    const newUser = response.data.user;

    setAuthToken(newToken);

    setToken(newToken);
    setUser(newUser);

    return response;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await registerApi(userData);

    const newToken = response.data.token;
    const newUser = response.data.user;

    setAuthToken(newToken);

    setToken(newToken);
    setUser(newUser);

    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await logoutApi();
      }
    } finally {
      clearAuthToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const storedToken = getAuthToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    try {
      const response = await getCurrentUser();

      setUser(response.data.user);
    } catch (error) {
      clearAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthToken();
      setToken(null);
      setUser(null);
    };

    window.addEventListener(
      "mysociety:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "mysociety:unauthorized",
        handleUnauthorized
      );
    };
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};