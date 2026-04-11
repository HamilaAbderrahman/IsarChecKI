"use client";

import { Bot, MapPin, Lightbulb, Info, TriangleAlert, ExternalLink } from "lucide-react";
import type { AIVerdict } from "@/lib/types";

interface Props {
  verdict: AIVerdict | undefined;
  isLoading: boolean;
}

export default function AIBriefing({ verdict, isLoading }: Props) {
  if (isLoading || !verdict) {
    return (
      <div className="px-4">
        <div className="rounded-2xl p-5 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full skeleton" />
            <div>
              <div className="skeleton h-4 w-24 mb-1" />
              <div className="skeleton h-3 w-32" />
            </div>
          </div>
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-4/5 mb-2" />
          <div className="skeleton h-4 w-3/5 mb-4" />
          <div className="skeleton h-12 w-full rounded-xl mb-3" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            KI-Briefing wird geladen…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="rounded-2xl p-5" style={{ backgroundColor: "white" }}>
        {/* Header — always shows AI attribution */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--isar-teal)" }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--isar-deep)" }}>
              KI-Briefing
            </p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--isar-deep)" }}>
          {verdict.summary}
        </p>

        {/* Key factors */}
        <div className="mb-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--isar-teal)" }}
          >
            Schlüsselfaktoren
          </p>
          <ul className="space-y-1.5">
            {verdict.keyFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--isar-teal)", color: "white" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Best spot */}
        <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: "#f0f9ff" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3.5 h-3.5" style={{ color: "var(--isar-teal)" }} />
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--isar-teal)" }}
            >
              Empfohlener Spot
            </p>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--isar-deep)" }}>
            {verdict.bestSpot}
          </p>
        </div>

        {/* Tip */}
        <div
          className="rounded-xl p-3"
          style={{ backgroundColor: "#fef9ec", borderLeft: "3px solid var(--bayern-gold)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5" style={{ color: "var(--bayern-gold)" }} />
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--bayern-gold)" }}
            >
              Tipp des Tages
            </p>
          </div>
          <p className="text-sm italic" style={{ color: "var(--isar-deep)" }}>
            "{verdict.tip}"
          </p>
        </div>

        {/* Disclaimer */}
        {(() => {
          const d = new Date(verdict.updatedAt);
          const ts = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} Uhr`;
          return (
            <div
              className="rounded-xl p-4 mt-4"
              style={{ backgroundColor: "#fff8f0", border: "2px solid #f4a261" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TriangleAlert className="w-4 h-4 flex-shrink-0" style={{ color: "#e07b2a" }} />
                <p className="text-sm font-bold" style={{ color: "#e07b2a" }}>
                  Wichtiger Hinweis: KI-generierte Einschätzung
                </p>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "#7c5c3a" }}>
                Diese Bewertung basiert auf aggregierten Datenquellen (Stand: {ts}). Sie spiegelt die{" "}
                <strong>Realität nicht zu 100% wider</strong> und ersetzt keine offiziellen Warnungen!
              </p>
              <p className="text-xs font-bold mb-1.5" style={{ color: "#7c5c3a" }}>
                Immer prüfen Sie vor dem Baden:
              </p>
              <ul className="space-y-1.5 mb-3">
                <li>
                  <a
                    href="https://www.hnd.bayern.de/pegel/isar/muenchen-16005701"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold underline"
                    style={{ color: "#e07b2a" }}
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    HND Bayern: Aktueller Pegel Isar München
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.muenchen.de/aktuell/hochwasser-isar-pegel-badewarnung"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold underline"
                    style={{ color: "#e07b2a" }}
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    Stadt München: Hochwasser &amp; Badewarnungen
                  </a>
                </li>
              </ul>
              <p className="text-xs font-bold" style={{ color: "#7c5c3a" }}>
                KI hilft, aber Ihre persönliche Verantwortung steht im Vordergrund – baden Sie sicher!
              </p>
            </div>
          );
        })()}

        {verdict.fallback && (
          <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            KI-Einschätzung basiert auf Standardlogik (API nicht verfügbar)
          </p>
        )}
      </div>
    </div>
  );
}
