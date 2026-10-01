import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-3 flex items-center justify-between gap-3 shadow-2xl md:bottom-4 md:left-4 md:right-4 md:rounded-xl animate-fade-in"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold">
          You are offline — weather data may be stale.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Dismiss offline notice"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
