import { Waves, ExternalLink, AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="mt-12 py-8 px-4"
      style={{ backgroundColor: "var(--isar-deep)", color: "rgba(255,255,255,0.6)" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Waves className="w-5 h-5 text-white" />
          <p className="text-white font-bold text-lg">
            IsarChec<span style={{ color: "var(--isar-cyan)" }}>KI</span>
          </p>
        </div>
        <p className="text-sm mb-4">
          Daten von HND Bayern, GKD Bayern & Open-Meteo · KI-Einschätzung von Google Gemini
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs mb-4">
          <a
            href="https://www.hnd.bayern.de"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            HND Bayern <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.gkd.bayern.de"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            GKD Bayern <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            Open-Meteo <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div
          className="flex items-start justify-center gap-2 text-xs"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Keine Haftung — Badebedingungen können sich schnell ändern.
            Offizielle Warnungen beachten.
          </span>
        </div>
      </div>
    </footer>
  );
}
