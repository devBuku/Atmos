import { useUnit } from "../context/unitContext";

export default function UnitToggle() {
  const { unit, setUnit } = useUnit();

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-card/60 p-1 min-h-[44px]"
      role="group"
      aria-label="Temperature unit"
    >
      <button
        type="button"
        onClick={() => setUnit("C")}
        className={`px-3 py-1.5 text-xs font-semibold rounded-full min-h-[36px] min-w-[36px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          unit === "C"
            ? "bg-foreground text-background shadow-xs font-bold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={unit === "C"}
      >
        °C
      </button>
      <button
        type="button"
        onClick={() => setUnit("F")}
        className={`px-3 py-1.5 text-xs font-semibold rounded-full min-h-[36px] min-w-[36px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          unit === "F"
            ? "bg-foreground text-background shadow-xs font-bold"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={unit === "F"}
      >
        °F
      </button>
    </div>
  );
}
