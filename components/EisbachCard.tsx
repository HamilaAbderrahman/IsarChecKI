"use client";

import { Waves, Thermometer, Droplets, ExternalLink, MapPin, AlertTriangle } from "lucide-react";
import type { IsarData } from "@/lib/types";

interface Props {
  data: IsarData | undefined;
  isLoading: boolean;
}

const SURF_STYLES = {
  ideal: {
    bg: "linear-gradient(135deg, #52B788 0%, #2A7F8A 100%)",
    badge: "#d1fae5",
    badgeText: "#065f46",
    label: "Ideal",
  },
  möglich: {
    bg: "linear-gradient(135deg, #F4A261 0%, #E08A3C 100%)",
    badge: "#fef3c7",
    badgeText: "#92400e",
    label: "Möglich",
  },
  "nicht surfbar": {
    bg: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    badge: "#f3f4f6",
    badgeText: "#374151",
    label: "Nicht surfbar",
  },
};

function FlowBar({ discharge }: { discharge: number }) {
  // Visualise where the current discharge sits within 0–150 m³/s range
  const pct = Math.min(100, (discharge / 150) * 100);
  const idealStart = (35 / 150) * 100;
  const idealEnd = (85 / 150) * 100;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
        <span>0</span>
        <span>Optimal: 50–85 m³/s</span>
        <span>150+</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        {/* Optimal zone highlight */}
        <div
          className="absolute h-full rounded-full opacity-40"
          style={{
            left: `${idealStart}%`,
            width: `${idealEnd - idealStart}%`,
            backgroundColor: "#86efac",
          }}
        />
        {/* Current position needle */}
        <div
          className="absolute top-0 h-full w-1 rounded-full"
          style={{
            left: `${Math.max(0, pct - 0.5)}%`,
            backgroundColor: "white",
            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
        Aktuell: {discharge} m³/s
      </p>
    </div>
  );
}

export default function EisbachCard({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="px-4">
        <div className="skeleton h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const { eisbach, eisbachSurfable } = data;
  const style = SURF_STYLES[eisbachSurfable];
  const discharge = eisbach.dischargeM3s ?? data.water.abfluss;

  return (
    <div className="px-4">
      <div
        className="rounded-2xl p-5 shadow-lg"
        style={{ background: style.bg }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Waves className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white text-base">Eisbach Surfwelle</h3>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              Himmelreichbrücke · Station {eisbach.stationId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: style.badge, color: style.badgeText }}
            >
              {style.label}
            </span>
          </div>
        </div>

        {/* Flow bar */}
        <div className="mb-4">
          <FlowBar discharge={discharge} />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <Droplets className="w-4 h-4 text-white mx-auto mb-1" />
            <p className="text-white font-bold text-sm">
              {eisbach.waterLevelCm !== null ? `${eisbach.waterLevelCm} cm` : "—"}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Pegel</p>
          </div>
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <Waves className="w-4 h-4 text-white mx-auto mb-1" />
            <p className="text-white font-bold text-sm">
              {eisbach.dischargeM3s !== null ? `${eisbach.dischargeM3s} m³/s` : "—"}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Abfluss</p>
          </div>
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <Thermometer className="w-4 h-4 text-white mx-auto mb-1" />
            <p className="text-white font-bold text-sm">
              {eisbach.waterTemperatureC !== null ? `${eisbach.waterTemperatureC}°C` : "—"}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Temperatur</p>
          </div>
        </div>

        {/* Condition description */}
        <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>
          {eisbachSurfable === "ideal" &&
            "Perfekte Wellenbedingungen — idealer Abfluss für eine saubere, rideable Welle."}
          {eisbachSurfable === "möglich" &&
            (discharge < 50
              ? "Welle vorhanden, aber kleiner als optimal. Nur für Fortgeschrittene."
              : "Welle kräftig — sehr starke Strömung. Nur erfahrene Surfer.")}
          {eisbachSurfable === "nicht surfbar" &&
            (discharge < 35
              ? "Zu wenig Wasser — Welle zu flach oder gar nicht vorhanden."
              : "Zu viel Wasser — Welle geschlossen oder zu gefährlich.")}
        </p>

        {/* Warning & attribution */}
        <div
          className="rounded-xl p-2.5"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <p className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Kein Schwimmen. Nur geübte Surfer mit eigener Ausrüstung.
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Quelle: {eisbach.source} · Station {eisbach.stationId}
          </p>
        </div>
      </div>
    </div>
  );
}
