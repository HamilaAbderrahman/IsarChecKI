"use client";

import { useEffect, useState } from "react";
import { Users, Waves, MapPin, ExternalLink, Star, Wind, Check, AlertTriangle } from "lucide-react";
import { SPOTS } from "@/lib/spots";
import type { AIVerdict, IsarData } from "@/lib/types";

interface Props {
  verdict: AIVerdict | undefined;
  isarData?: IsarData | undefined;
}

const SURF_COLORS = {
  ideal: "#52B788",
  möglich: "#F4A261",
  "nicht surfbar": "#E63946",
};

const SURF_LABELS = {
  ideal: "Ideal",
  möglich: "Möglich",
  "nicht surfbar": "Nicht surfbar",
};

export default function SpotsList({ verdict, isarData }: Props) {
  const [activeSpot, setActiveSpot] = useState<string>(SPOTS[0].id);

  // Auto-select recommended spot when verdict loads
  const recommendedSpotName = verdict?.bestSpot ?? "";
  useEffect(() => {
    if (!recommendedSpotName) return;
    const match = SPOTS.find((s) =>
      recommendedSpotName.toLowerCase().includes(s.name.toLowerCase())
    );
    if (match) setActiveSpot(match.id);
  }, [recommendedSpotName]);

  const spot = SPOTS.find((s) => s.id === activeSpot) ?? SPOTS[0];
  const eisbachSurfable = isarData?.eisbachSurfable;
  const abfluss = isarData?.water.abfluss;

  return (
    <div id="badestellen" className="px-4">
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--isar-deep)" }}>
        Badestellen & Spots
      </h2>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid #e5e7eb", backgroundColor: "white" }}
      >
        {/* ── Tab strip ── */}
        <div
          className="flex overflow-x-auto scrollbar-hide"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          {SPOTS.map((s) => {
            const isActive = activeSpot === s.id;
            const isRecommended = recommendedSpotName.toLowerCase().includes(s.name.toLowerCase());
            const surfColor =
              s.surfSpot && eisbachSurfable ? SURF_COLORS[eisbachSurfable] : undefined;

            return (
              <button
                key={s.id}
                onClick={() => setActiveSpot(s.id)}
                className="flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-3 text-xs font-semibold transition-colors relative"
                style={{
                  color: isActive ? "var(--isar-teal)" : "#6b7280",
                  backgroundColor: isActive ? "#f0fdfd" : "transparent",
                  borderBottom: isActive
                    ? "2px solid var(--isar-teal)"
                    : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {/* Icon row */}
                <span className="flex items-center gap-1">
                  {s.surfSpot ? (
                    <Waves className="w-3.5 h-3.5" />
                  ) : (
                    <Users className="w-3.5 h-3.5" />
                  )}
                  {isRecommended && (
                    <Star className="w-3 h-3 fill-current" style={{ color: "var(--safe-green)" }} />
                  )}
                  {s.surfSpot && surfColor && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: surfColor }}
                    />
                  )}
                </span>
                {/* Name */}
                <span>{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── Spot detail panel ── */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 mr-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base" style={{ color: "var(--isar-deep)" }}>
                  {spot.name}
                </h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                  style={{
                    backgroundColor: spot.kidFriendly ? "#d1fae5" : "#fef3c7",
                    color: spot.kidFriendly ? "#065f46" : "#92400e",
                  }}
                >
                  {spot.kidFriendly ? (
                    <><Check className="w-3 h-3" />Familien</>
                  ) : (
                    "Fortgeschrittene"
                  )}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                {spot.description}
              </p>
            </div>
            {spot.mapsUrl && (
              <a
                href={spot.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1.5 transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#f0f9ff", color: "var(--isar-teal)", border: "1px solid #bae6fd" }}
              >
                <MapPin className="w-3 h-3" />
                Maps
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Characteristics */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {spot.characteristics.map((c) => (
              <span
                key={c}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}
              >
                {c}
              </span>
            ))}
          </div>

          {/* Eisbach surfability panel */}
          {spot.surfSpot && eisbachSurfable && abfluss !== undefined && (
            <div
              className="rounded-xl p-3 mb-3"
              style={{
                backgroundColor: SURF_COLORS[eisbachSurfable] + "15",
                border: `1px solid ${SURF_COLORS[eisbachSurfable]}40`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4" style={{ color: SURF_COLORS[eisbachSurfable] }} />
                  <span className="text-sm font-bold" style={{ color: SURF_COLORS[eisbachSurfable] }}>
                    Surf-Bedingungen: {SURF_LABELS[eisbachSurfable]}
                  </span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: SURF_COLORS[eisbachSurfable] + "25",
                    color: SURF_COLORS[eisbachSurfable],
                  }}
                >
                  {abfluss} m³/s
                </span>
              </div>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Optimaler Abfluss: 50–85 m³/s.{" "}
                {eisbachSurfable === "ideal"
                  ? "Aktuell perfekte Wellenbedingungen!"
                  : eisbachSurfable === "möglich"
                  ? "Welle vorhanden, aber nicht optimal."
                  : abfluss < 35
                  ? "Zu wenig Wasser — Welle zu flach."
                  : "Zu viel Wasser — gefährlich für Surfer."}
              </p>
              <p className="text-xs font-medium mt-1.5 flex items-center gap-1" style={{ color: "#9ca3af" }}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                Nur für erfahrene Surfer. Kein Schwimmen.
              </p>
            </div>
          )}

          {/* AI recommendation banner */}
          {verdict?.bestSpot &&
            verdict.bestSpot.toLowerCase().includes(spot.name.toLowerCase()) && (
              <div
                className="flex items-center gap-1.5 text-sm font-medium rounded-xl p-2.5"
                style={{ backgroundColor: "#f0fdf4", color: "var(--safe-green)", border: "1px solid #bbf7d0" }}
              >
                <Star className="w-4 h-4 fill-current flex-shrink-0" />
                KI-Empfehlung für heute
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
