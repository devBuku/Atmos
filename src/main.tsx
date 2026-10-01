import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
} from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeProvider.tsx";
import { UnitProvider } from "./context/UnitContext.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          const statusMatch = error.message.match(/\b(4\d\d)\b/);
          if (statusMatch) return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      placeholderData: keepPreviousData,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UnitProvider>
          <App />
        </UnitProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
