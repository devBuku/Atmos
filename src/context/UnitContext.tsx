import { useState, type ReactNode } from "react";
import type { TemperatureUnit } from "../lib/formatters";
import { UnitContext } from "./unitContext";

const STORAGE_KEY = "atmos_unit";

export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<TemperatureUnit>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "F" ? "F" : "C";
    } catch {
      return "C";
    }
  });

  const setUnit = (newUnit: TemperatureUnit) => {
    setUnitState(newUnit);
    try {
      localStorage.setItem(STORAGE_KEY, newUnit);
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
  };

  const toggleUnit = () => {
    setUnit(unit === "C" ? "F" : "C");
  };

  return (
    <UnitContext.Provider value={{ unit, setUnit, toggleUnit }}>
      {children}
    </UnitContext.Provider>
  );
}
