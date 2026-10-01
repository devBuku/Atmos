import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/themeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 hover:bg-card text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Sun
        className={`w-4 h-4 transition-colors ${
          !isDark ? "text-amber-500" : "text-muted-foreground"
        }`}
        aria-hidden="true"
      />
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-muted border border-border/80 transition-colors p-0.5">
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-foreground transition-transform duration-200 ${
            isDark ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <Moon
        className={`w-4 h-4 transition-colors ${
          isDark ? "text-indigo-400" : "text-muted-foreground"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
