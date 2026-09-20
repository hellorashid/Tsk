import React from "react";
import ReactDOM from "react-dom/client";
import { BasicUIProvider } from "@basictech/react";
import { ThemeProvider, useTheme, getAppSurface } from "./contexts/ThemeContext";
import App from "./App";
import "./index.css";
import "@basictech/react/styles.css";
import { basic } from "./basic";
import "./registerSW";

function setViewportHeight() {
  if (typeof CSS === "undefined" || !CSS.supports("height", "100dvh")) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }
}

setViewportHeight();

if (typeof CSS === "undefined" || !CSS.supports("height", "100dvh")) {
  window.addEventListener("resize", setViewportHeight);
  window.addEventListener("orientationchange", setViewportHeight);
}

function ThemedBasicUI({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <BasicUIProvider
      appearance={{
        theme: theme.isDarkMode ? "dark" : "light",
        base: getAppSurface(theme.accentColor, theme.isDarkMode),
        accent: "#DA8DF7",
        radius: "10px",
      }}
    >
      {children}
    </BasicUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <basic.Provider renderWhileLoading>
      <ThemeProvider>
        <ThemedBasicUI>
          <App />
        </ThemedBasicUI>
      </ThemeProvider>
    </basic.Provider>
  </React.StrictMode>,
);