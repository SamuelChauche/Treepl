import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#e8ecf1" }}>
          <h2>Something went wrong</h2>
          <p style={{ marginTop: "0.5rem", color: "#8da2b5" }}>
            Please refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
