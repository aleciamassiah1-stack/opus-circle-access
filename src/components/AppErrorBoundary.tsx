import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Apple App Review flagged the iOS build with
 * "lands on a blank page right after launch" — that happens when an
 * uncaught error during initial render leaves the WebView with no UI at
 * all. Wrapping the app guarantees the reviewer always sees something
 * actionable instead of a blank charcoal screen.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console so it shows in Xcode / logcat when reviewers attach.
    console.error("[AppErrorBoundary] Uncaught render error:", error, info);
  }

  private reload = () => {
    try {
      // Hard reload to clear any bad in-memory state.
      window.location.assign("/");
    } catch {
      // ignore
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          textAlign: "center",
          background: "#26221E",
          color: "#F5EFE6",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "22px", margin: "0 0 12px", letterSpacing: "0.02em" }}>
          Opulence Talent Collective
        </h1>
        <p style={{ maxWidth: "32ch", margin: "0 0 24px", opacity: 0.8, lineHeight: 1.5 }}>
          Something went wrong loading the app. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={this.reload}
          style={{
            padding: "12px 24px",
            borderRadius: "999px",
            border: "1px solid #C9A961",
            background: "#C9A961",
            color: "#26221E",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}

export default AppErrorBoundary;
