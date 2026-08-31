// FR: Foundation — project setup
// FR-02: User Login & Session (AuthProvider wraps the app)
// This is the first JavaScript file the browser runs. It "mounts" the React
// app into the empty <div id="root"> in index.html, then wraps App with
// routing, login state, and toast messages so every page can use them.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import { ToastProvider } from "./ToastContext.jsx";
import "./index.css";
import App from "./App.jsx";

// Find the root div and draw the whole app tree into it.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
