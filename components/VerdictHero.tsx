"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Bot, Baby, User, Users } from "lucide-react";
import type { AIVerdict } from "@/lib/types";

interface Props {
  verdict: AIVerdict | undefined;
  isLoading: boolean;
}

const VERDICT_CONFIG = {
  sicher: {
    Icon: CheckCircle2,
    label: "SICHER",
    bg: "#EEF8F0",
    border: "#B9D9BF",
    accent: "#2F7A3E",
    text: "#1A2B1D",
    textMuted: "#3D5440",
  },
  vorsicht: {
    Icon: AlertTriangle,
    label: "VORSICHT",
    bg: "#FFF7E8",
    border: "#F0D7A8",
    accent: "#B56A00",
    text: "#2B2418",
    textMuted: "#5B5142",
  },
  meiden: {
    Icon: XCircle,
    label: "MEIDEN",
    bg: "#FDEEEE",
    border: "#E7B8B8",
    accent: "#B42318",
    text: "#2B1A1A",
    textMuted: "#5B3535",
  },
};

const CHILD_CONFIG = {
  under5: { Icon: Baby, label: "Unter 5" },
  age5to12: { Icon: User, label: "5–12 Jahre" },
  adults: { Icon: Users, label: "Erwachsene" },
};

// Child rating boxes use the same light-tinted palette regardless of the parent verdict
const CHILD_RATING_COLORS = {
  sicher:  { bg: "#EEF8F0", border: "#B9D9BF", dot: "#2F7A3E", text: "#2F7A3E" },
  vorsicht:{ bg: "#FFF7E8", border: "#F0D7A8", dot: "#B56A00", text: "#B56A00" },
  meiden:  { bg: "#FDEEEE", border: "#E7B8B8", dot: "#B42318", text: "#B42318" },
};

function TimeAgo({ updatedAt }: { updatedAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
      if (diff < 60) setLabel("gerade eben");
      else if (diff < 3600) setLabel(`vor ${Math.floor(diff / 60)} Min.`);
      else setLabel(`vor ${Math.floor(diff / 3600)} Std.`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [updatedAt]);

  return <>{label}</>;
}

export default function VerdictHero({ verdict, isLoading }: Props) {
  if (isLoading || !verdict) {
    return (
      <div
        id="sicherheit"
        className="rounded-2xl p-6 sm:p-8 mx-4 mt-6"
        style={{
          backgroundColor: "#F5F7FA",
          border: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="skeleton h-7 w-36 rounded-full mb-4" />
        <div className="skeleton h-10 w-full mb-3" />
        <div className="skeleton h-5 w-3/4 mb-2" />
        <div className="skeleton h-5 w-1/2 mb-6" />
        <div className="grid grid-cols-3 gap-2">
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
        </div>
        <p
          className="text-sm mt-4 text-center flex items-center justify-center gap-2"
          style={{ color: "#9ca3af" }}
        >
          <Bot className="w-4 h-4" />
          KI-Einschätzung wird geladen…
        </p>
      </div>
    );
  }

  const config = VERDICT_CONFIG[verdict.verdict];
  const { Icon } = config;

  return (
    <div
      id="sicherheit"
      className="rounded-2xl p-6 sm:p-8 mx-4 mt-4"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* AI badge + status indicators */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: config.accent + "18",
            color: config.accent,
          }}
        >
          <Bot className="w-3.5 h-3.5" />
          KI-Einschätzung
        </span>
        {verdict.stale && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: config.accent + "12", color: config.textMuted }}
          >
            Daten möglicherweise veraltet
          </span>
        )}
        {verdict.fallback && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: config.accent + "12", color: config.textMuted }}
          >
            Offline-Modus
          </span>
        )}
      </div>

      {/* Verdict icon + label + headline */}
      <div className="flex items-start gap-3 mb-3">
        <Icon
          className="flex-shrink-0 mt-0.5"
          style={{ width: 40, height: 40, color: config.accent }}
          strokeWidth={1.5}
        />
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: config.textMuted }}
          >
            {config.label}
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold leading-tight"
            style={{ color: config.text }}
          >
            {verdict.headline}
          </h2>
        </div>
      </div>

      {/* Summary */}
      <p className="text-base leading-relaxed mb-4" style={{ color: config.textMuted }}>
        {verdict.summary}
      </p>

      {/* Key factor chips */}
      {verdict.keyFactors && verdict.keyFactors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {verdict.keyFactors.map((factor, i) => (
            <span
              key={i}
              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: config.accent + "12",
                color: config.accent,
                border: `1px solid ${config.border}`,
              }}
            >
              {factor}
            </span>
          ))}
        </div>
      )}

      {/* Children age-group ratings */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(Object.entries(CHILD_CONFIG) as [keyof typeof CHILD_CONFIG, typeof CHILD_CONFIG[keyof typeof CHILD_CONFIG]][]).map(
          ([key, { Icon: ChildIcon, label }]) => {
            const rating = verdict.childrenRating[key];
            const c = CHILD_RATING_COLORS[rating];
            return (
              <div
                key={key}
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
              >
                <ChildIcon
                  className="w-6 h-6 mx-auto mb-1"
                  style={{ color: c.text }}
                  strokeWidth={1.5}
                />
                <div className="text-xs font-medium" style={{ color: config.textMuted }}>
                  {label}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.dot }} />
                  <span className="text-xs capitalize" style={{ color: c.text }}>
                    {rating}
                  </span>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Timestamp */}
      <p className="text-xs text-center" style={{ color: config.textMuted }}>
        Aktualisiert <TimeAgo updatedAt={verdict.updatedAt} />
      </p>
    </div>
  );
}
