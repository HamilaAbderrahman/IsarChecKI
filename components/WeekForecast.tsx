"use client";

import {
  Sun,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";
import type { IsarData, ForecastDay } from "@/lib/types";

interface Props {
  data: IsarData | undefined;
  isLoading: boolean;
}

function getWeatherIcon(code: number, rain: number): LucideIcon {
  if (rain > 10) return CloudRain;
  if (rain > 2) return CloudDrizzle;
  if (code === 0) return Sun;
  if (code <= 3) return CloudSun;
  if (code <= 49) return CloudFog;
  if (code <= 67) return CloudRain;
  if (code <= 77) return CloudSnow;
  if (code <= 82) return CloudDrizzle;
  if (code <= 99) return CloudLightning;
  return CloudSun;
}

function getDayStatus(rain: number): { color: string; label: string } {
  if (rain > 15) return { color: "var(--warn-red)", label: "Regen" };
  if (rain > 5) return { color: "var(--warn-amber)", label: "Schauer" };
  return { color: "var(--safe-green)", label: "Gut" };
}

function getUVColor(uv: number): string {
  if (uv <= 2) return "#52B788";
  if (uv <= 5) return "#F4A261";
  if (uv <= 7) return "#E08A3C";
  return "#E63946";
}

function ForecastDayChip({ day, isToday }: { day: ForecastDay; isToday: boolean }) {
  const WeatherIcon = getWeatherIcon(day.weatherCode, day.rainSum);
  const status = getDayStatus(day.rainSum);
  const uvColor = getUVColor(day.uvIndexMax);

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-3 rounded-2xl min-w-[72px]"
      style={{
        backgroundColor: isToday ? "var(--isar-teal)" : "white",
        border: isToday ? "none" : "1px solid #e5e7eb",
      }}
    >
      <p
        className="text-xs font-bold"
        style={{ color: isToday ? "white" : "var(--isar-deep)" }}
      >
        {isToday ? "Heute" : day.dayLabel}
      </p>
      <WeatherIcon
        className="w-7 h-7"
        style={{ color: isToday ? "white" : "var(--isar-deep)" }}
      />
      <span
        className="text-xs font-semibold"
        style={{ color: isToday ? "rgba(255,255,255,0.9)" : status.color }}
      >
        {status.label}
      </span>
      {day.rainSum > 0 && (
        <span
          className="text-xs"
          style={{ color: isToday ? "rgba(255,255,255,0.7)" : "#9ca3af" }}
        >
          {day.rainSum.toFixed(1)}mm
        </span>
      )}
      <span
        className="text-xs"
        style={{ color: isToday ? "rgba(255,255,255,0.7)" : "#9ca3af" }}
      >
        {Math.round(day.maxTemp)}°
      </span>
      {/* UV index */}
      {day.uvIndexMax > 0 && (
        <div
          className="flex items-center gap-0.5"
          title={`UV-Index: ${day.uvIndexMax}`}
        >
          <Sun
            className="w-3 h-3"
            style={{ color: isToday ? "rgba(255,255,255,0.7)" : uvColor }}
          />
          <span
            className="text-xs"
            style={{ color: isToday ? "rgba(255,255,255,0.7)" : uvColor }}
          >
            {day.uvIndexMax}
          </span>
        </div>
      )}
    </div>
  );
}

export default function WeekForecast({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div id="vorschau" className="px-4">
        <div className="skeleton h-6 w-40 mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-28 w-16 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  const forecasts = data.weather.forecastDays;
  if (forecasts.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div id="vorschau" className="px-4">
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--isar-deep)" }}>
        7-Tage-Vorschau
      </h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {forecasts.map((day) => (
          <ForecastDayChip
            key={day.date}
            day={day}
            isToday={day.date === today}
          />
        ))}
      </div>
    </div>
  );
}
