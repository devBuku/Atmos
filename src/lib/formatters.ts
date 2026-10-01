export type TemperatureUnit = "C" | "F";

/**
 * Converts Celsius to Fahrenheit.
 */
export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

/**
 * Converts m/s to mph.
 */
export function msToMph(ms: number): number {
  return ms * 2.23694;
}

/**
 * Formats a temperature in Celsius or Fahrenheit with a degree symbol.
 * Example: formatTemp(21.4, 'C') -> "21°"
 */
export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  const value = unit === "C" ? celsius : celsiusToFahrenheit(celsius);
  return `${Math.round(value)}°`;
}

/**
 * Formats a temperature with the degree symbol and unit letter.
 * Example: formatTempWithUnit(21.4, 'C') -> "21°C", formatTempWithUnit(21.4, 'F') -> "71°F"
 */
export function formatTempWithUnit(celsius: number, unit: TemperatureUnit): string {
  const value = unit === "C" ? celsius : celsiusToFahrenheit(celsius);
  return `${Math.round(value)}°${unit}`;
}

/**
 * Formats wind speed according to temperature/system unit (m/s for metric, mph for imperial).
 */
export function formatWind(speedMs: number, unit: TemperatureUnit): string {
  if (unit === "F") {
    return `${Math.round(msToMph(speedMs))} mph`;
  }
  return `${Math.round(speedMs)} m/s`;
}

/**
 * Converts degrees (0-360) into compass direction (N, NE, etc.)
 */
const COMPASS_DIRECTIONS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

export function getWindDirection(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_DIRECTIONS[index];
}

/**
 * Returns UV index label and color indicator.
 */
export function getUVInfo(uvi: number): { label: string; color: string } {
  if (uvi < 3) return { label: "Low", color: "text-emerald-400" };
  if (uvi < 6) return { label: "Moderate", color: "text-yellow-400" };
  if (uvi < 8) return { label: "High", color: "text-orange-400" };
  if (uvi < 11) return { label: "Very High", color: "text-red-400" };
  return { label: "Extreme", color: "text-purple-400" };
}

/**
 * Formats a Unix timestamp (in seconds) in the given timezone.
 */
export function formatTimeInTimezone(
  unixSeconds: number,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  },
): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone,
    }).format(new Date(unixSeconds * 1000));
  } catch {
    return new Intl.DateTimeFormat("en-US", options).format(
      new Date(unixSeconds * 1000),
    );
  }
}

/**
 * Formats a short day of the week (e.g. "Mon") in the given timezone.
 */
export function formatDayInTimezone(
  unixSeconds: number,
  timeZone: string,
): string {
  return formatTimeInTimezone(unixSeconds, timeZone, {
    weekday: "short",
  });
}

/**
 * Checks if a timestamp represents "today" in the given timezone.
 */
export function isTodayInTimezone(
  unixSeconds: number,
  timeZone: string,
): boolean {
  try {
    const d1 = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date(unixSeconds * 1000));

    const d2 = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date());

    return d1 === d2;
  } catch {
    return (
      new Date(unixSeconds * 1000).toDateString() === new Date().toDateString()
    );
  }
}
