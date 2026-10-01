import Card from "./Card";

export function CurrentWeatherSkeleton() {
  return (
    <Card
      title="Current Weather"
      childrenClassName="flex flex-col items-center gap-6 animate-pulse"
      className="h-full min-h-[380px]"
    >
      <div className="flex flex-col gap-3 items-center w-full">
        <div className="h-14 w-32 bg-muted rounded-lg" />
        <div className="h-10 w-10 bg-muted rounded-full" />
        <div className="h-6 w-36 bg-muted rounded" />
      </div>
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-9 w-40 bg-muted rounded-lg" />
      </div>
      <div className="flex justify-between w-full pt-4 border-t border-border/40">
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-5 w-12 bg-muted rounded" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-5 w-12 bg-muted rounded" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-5 w-12 bg-muted rounded" />
        </div>
      </div>
    </Card>
  );
}

export function HourlyForecastSkeleton() {
  return (
    <Card
      title="Hourly Forecast (48 Hours)"
      childrenClassName="flex gap-4 overflow-hidden py-1 animate-pulse"
      className="min-h-[175px]"
    >
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 items-center p-2 min-w-[4.2rem] rounded-lg bg-muted/40"
        >
          <div className="h-4 w-10 bg-muted rounded" />
          <div className="h-7 w-7 bg-muted rounded-full" />
          <div className="h-4 w-8 bg-muted rounded" />
        </div>
      ))}
    </Card>
  );
}

export function DailyForecastSkeleton() {
  return (
    <Card
      title="Daily Forecast"
      childrenClassName="flex flex-col gap-3 animate-pulse"
      className="h-full min-h-[460px]"
    >
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
        >
          <div className="h-4 w-10 bg-muted rounded" />
          <div className="h-6 w-6 bg-muted rounded-full" />
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
      ))}
    </Card>
  );
}

export function AdditionalInfoSkeleton() {
  return (
    <Card
      title="Additional Weather Info"
      childrenClassName="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse"
      className="min-h-[220px]"
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/40"
        >
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      ))}
    </Card>
  );
}
