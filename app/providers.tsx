"use client";

import React from "react";
import { Provider } from "react-redux";
import { store } from "@/services/store";
import { AuthProvider } from "@/context/authContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
}
