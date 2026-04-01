import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#0a0a0a",
            color: "#e0e0e0",
            fontFamily: "sans-serif",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 20, margin: 0 }}>出了点问题</h2>
          <p style={{ color: "#999", margin: 0, fontSize: 14, maxWidth: 400 }}>
            {this.state.error?.message || "发生了未知错误"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
            style={{
              marginTop: 8,
              padding: "8px 24px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            返回书库
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
