import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginUser, logoutUser, registerUser } from "../api/auth.api.js";

import { clearAuthToken, getAuthToken, setAuthToken } from "../../../lib/authStorage.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() => getAuthToken());

  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(token && user);

  const clearAuthentication = useCallback(() => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(async (credentials) => {
    const data = await registerUser(credentials);

    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);

    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);

    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAuthToken()) {
        await logoutUser();
      }
    } finally {
      clearAuthentication();
    }
  }, [clearAuthentication]);

  useEffect(() => {
    let cancelled = false;

    const restoreAuthentication = async () => {
      const storedToken = getAuthToken();

      if (!storedToken) {
        if (!cancelled) {
          setLoading(false);
        }

        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setToken(storedToken);
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          clearAuthentication();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    restoreAuthentication();

    return () => {
      cancelled = true;
    };
  }, [clearAuthentication]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthentication();
    };

    window.addEventListener("mysociety:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("mysociety:unauthorized", handleUnauthorized);
    };
  }, [clearAuthentication]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      register,
      login,
      logout
    }),
    [user, token, loading, isAuthenticated, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
