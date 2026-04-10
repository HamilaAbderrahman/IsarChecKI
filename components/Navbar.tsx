"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import IsarLogo from "./IsarLogo";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundColor: "var(--isar-deep)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo — icon + wordmark */}
          <IsarLogo variant="full" iconSize={26} />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#sicherheit"
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(191,222,245,0.85)" }}
            >
              Sicherheit
            </a>
            <a
              href="#badestellen"
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(191,222,245,0.85)" }}
            >
              Badestellen
            </a>
            <a
              href="#vorschau"
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(191,222,245,0.85)" }}
            >
              Wochenvorschau
            </a>
          </div>

          {/* Live badge — desktop only */}
          <div className="hidden md:flex">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(78,201,212,0.12)",
                color: "var(--isar-cyan)",
                border: "1px solid rgba(78,201,212,0.28)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live
            </span>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 -mr-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü öffnen"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile slide-down menu */}
        {menuOpen && (
          <div
            className="md:hidden pb-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex flex-col gap-3 pt-3">
              {[
                { href: "#sicherheit", label: "Sicherheit" },
                { href: "#badestellen", label: "Badestellen" },
                { href: "#vorschau", label: "Wochenvorschau" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium px-2 py-1"
                  style={{ color: "rgba(191,222,245,0.85)" }}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
