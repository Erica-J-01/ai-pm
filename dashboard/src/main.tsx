import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/store/theme";
import { ToastProvider } from "@/store/toast";
import { WorkspaceProvider } from "@/store/workspace";
import { initTelemetry } from "@/lib/telemetry";
import "./index.css";

// Register global error / unhandled-rejection capture before anything renders.
initTelemetry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <WorkspaceProvider>
            <App />
          </WorkspaceProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
