import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BasicProvider } from "@basictech/react";

import { schema } from "../basic.config";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered: ', registration);
      },
      (registrationError) => {
        console.log('SW registration failed: ', registrationError);
      }
    );
  });
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BasicProvider project_id={schema.project_id} schema={schema}>
      <App />
    </BasicProvider>
  </React.StrictMode>
);
