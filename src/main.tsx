import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BasicProvider } from "@basictech/react";

import { schema } from "../basic.config";
import './registerSW';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BasicProvider project_id={schema.project_id} schema={schema} debug>
      <App />
    </BasicProvider>
  </React.StrictMode>
);

// uhm vercel pls thnx