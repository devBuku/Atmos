import { createContext, useContext } from "react";
import type { TemperatureUnit } from "../lib/formatters";

export interface UnitContextType {
  unit: TemperatureUnit;
  setUnit: (u: TemperatureUnit) => void;
  toggleUnit: () => void;
}

export const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function useUnit(): UnitContextType {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error("useUnit must be used within a UnitProvider");
  }
  return context;
}
