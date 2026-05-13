"use client";

import { Waves, Thermometer, Droplets, ExternalLink, AlertTriangle, Bot, ShieldCheck, ShieldAlert, ShieldX, Skull } from "lucide-react";
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

const QUALITY_ICON = {
  gut: ShieldCheck,
  fraglich: ShieldAlert,
  schlecht: ShieldX,
};

const QUALITY_COLOR = {
  gut: "#86efac",
  fraglich: "#fde68a",
  schlecht: "#fca5a5",
};

const QUALITY_TEXT_COLOR = {
  gut: "#166534",
  fraglich: "#92400e",
  schlecht: "#991b1b",
};

const QUALITY_LABEL = {
  gut: "Gute Wasserqualität",
  fraglich: "Wasserqualität fraglich",
  schlecht: "Schlechte Wasserqualität",
};

// Pegel level bar — shows 100–160 cm range with threshold zones
function LevelBar({ levelCm }: { levelCm: number }) {
  const MIN = 100, MAX = 160;
  const toPct = (v: number) => Math.max(0, Math.min(100, ((v - MIN) / (MAX - MIN)) * 100));

  const pct = toPct(levelCm);

  // Zone boundaries as percentages
  const z130 = toPct(130); // not surfable → danger
  const z140 = toPct(140); // danger → low-surfable
  const z145 = toPct(145); // low-surfable → ideal
  const z150 = toPct(150); // ideal → wild

  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
        <span>100 cm</span>
        <span>Pegel-Zonen (cm)</span>
        <span>160 cm</span>
      </div>

      {/* Zone bar */}
      <div className="relative h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        {/* not surfable: 100–130 */}
        <div style={{ width: `${z130}%`, backgroundColor: "rgba(255,255,255,0.15)" }} />
        {/* danger/rocks: 130–140 */}
        <div style={{ width: `${z140 - z130}%`, backgroundColor: "rgba(251,146,60,0.55)" }} />
        {/* low surfable: 140–145 */}
        <div style={{ width: `${z145 - z140}%`, backgroundColor: "rgba(250,204,21,0.55)" }} />
        {/* ideal: 145–150 */}
        <div style={{ width: `${z150 - z145}%`, backgroundColor: "rgba(134,239,172,0.7)" }} />
        {/* wild: 150–160 */}
        <div style={{ width: `${100 - z150}%`, backgroundColor: "rgba(251,146,60,0.45)" }} />

        {/* Current position needle */}
        <div
          className="absolute top-0 h-full w-1 rounded-full"
          style={{
            left: `${Math.max(0, pct - 0.5)}%`,
            backgroundColor: "white",
            boxShadow: "0 0 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Threshold labels */}
      <div className="relative h-4 mt-0.5">
        {[{ v: 130, label: "130" }, { v: 140, label: "140" }, { v: 145, label: "145★" }, { v: 150, label: "150" }].map(({ v, label }) => (
          <span
            key={v}
            className="absolute text-[9px] transform -translate-x-1/2"
            style={{ left: `${toPct(v)}%`, color: "rgba(255,255,255,0.45)" }}
          >
            {label}
          </span>
        ))}
      </div>

      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
        Aktuell: {levelCm} cm
      </p>
    </div>
  );
}

export default function EisbachCard({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <div className="px-4">
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const { eisbach, eisbachSurfable, eisbachAssessment } = data;
  const style = SURF_STYLES[eisbachSurfable];
  const levelCm = eisbach.waterLevelCm;
  const QualityIcon = QUALITY_ICON[eisbachAssessment.waterQuality];

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
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: style.badge, color: style.badgeText }}
          >
            {style.label}
          </span>
        </div>

        {/* Level bar — only if we have data */}
        {levelCm !== null && (
          <div className="mb-4">
            <LevelBar levelCm={levelCm} />
          </div>
        )}

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Pegel — primary, hero metric */}
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            <Droplets className="w-4 h-4 text-white mx-auto mb-1" />
            <p className="text-white font-bold text-base">
              {levelCm !== null ? `${levelCm} cm` : "—"}
            </p>
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Pegel</p>
          </div>

          {/* Abfluss — secondary */}
          <div
            className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <Waves className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(255,255,255,0.55)" }} />
            <p className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              {eisbach.dischargeM3s !== null ? `${eisbach.dischargeM3s}` : "—"}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>m³/s</p>
          </div>

          {/* Temperature */}
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

        {/* KI-Briefing */}
        <div
          className="rounded-xl p-3 mb-3"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Bot className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.7)" }} />
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.7)" }}>
              KI-Einschätzung
            </p>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {/* Skill level */}
            {eisbachAssessment.skillLevel ? (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}
              >
                {eisbachAssessment.skillLevel === "Experte" ? "🏄 Experte" : "🏄 Fortgeschrittene"}
              </span>
            ) : (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
              >
                Kein Surfen
              </span>
            )}

            {/* Water quality */}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: QUALITY_COLOR[eisbachAssessment.waterQuality],
                color: QUALITY_TEXT_COLOR[eisbachAssessment.waterQuality],
              }}
            >
              <QualityIcon className="w-3 h-3" />
              {QUALITY_LABEL[eisbachAssessment.waterQuality]}
            </span>

            {/* Smell warning */}
            {eisbachAssessment.smellRisk && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ backgroundColor: "#fca5a5", color: "#7f1d1d" }}
              >
                <Skull className="w-3 h-3" />
                Geruch möglich
              </span>
            )}
          </div>

          {/* Brief text */}
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            {eisbachAssessment.briefText}
          </p>
        </div>

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
          <a
            href={`https://www.hnd.bayern.de/pegel/isar/muenchen-himmelreichbruecke-${eisbach.stationId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 mt-0.5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
            HND Bayern live
          </a>
        </div>
      </div>
    </div>
  );
}
