"use client";

import { useState } from "react";
import { Menu, X, Waves } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: "var(--bayern-blue)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Waves className="text-white w-5 h-5" />
            <span className="text-xl font-bold text-white tracking-tight">
              IsarChec<span style={{ color: "var(--isar-cyan)" }}>KI</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#sicherheit"
              className="text-sm font-medium transition-colors"
              style={{ color: "#bfdef5" }}
            >
              Sicherheit
            </a>
            <a
              href="#badestellen"
              className="text-sm font-medium transition-colors"
              style={{ color: "#bfdef5" }}
            >
              Badestellen
            </a>
            <a
              href="#vorschau"
              className="text-sm font-medium transition-colors"
              style={{ color: "#bfdef5" }}
            >
              Wochenvorschau
            </a>
          </div>

          {/* Live badge */}
          <div className="hidden md:flex">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(78,201,212,0.2)", color: "var(--isar-cyan)", border: "1px solid rgba(78,201,212,0.35)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü öffnen"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden pb-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            <div className="flex flex-col gap-3 pt-3">
              <a
                href="#sicherheit"
                className="text-sm font-medium px-2"
                style={{ color: "#bfdef5" }}
                onClick={() => setMenuOpen(false)}
              >
                Sicherheit
              </a>
              <a
                href="#badestellen"
                className="text-sm font-medium px-2"
                style={{ color: "#bfdef5" }}
                onClick={() => setMenuOpen(false)}
              >
                Badestellen
              </a>
              <a
                href="#vorschau"
                className="text-sm font-medium px-2"
                style={{ color: "#bfdef5" }}
                onClick={() => setMenuOpen(false)}
              >
                Wochenvorschau
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
