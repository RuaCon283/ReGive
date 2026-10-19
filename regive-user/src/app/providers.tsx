"use client";

import { App, ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#024870",
          colorInfo: "#0aa3d6",
          borderRadius: 10,
          fontFamily: "var(--font-be-vietnam-pro), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Button: {
            controlHeight: 40,
            borderRadius: 10,
          },
          Card: {
            borderRadiusLG: 16,
          },
          Input: {
            controlHeight: 42,
            borderRadius: 10,
          },
          Select: {
            controlHeight: 42,
            borderRadius: 10,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
