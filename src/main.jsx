import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

import AppRouter from "./app/router.jsx";               // ← ensure .jsx is present
import { AuthProvider } from "./auth/AuthContext.jsx";  // ← add .jsx here too

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
