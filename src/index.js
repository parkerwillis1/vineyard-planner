import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";           // ← make sure this is here!
import VineyardPlannerApp from "./VineyardPlannerApp";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <VineyardPlannerApp />
  </BrowserRouter>
);