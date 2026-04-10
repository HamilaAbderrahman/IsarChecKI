"use client";

import { useEffect, useRef } from "react";

/**
 * Full-page background wave layer.
 *
 * Rendering strategy:
 * - position: fixed at z-index: 0 — sits above the page background colour
 *   but below the z-index: 1 content wrapper in page.tsx
 * - Two animated SVG groups drift at different speeds / phases,
 *   creating a gentle water-surface rhythm
 * - JS scroll listener adds a subtle parallax offset (waves scroll at 0.12×
 *   the content speed, so they feel like they are "beneath" the surface)
 * - On the dark hero the waves are invisible (covered by the hero's solid bg)
 * - In the cream body they peek through the transparent gaps between cards
 */
export default function BackgroundWaves() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let rafId: number;

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!svgRef.current) return;
        // Positive translateY on a fixed element = it shifts down as user scrolls,
        // making the waves appear to move slower than the content (parallax depth cue)
        const offset = window.scrollY * 0.12;
        svgRef.current.style.transform = `translateY(${offset}px)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      focusable="false"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        willChange: "transform",
        // Overall opacity kept low — the real discreteness comes from
        // this value combined with the individual group stroke opacities
        opacity: 0.55,
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {/*
        Wave Group A — primary layer
        Paths use the SVG "Q…T" shorthand to produce smooth S-curves:
        the Q control point sets the first arch, T reflects it for the second,
        creating a gentle sine-like shape across the full viewport width.
        Animated with a slow 28-second drift (defined in globals.css).
      */}
      <g
        className="waves-a"
        stroke="#2A7F8A"
        strokeWidth="0.28"
        fill="none"
        strokeOpacity="0.11"
        strokeLinecap="round"
      >
        {/* y ≈ 18% */}
        <path d="M -5 18 Q 25 15 50 18 T 105 18" />
        {/* y ≈ 34% */}
        <path d="M -5 34 Q 25 37 50 34 T 105 34" />
        {/* y ≈ 51% */}
        <path d="M -5 51 Q 25 48 50 51 T 105 51" />
        {/* y ≈ 67% */}
        <path d="M -5 67 Q 25 70 50 67 T 105 67" />
        {/* y ≈ 83% */}
        <path d="M -5 83 Q 25 80 50 83 T 105 83" />
      </g>

      {/*
        Wave Group B — secondary layer, inverted phase & lighter weight
        Control points flip so the arch goes the opposite way,
        creating interleaved peaks and troughs between group A's lines.
        Animated with a 22-second drift at a different phase offset.
      */}
      <g
        className="waves-b"
        stroke="#005293"
        strokeWidth="0.18"
        fill="none"
        strokeOpacity="0.09"
        strokeLinecap="round"
      >
        {/* y ≈ 26% (between A's 18 and 34) */}
        <path d="M -5 26 Q 25 29 50 26 T 105 26" />
        {/* y ≈ 42% */}
        <path d="M -5 42 Q 25 39 50 42 T 105 42" />
        {/* y ≈ 59% */}
        <path d="M -5 59 Q 25 62 50 59 T 105 59" />
        {/* y ≈ 75% */}
        <path d="M -5 75 Q 25 72 50 75 T 105 75" />
      </g>
    </svg>
  );
}
