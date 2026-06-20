import React from "react";
import ReactDOM from "react-dom/client";
import App from "./TavernTales.jsx";
import { storage } from "./storage.js";

// The game calls window.storage directly. The sandbox provides it; standalone
// we install our shared-store adapter (storage.js) so all devices stay in sync.
if (!window.storage) window.storage = storage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
