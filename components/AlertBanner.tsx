"use client";

import { Siren, AlertTriangle } from "lucide-react";
import type { IsarData } from "@/lib/types";

interface Props {
  data: IsarData | undefined;
}

export default function AlertBanner({ data }: Props) {
  if (!data) return null;

  const { water, weather } = data;

  if (water.meldestufe === 0 && weather.forecastRain <= 20) return null;

  const alerts: string[] = [];

  if (water.meldestufe > 0) {
    alerts.push(`Meldestufe ${water.meldestufe} aktiv — Wasserstand bei ${water.wasserstand} cm`);
  }
  if (weather.forecastRain > 20) {
    alerts.push(`Starker Regen vorhergesagt: ${weather.forecastRain}mm in den nächsten 24h`);
  }
  if (weather.rainLast24h > 15) {
    alerts.push(`Starker Regen in den letzten 24h (${weather.rainLast24h}mm) — erhöhtes Bakterienrisiko`);
  }

  if (alerts.length === 0) return null;

  const isCritical = water.meldestufe >= 2 || weather.forecastRain > 30;
  const Icon = isCritical ? Siren : AlertTriangle;

  return (
    <div
      className="mx-4 rounded-2xl p-4 flex items-start gap-3"
      style={{
        backgroundColor: isCritical ? "#fee2e2" : "#fff7ed",
        border: `1px solid ${isCritical ? "#fca5a5" : "#fed7aa"}`,
      }}
    >
      <Icon
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        style={{ color: isCritical ? "#991b1b" : "#92400e" }}
      />
      <div>
        <p
          className="text-sm font-bold mb-1"
          style={{ color: isCritical ? "#991b1b" : "#92400e" }}
        >
          {isCritical ? "Warnung" : "Hinweis"}
        </p>
        <ul className="space-y-1">
          {alerts.map((alert, i) => (
            <li
              key={i}
              className="text-sm"
              style={{ color: isCritical ? "#7f1d1d" : "#78350f" }}
            >
              {alert}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
