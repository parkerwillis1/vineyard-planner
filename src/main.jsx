import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "@/App.jsx";
import { AuthProvider } from "@/auth/AuthContext";
import { ToastProvider } from "@/shared/components/Toast";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);
