"use client";

import { Wind, Leaf } from "lucide-react";
import type { IsarData, PollenEntry } from "@/lib/types";
import { DWD_LEVEL_LABELS, DWD_LEVEL_COLORS, getAQIColor } from "@/lib/fetchAirQuality";

interface Props {
  data: IsarData | undefined;
  isLoading: boolean;
}

// ── AQI ring ──────────────────────────────────────────────────────────────────
function AQIGauge({ aqi, label }: { aqi: number; label: string }) {
  const color = getAQIColor(aqi);
  const pct = Math.min(100, (aqi / 100) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ color: "var(--isar-deep)" }}
        >
          {aqi}
        </span>
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: "var(--isar-deep)" }}>{label}</p>
        <p className="text-xs text-gray-400">EU Luftqualitätsindex</p>
      </div>
    </div>
  );
}

// ── Single pollen bar ─────────────────────────────────────────────────────────
function PollenBar({
  name, entry, grains
}: {
  name: string;
  entry: PollenEntry;
  grains?: number;
}) {
  const level = entry.today;
  if (level < 0) return null; // unknown

  const color = DWD_LEVEL_COLORS[level] ?? "#f3f4f6";
  const label = DWD_LEVEL_LABELS[level] ?? "?";
  const barWidth = level === 0 ? 4 : Math.max(8, (level / 3) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-14 flex-shrink-0 text-gray-500 font-medium">{name}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barWidth}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs w-20 flex-shrink-0 font-medium text-right"
        style={{ color: level > 1.5 ? "#b45309" : "#6b7280" }}
      >
        {label}
        {grains !== undefined && grains > 0 && (
          <span className="text-gray-400 font-normal"> ({Math.round(grains)})</span>
        )}
      </span>
    </div>
  );
}

// ── Pollutant chip ────────────────────────────────────────────────────────────
function PollutantChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2 text-center"
      style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
    >
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-bold" style={{ color: "var(--isar-deep)" }}>
        {value}
        <span className="text-xs font-normal text-gray-400"> {unit}</span>
      </p>
    </div>
  );
}

export default function AirQualityCard({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="px-4">
        <div className="rounded-2xl p-5 bg-white">
          <div className="skeleton h-6 w-40 mb-4" />
          <div className="skeleton h-14 w-full mb-3 rounded-xl" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4 mb-2" />
          <div className="skeleton h-4 w-4/5" />
        </div>
      </div>
    );
  }

  const { pollen, airQuality } = data;

  // Only show pollen types that are known (level >= 0)
  const pollenItems = [
    { name: "Birke", entry: pollen.birke, grains: airQuality.birchPollen },
    { name: "Gräser", entry: pollen.graeser, grains: airQuality.grassPollen },
    { name: "Esche", entry: pollen.esche },
    { name: "Erle", entry: pollen.erle, grains: airQuality.alderPollen },
    { name: "Hasel", entry: pollen.hasel },
    { name: "Beifuß", entry: pollen.beifuss, grains: airQuality.mugwortPollen },
    { name: "Ambrosia", entry: pollen.ambrosia },
  ].filter((item) => item.entry.today >= 0);

  // Find the worst pollen for a summary headline
  const maxPollen = pollenItems.reduce(
    (max, item) => (item.entry.today > max.level ? { name: item.name, level: item.entry.today } : max),
    { name: "", level: -1 }
  );

  return (
    <div className="px-4">
      <div className="rounded-2xl p-5" style={{ backgroundColor: "white" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <Leaf className="w-4 h-4" style={{ color: "var(--safe-green)" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--isar-deep)" }}>
                Luft & Pollen
              </p>
              <p className="text-xs text-gray-400">DWD · Copernicus CAMS</p>
            </div>
          </div>
          {maxPollen.level > 1.5 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: DWD_LEVEL_COLORS[maxPollen.level] + "40",
                color: "#92400e",
              }}
            >
              {maxPollen.name} aktiv
            </span>
          )}
        </div>

        {/* AQI gauge */}
        <div
          className="rounded-xl p-3 mb-4"
          style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <AQIGauge aqi={airQuality.europeanAQI} label={airQuality.aqiLabel} />
        </div>

        {/* Pollutants row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <PollutantChip label="PM2.5" value={airQuality.pm25} unit="μg/m³" />
          <PollutantChip label="PM10" value={airQuality.pm10} unit="μg/m³" />
          <PollutantChip label="NO₂" value={airQuality.no2} unit="μg/m³" />
          <PollutantChip label="O₃" value={airQuality.ozone} unit="μg/m³" />
        </div>

        {/* Pollen section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-3.5 h-3.5" style={{ color: "var(--isar-teal)" }} />
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--isar-teal)" }}
            >
              Pollenflug heute
            </p>
          </div>
          <div className="space-y-1.5">
            {pollenItems.map((item) => (
              <PollenBar
                key={item.name}
                name={item.name}
                entry={item.entry}
                grains={item.grains}
              />
            ))}
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-4 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
          <p className="text-xs text-gray-400">
            Pollen: Quelle Deutscher Wetterdienst (DWD) · Region {pollen.regionName}
          </p>
          <p className="text-xs text-gray-400">
            Luft: Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo
          </p>
        </div>
      </div>
    </div>
  );
}
