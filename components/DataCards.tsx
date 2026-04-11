"use client";

import { Waves, Thermometer, FlaskConical, Wind, Sun, Droplets } from "lucide-react";
import type { IsarData } from "@/lib/types";

interface Props {
  data: IsarData | undefined;
  isLoading: boolean;
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtext: string;
  statusColor: string;
  statusLabel: string;
}

function DataCard({ icon, title, value, subtext, statusColor, statusLabel }: CardProps) {
  return (
    <div className="rounded-2xl p-4 relative" style={{ backgroundColor: "white" }}>
      {/* Row 1 — icon + big value side by side */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: statusColor + "18" }}
        >
          {icon}
        </div>
        <p
          className="text-2xl font-bold leading-none min-w-0"
          style={{ color: "var(--isar-deep)" }}
        >
          {value}
        </p>
      </div>

      {/* Row 2 — metric title */}
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--isar-teal)" }}
      >
        {title}
      </p>

      {/* Status badge — pinned to top-right corner of the card */}
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          backgroundColor: statusColor + "18",
          color: statusColor,
          whiteSpace: "nowrap",
        }}
      >
        {statusLabel}
      </span>

      {/* Row 4 — supporting subtext */}
      <p className="text-xs mt-1.5 leading-tight" style={{ color: "#9ca3af" }}>
        {subtext}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 bg-white">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
        <div className="skeleton h-7 w-16" />
      </div>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-5 w-14 rounded-full mb-1.5" />
      <div className="skeleton h-3 w-28" />
    </div>
  );
}

const UNAVAILABLE_COLOR = "#9ca3af";

const BACTERIA_COLORS = { niedrig: "#52B788", mittel: "#F4A261", hoch: "#E63946" };
const BACTERIA_LABELS = { niedrig: "Niedrig", mittel: "Mittel", hoch: "Hoch" };
const FLOW_COLORS = { ruhig: "#52B788", moderat: "#F4A261", gefährlich: "#E63946" };
const LEVEL_COLORS = { sicher: "#52B788", vorsicht: "#F4A261", gefährlich: "#E63946" };
const TEMP_COLORS = { warm: "#52B788", angenehm: "#4EC9D4", kalt: "#F4A261", "zu kalt": "#E63946" };
const TEMP_LABELS = { warm: "Warm", angenehm: "Angenehm", kalt: "Kalt", "zu kalt": "Zu kalt" };

function getUVColor(uv: number) {
  if (uv <= 2) return "#52B788";
  if (uv <= 5) return "#F4A261";
  if (uv <= 7) return "#E08A3C";
  return "#E63946";
}
function getUVLabel(uv: number) {
  if (uv <= 2) return "Niedrig";
  if (uv <= 5) return "Moderat";
  if (uv <= 7) return "Hoch";
  return "Sehr hoch";
}

export default function DataCards({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const { water, temperature, weather, bacteriaRisk, flowLabel, tempLabel, levelLabel } = data;

  const meldestufeLabelPart =
    water.meldestufe > 0 ? ` · Meldestufe ${water.meldestufe}` : " · Normal";

  const iconColor = "var(--isar-teal)";

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      <DataCard
        icon={<Waves className="w-5 h-5" style={{ color: iconColor }} />}
        title="Wasserstand"
        value={water.stale ? "--" : `${water.wasserstand} cm`}
        subtext={water.stale ? "Quelle nicht erreichbar" : `Isar München${meldestufeLabelPart}`}
        statusColor={water.stale ? UNAVAILABLE_COLOR : LEVEL_COLORS[levelLabel]}
        statusLabel={
          water.stale
            ? "N/V"
            : levelLabel === "sicher"
            ? "Normal"
            : levelLabel === "vorsicht"
            ? "Erhöht"
            : "Gefährlich"
        }
      />
      <DataCard
        icon={<Thermometer className="w-5 h-5" style={{ color: iconColor }} />}
        title="Temperatur"
        value={temperature.stale ? "--" : `${temperature.temperatur}°C`}
        subtext={temperature.stale ? "Quelle nicht erreichbar" : "Wassertemperatur Isar"}
        statusColor={temperature.stale ? UNAVAILABLE_COLOR : TEMP_COLORS[tempLabel]}
        statusLabel={temperature.stale ? "N/V" : TEMP_LABELS[tempLabel]}
      />
      <DataCard
        icon={<FlaskConical className="w-5 h-5" style={{ color: iconColor }} />}
        title="Bakterienrisiko"
        value={BACTERIA_LABELS[bacteriaRisk]}
        subtext={`Regen 24h: ${weather.rainLast24h}mm · 48h: ${weather.rainLast48h}mm`}
        statusColor={BACTERIA_COLORS[bacteriaRisk]}
        statusLabel={BACTERIA_LABELS[bacteriaRisk]}
      />
      <DataCard
        icon={<Droplets className="w-5 h-5" style={{ color: iconColor }} />}
        title="Strömung"
        value={water.stale ? "--" : `${water.abfluss} m³/s`}
        subtext={water.stale ? "Quelle nicht erreichbar" : "Abfluss am Pegel München"}
        statusColor={water.stale ? UNAVAILABLE_COLOR : FLOW_COLORS[flowLabel]}
        statusLabel={
          water.stale
            ? "N/V"
            : flowLabel === "ruhig"
            ? "Ruhig"
            : flowLabel === "moderat"
            ? "Moderat"
            : "Stark"
        }
      />
      <DataCard
        icon={<Sun className="w-5 h-5" style={{ color: iconColor }} />}
        title="UV-Index"
        value={`${weather.uvIndexMax}`}
        subtext="Tagesmaximum · Sonnenschutz beachten"
        statusColor={getUVColor(weather.uvIndexMax)}
        statusLabel={getUVLabel(weather.uvIndexMax)}
      />
      <DataCard
        icon={<Wind className="w-5 h-5" style={{ color: iconColor }} />}
        title="Wind"
        value={`${weather.windSpeedMax} km/h`}
        subtext="Maximaler Wind heute"
        statusColor={
          weather.windSpeedMax > 50
            ? "#E63946"
            : weather.windSpeedMax > 30
            ? "#F4A261"
            : "#52B788"
        }
        statusLabel={
          weather.windSpeedMax > 50 ? "Stark" : weather.windSpeedMax > 30 ? "Moderat" : "Schwach"
        }
      />
    </div>
  );
}
