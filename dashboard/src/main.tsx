import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/store/theme";
import { ToastProvider } from "@/store/toast";
import { WorkspaceProvider } from "@/store/workspace";
import { initTelemetry } from "@/lib/telemetry";
import "./index.css";

// Register global error / unhandled-rejection capture before anything renders.
initTelemetry();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <WorkspaceProvider>
              <App />
            </WorkspaceProvider>
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
