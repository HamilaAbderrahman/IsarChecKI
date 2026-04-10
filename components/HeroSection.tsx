"use client";

import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import type { AIVerdict } from "@/lib/types";

interface Props {
  verdict: AIVerdict | undefined;
  isLoading: boolean;
}

const VERDICT_BADGE = {
  sicher: { Icon: CheckCircle2, text: "Heute sicher", color: "var(--safe-green)" },
  vorsicht: { Icon: AlertTriangle, text: "Mit Vorsicht", color: "var(--warn-amber)" },
  meiden: { Icon: XCircle, text: "Heute meiden", color: "var(--warn-red)" },
};

export default function HeroSection({ verdict, isLoading }: Props) {
  const badge = verdict ? VERDICT_BADGE[verdict.verdict] : null;

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--isar-deep)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 120%, var(--isar-teal) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 py-14 text-center">
        {/* Live badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(78,201,212,0.15)",
              color: "var(--isar-cyan)",
              border: "1px solid rgba(78,201,212,0.3)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            MÜNCHEN · ISAR · {new Date().getFullYear()}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
          Ist die Isar heute{" "}
          <span style={{ color: "var(--isar-cyan)" }}>sicher für deine Familie?</span>
        </h1>

        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
          Echtzeit-Wasserstand · KI-Einschätzung · Bakterienrisiko · Familiengerecht
        </p>

        {/* Verdict pill — shows as soon as AI responds */}
        {!isLoading && badge && verdict && (
          <div className="inline-flex flex-col items-center gap-2">
            <a
              href="#sicherheit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: badge.color }}
            >
              <badge.Icon className="w-5 h-5" strokeWidth={2} />
              <span>{badge.text}</span>
            </a>
            <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.5)" }}>
              "{verdict.headline}"
            </p>
          </div>
        )}

        {/* Loading state for verdict pill only */}
        {isLoading && (
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">KI-Einschätzung wird geladen…</span>
          </div>
        )}

        {/* Quick stats — always visible, no AI needed */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--isar-cyan)" }}>Live</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Wasserstand</p>
          </div>
          <div className="w-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--isar-cyan)" }}>15 Min</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Update Takt</p>
          </div>
          <div className="w-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--isar-cyan)" }}>5</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Badestellen</p>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="relative h-8 overflow-hidden">
        <svg
          viewBox="0 0 1440 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 32L60 26.7C120 21.3 240 10.7 360 10.7C480 10.7 600 21.3 720 26.7C840 32 960 32 1080 26.7C1200 21.3 1320 10.7 1380 5.3L1440 0V32H0Z"
            fill="#F9F6EF"
          />
        </svg>
      </div>
    </div>
  );
}
