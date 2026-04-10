"use client";

import { CheckCircle2, AlertTriangle, XCircle, Loader2, ChevronDown } from "lucide-react";
import type { AIVerdict } from "@/lib/types";
import IsarLogo from "./IsarLogo";

interface Props {
  verdict: AIVerdict | undefined;
  isLoading: boolean;
}

const VERDICT_CONFIG = {
  sicher: {
    Icon: CheckCircle2,
    statusLabel: "HEUTE GUT GEEIGNET",
    gradient: "linear-gradient(135deg, #52B788 0%, #2A7F8A 100%)",
    shadow: "0 8px 32px rgba(82,183,136,0.28), 0 2px 8px rgba(0,0,0,0.25)",
  },
  vorsicht: {
    Icon: AlertTriangle,
    statusLabel: "MIT VORSICHT",
    gradient: "linear-gradient(135deg, #F4A261 0%, #E08A3C 100%)",
    shadow: "0 8px 32px rgba(244,162,97,0.28), 0 2px 8px rgba(0,0,0,0.25)",
  },
  meiden: {
    Icon: XCircle,
    statusLabel: "HEUTE BESSER MEIDEN",
    gradient: "linear-gradient(135deg, #E63946 0%, #B02A33 100%)",
    shadow: "0 8px 32px rgba(230,57,70,0.28), 0 2px 8px rgba(0,0,0,0.25)",
  },
};

/** Subtle topographic river-valley contour lines in the hero background. */
function HeroBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      viewBox="0 0 390 560"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* River valley contour lines – inspired by topographic maps of the Isar valley */}
      <g stroke="#2A7F8A" strokeWidth="1" fill="none">
        {/* Primary channel — slightly stronger */}
        <path d="M-20 300 C80 258 150 288 220 268 C290 248 340 278 420 248" opacity="0.14" />
        {/* Contour lines above channel */}
        <path d="M-20 270 C80 228 150 258 220 238 C290 218 340 248 420 218" opacity="0.09" />
        <path d="M-20 240 C80 198 150 228 220 208 C290 188 340 218 420 188" opacity="0.06" />
        <path d="M-20 210 C80 168 150 198 220 178 C290 158 340 188 420 158" opacity="0.04" />
        <path d="M-20 180 C80 138 150 168 220 148 C290 128 340 158 420 128" opacity="0.03" />
        {/* Contour lines below channel */}
        <path d="M-20 330 C80 288 150 318 220 298 C290 278 340 308 420 278" opacity="0.09" />
        <path d="M-20 360 C80 318 150 348 220 328 C290 308 340 338 420 308" opacity="0.06" />
        <path d="M-20 390 C80 348 150 378 220 358 C290 338 340 368 420 338" opacity="0.04" />
        <path d="M-20 420 C80 378 150 408 220 388 C290 368 340 398 420 368" opacity="0.03" />
        {/* Subtle longitudinal cross-sections (valley walls) */}
        <path d="M100 60 C110 190 115 360 106 490" opacity="0.04" />
        <path d="M288 50 C278 178 273 348 280 478" opacity="0.03" />
      </g>
      {/* Ambient glow: warm teal below center (river basin) */}
      <ellipse cx="195" cy="320" rx="230" ry="170" fill="#2A7F8A" opacity="0.05" />
      {/* Cooler blue glow: upper-left (sky/horizon) */}
      <ellipse cx="45" cy="95" rx="160" ry="130" fill="#005293" opacity="0.07" />
    </svg>
  );
}

export default function HeroSection({ verdict, isLoading }: Props) {
  const config = verdict ? VERDICT_CONFIG[verdict.verdict] : null;

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--isar-deep)" }}
    >
      <HeroBackground />

      <div className="relative max-w-2xl mx-auto px-4 pt-7 pb-2">

        {/* ── Top bar: logo lockup + live indicator ─────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <IsarLogo variant="full" iconSize={28} />
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(78,201,212,0.10)",
              color: "var(--isar-cyan)",
              border: "1px solid rgba(78,201,212,0.22)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            München · Live
          </span>
        </div>

        {/* ── Headline + slogan block ────────────────────────────────────── */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
            Ist die Isar heute{" "}
            <span style={{ color: "var(--isar-cyan)" }}>sicher</span>
            {" "}für deine Familie?
          </h1>

          {/* Slogan — used exactly once, anchored between decorative rules */}
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <span
              className="h-px flex-1 max-w-10"
              style={{ backgroundColor: "rgba(78,201,212,0.22)" }}
            />
            <p
              className="text-xs font-semibold uppercase"
              style={{
                color: "rgba(78,201,212,0.62)",
                letterSpacing: "0.13em",
              }}
            >
              Die Sicherheitsampel für die Isar
            </p>
            <span
              className="h-px flex-1 max-w-10"
              style={{ backgroundColor: "rgba(78,201,212,0.22)" }}
            />
          </div>

          {/* Subline */}
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>
            Offizielle Daten · Klare Einschätzung · In Sekunden
          </p>
        </div>

        {/* ── Dominant verdict card ──────────────────────────────────────── */}
        {isLoading ? (
          /* Loading skeleton */
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="skeleton w-9 h-9 rounded-lg flex-shrink-0" style={{ opacity: 0.15 }} />
              <div className="flex-1">
                <div className="skeleton h-3 w-32 mb-2" style={{ opacity: 0.15 }} />
                <div className="skeleton h-5 w-full mb-1.5" style={{ opacity: 0.15 }} />
                <div className="skeleton h-5 w-4/5" style={{ opacity: 0.10 }} />
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="skeleton h-6 w-24 rounded-full" style={{ opacity: 0.12 }} />
              <div className="skeleton h-6 w-20 rounded-full" style={{ opacity: 0.12 }} />
              <div className="skeleton h-6 w-28 rounded-full" style={{ opacity: 0.09 }} />
            </div>
            <div className="flex items-center gap-1.5">
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                style={{ color: "rgba(255,255,255,0.28)" }}
              />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                KI-Einschätzung wird geladen…
              </span>
            </div>
          </div>
        ) : verdict && config ? (
          /* Verdict card — the primary visual element */
          <a
            href="#sicherheit"
            className="block rounded-2xl p-5 mb-4 transition-transform hover:scale-[1.015] active:scale-[0.99]"
            style={{
              background: config.gradient,
              boxShadow: config.shadow,
              textDecoration: "none",
            }}
          >
            {/* Status label + icon + AI headline */}
            <div className="flex items-start gap-3 mb-4">
              <config.Icon
                className="text-white flex-shrink-0"
                style={{ width: 38, height: 38, marginTop: 2 }}
                strokeWidth={1.75}
              />
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: "rgba(255,255,255,0.68)" }}
                >
                  {config.statusLabel}
                </p>
                <p className="text-white font-bold text-lg leading-snug">
                  {verdict.headline}
                </p>
              </div>
            </div>

            {/* Key factor chips — up to 3 */}
            {verdict.keyFactors && verdict.keyFactors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {verdict.keyFactors.slice(0, 3).map((factor, i) => (
                  <span
                    key={i}
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.18)",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  >
                    {factor}
                  </span>
                ))}
              </div>
            )}

            {/* Scroll CTA */}
            <span
              className="inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: "rgba(255,255,255,0.82)" }}
            >
              Zur Sicherheitsanalyse
              <ChevronDown className="w-4 h-4" />
            </span>
          </a>
        ) : null}

        {/* ── Trust / source cue ────────────────────────────────────────── */}
        <p
          className="text-center text-xs pb-5"
          style={{ color: "rgba(255,255,255,0.26)" }}
        >
          Basierend auf offiziellen Daten · HND Bayern · DWD · GKD Bayern
        </p>
      </div>

      {/* Wave divider → cream body */}
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
