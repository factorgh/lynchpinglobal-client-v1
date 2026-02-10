"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  roles: string;
  user: any;
  token: string;
  setRoles: (roles: string) => void;
  setUser: (user: any) => void;
  setToken: (token: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [roles, setRolesState] = useState<string>("");
  const [user, setUserState] = useState<any>(null);
  const [token, setTokenState] = useState<string>("");

  // Load auth data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Load roles
        const storedRoles = localStorage.getItem("roles");
        if (storedRoles) {
          const parsedRoles = JSON.parse(storedRoles);
          console.log("Loaded roles:", parsedRoles);
          if (parsedRoles) {
            setRolesState(parsedRoles);
          }
        }

        // Load user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log("Loaded user:", parsedUser);
          if (parsedUser) {
            setUserState(parsedUser);
          }
        }

        // Load token
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          console.log("Loaded token:", storedToken.substring(0, 20) + "...");
          setTokenState(storedToken);
        }
      } catch (error) {
        console.error("Error parsing auth data from localStorage:", error);
      }
    }
  }, []);

  const setRoles = (newRoles: string) => {
    setRolesState(newRoles);
    if (typeof window !== "undefined") {
      localStorage.setItem("roles", JSON.stringify(newRoles));
    }
  };

  const setUser = (newUser: any) => {
    setUserState(newUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", newToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{ roles, user, token, setRoles, setUser, setToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
