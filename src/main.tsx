import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BasicProvider } from "@basictech/react";

import { schema } from "../basic.config";
import './registerSW';

// Fix for mobile Chrome address bar collapsing issue
// Modern browsers support dvh (dynamic viewport height) natively
// For older browsers, set CSS variable for actual viewport height
function setViewportHeight() {
  // Only set --vh if browser doesn't support dvh
  if (typeof CSS === 'undefined' || !CSS.supports('height', '100dvh')) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
}

// Set initial value
setViewportHeight();

// Update on resize and orientation change (only needed for fallback)
if (typeof CSS === 'undefined' || !CSS.supports('height', '100dvh')) {
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BasicProvider schema={schema} debug>
      <App />
    </BasicProvider>
  </React.StrictMode>
);

// uhm vercel pls thnx