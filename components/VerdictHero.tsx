"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Bot, Baby, User, Users } from "lucide-react";
import type { AIVerdict } from "@/lib/types";

interface Props {
  verdict: AIVerdict | undefined;
  isLoading: boolean;
}

const VERDICT_CONFIG = {
  sicher: { className: "verdict-sicher", Icon: CheckCircle2, label: "SICHER" },
  vorsicht: { className: "verdict-vorsicht", Icon: AlertTriangle, label: "VORSICHT" },
  meiden: { className: "verdict-meiden", Icon: XCircle, label: "MEIDEN" },
};

const CHILD_CONFIG = {
  under5: { Icon: Baby, label: "Unter 5" },
  age5to12: { Icon: User, label: "5–12 Jahre" },
  adults: { Icon: Users, label: "Erwachsene" },
};

const RATING_COLORS = {
  sicher: { bg: "rgba(255,255,255,0.2)", border: "rgba(255,255,255,0.5)", dot: "#bbf7d0" },
  vorsicht: { bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.4)", dot: "#fef08a" },
  meiden: { bg: "rgba(255,0,0,0.2)", border: "rgba(255,0,0,0.4)", dot: "#fca5a5" },
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
        style={{ backgroundColor: "var(--isar-teal)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton h-7 w-36 rounded-full" style={{ opacity: 0.3 }} />
        </div>
        <div className="skeleton h-10 w-full mb-3" style={{ opacity: 0.3 }} />
        <div className="skeleton h-5 w-3/4 mb-2" style={{ opacity: 0.3 }} />
        <div className="skeleton h-5 w-1/2 mb-6" style={{ opacity: 0.3 }} />
        <div className="grid grid-cols-3 gap-2">
          <div className="skeleton h-20 rounded-xl" style={{ opacity: 0.3 }} />
          <div className="skeleton h-20 rounded-xl" style={{ opacity: 0.3 }} />
          <div className="skeleton h-20 rounded-xl" style={{ opacity: 0.3 }} />
        </div>
        <p className="text-white/50 text-sm mt-4 text-center flex items-center justify-center gap-2">
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
      className={`${config.className} rounded-2xl p-6 sm:p-8 mx-4 mt-4 shadow-xl`}
    >
      {/* AI badge */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
        >
          <Bot className="w-3.5 h-3.5" />
          KI-Einschätzung
        </span>
        {verdict.stale && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "white" }}
          >
            Daten möglicherweise veraltet
          </span>
        )}
        {verdict.fallback && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "white" }}
          >
            Offline-Modus
          </span>
        )}
      </div>

      {/* Main verdict */}
      <div className="flex items-start gap-3 mb-3">
        <Icon className="w-10 h-10 text-white flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">
            {config.label}
          </p>
          <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight">
            {verdict.headline}
          </h1>
        </div>
      </div>

      {/* Summary */}
      <p className="text-white/90 text-base leading-relaxed mb-6">{verdict.summary}</p>

      {/* Children ratings */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(Object.entries(CHILD_CONFIG) as [keyof typeof CHILD_CONFIG, typeof CHILD_CONFIG[keyof typeof CHILD_CONFIG]][]).map(
          ([key, { Icon: ChildIcon, label }]) => {
            const rating = verdict.childrenRating[key];
            const colors = RATING_COLORS[rating];
            return (
              <div
                key={key}
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <ChildIcon className="w-6 h-6 text-white mx-auto mb-1" strokeWidth={1.5} />
                <div className="text-white text-xs font-medium">{label}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.dot }}
                  />
                  <span className="text-white/80 text-xs capitalize">{rating}</span>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Timestamp */}
      <p className="text-white/60 text-xs text-center">
        Aktualisiert <TimeAgo updatedAt={verdict.updatedAt} />
      </p>
    </div>
  );
}
