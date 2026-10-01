import { Component, type ReactNode } from "react";
import { RefreshCw, WifiOff, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  cardTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function classifyError(error: Error | null): {
  title: string;
  message: string;
  icon: "network" | "rateLimit" | "parse" | "generic";
} {
  if (!error) {
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred.",
      icon: "generic",
    };
  }

  const msg = error.message ?? "";

  if (msg.includes("429")) {
    return {
      title: "Rate limited",
      message:
        "Too many requests to the weather API. Please wait a moment and try again.",
      icon: "rateLimit",
    };
  }

  if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")) {
    return {
      title: "Network error",
      message:
        "Could not reach the weather service. Check your internet connection.",
      icon: "network",
    };
  }

  if (msg.includes("ZodError") || msg.includes("parse") || msg.toLowerCase().includes("schema")) {
    return {
      title: "Data error",
      message:
        "The weather service returned unexpected data. This is usually temporary.",
      icon: "parse",
    };
  }

  return {
    title: "Something went wrong",
    message: msg || "An unexpected error occurred while loading weather data.",
    icon: "generic",
  };
}

export class CardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { title, message, icon } = classifyError(this.state.error);

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-5 rounded-xl bg-card border border-destructive/30 shadow-md flex flex-col items-center gap-4 text-center min-h-[160px] justify-center"
        >
          <div className="p-3 rounded-full bg-destructive/10">
            {icon === "network" ? (
              <WifiOff
                className="w-6 h-6 text-destructive"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                className="w-6 h-6 text-destructive"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="font-bold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
