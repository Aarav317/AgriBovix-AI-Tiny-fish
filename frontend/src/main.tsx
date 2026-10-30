import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./hooks/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import App from "./App";
import { StartupSplash } from "./components/StartupSplash";
import "./styles/global.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <StartupSplash>
            <App />
          </StartupSplash>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
