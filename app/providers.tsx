"use client";

import React from "react";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import { store } from "@/services/store";
import { AuthProvider } from "@/context/authContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            fontFamily:
              "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            colorPrimary: "#059669",
            colorPrimaryHover: "#047857",
            colorPrimaryActive: "#065f46",
            borderRadius: 12,
            fontSize: 13,
          },
          components: {
            Button: {
              colorPrimary: "#059669",
              colorPrimaryHover: "#047857",
              colorPrimaryActive: "#065f46",
              borderRadius: 12,
              fontWeight: 600,
            },
          },
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </ConfigProvider>
    </Provider>
  );
}
