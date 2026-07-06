import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/telemetry";

interface Props { children: ReactNode }
interface State { error: Error | null }

/** App-level error boundary so a render fault shows a recoverable panel. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { source: "react", componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid h-dvh place-items-center bg-background p-6 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
