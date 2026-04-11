/**
 * Air Quality & Pollen Fetcher
 *
 * Sources (both official):
 *   1. DWD Pollenflug-Gefahrenindex (Deutscher Wetterdienst — German National Weather Service)
 *      → https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json
 *      → Free Open Data, updated daily ~11:00 CET
 *      → License: Creative Commons BY 4.0 (attribution required: "Quelle: Deutscher Wetterdienst")
 *
 *   2. Open-Meteo Air Quality (Copernicus CAMS — EU official satellite air quality)
 *      → https://air-quality-api.open-meteo.com/v1/air-quality
 *      → Free for non-commercial use, updated hourly
 *      → License: Copernicus CAMS (attribution: "Quelle: Copernicus Atmosphere Monitoring Service")
 */

import type { PollenData, AirQualityData } from "./types";

// ── DWD Pollen ────────────────────────────────────────────────────────────────
// Official German pollen forecast. No API key required.
const DWD_POLLEN_URL =
  "https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json";

// München = Bayern, region_id=120, partregion_id=121 ("Allgäu/Oberbayern/Bay. Wald")
const DWD_REGION_ID = 120;
const DWD_PARTREGION_ID = 121;

// ── Open-Meteo Air Quality (Copernicus CAMS) ──────────────────────────────────
// Official EU satellite air quality data. No API key required.
const OPENMETEO_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

// Munich city centre coordinates
const LAT = "48.1351";
const LNG = "11.5820";

// ── Caches ────────────────────────────────────────────────────────────────────
let pollenCache: { data: PollenData; fetchedAt: number } | null = null;
let aqCache: { data: AirQualityData; fetchedAt: number } | null = null;

const POLLEN_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours (DWD updates once daily)
const AQ_CACHE_TTL = 60 * 60 * 1000; // 1 hour (Open-Meteo updates hourly)

// ─────────────────────────────────────────────────────────────────────────────
// DWD: Pollen severity scale
//   "0"   → 0   (keine Belastung)
//   "0-1" → 0.5 (keine bis geringe)
//   "1"   → 1   (geringe)
//   "1-2" → 1.5 (geringe bis mittlere)
//   "2"   → 2   (mittlere)
//   "2-3" → 2.5 (mittlere bis hohe)
//   "3"   → 3   (hohe Belastung)
// ─────────────────────────────────────────────────────────────────────────────
const DWD_LEVEL_MAP: Record<string, number> = {
  "0": 0, "0-1": 0.5, "1": 1, "1-2": 1.5, "2": 2, "2-3": 2.5, "3": 3,
};
export const DWD_LEVEL_LABELS: Record<number, string> = {
  0: "Keine", 0.5: "Sehr gering", 1: "Gering", 1.5: "Gering–Mittel",
  2: "Mittel", 2.5: "Mittel–Hoch", 3: "Hoch",
};
export const DWD_LEVEL_COLORS: Record<number, string> = {
  0: "#d1fae5", 0.5: "#a7f3d0", 1: "#86efac", 1.5: "#fde68a",
  2: "#fbbf24", 2.5: "#f97316", 3: "#ef4444",
};

function parseDWDLevel(s: string | undefined): number {
  if (!s) return -1;
  return DWD_LEVEL_MAP[s.trim()] ?? -1;
}

// ─────────────────────────────────────────────────────────────────────────────
// EU AQI thresholds (EAQI standard: 0–20 very good … 100+ extremely bad)
// ─────────────────────────────────────────────────────────────────────────────
function getAQILabel(
  aqi: number
): "Sehr gut" | "Gut" | "Mäßig" | "Schlecht" | "Sehr schlecht" {
  if (aqi <= 20) return "Sehr gut";
  if (aqi <= 40) return "Gut";
  if (aqi <= 60) return "Mäßig";
  if (aqi <= 80) return "Schlecht";
  return "Sehr schlecht";
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 20) return "#52B788";
  if (aqi <= 40) return "#86efac";
  if (aqi <= 60) return "#fbbf24";
  if (aqi <= 80) return "#f97316";
  return "#ef4444";
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch DWD pollen forecast
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchPollen(): Promise<PollenData> {
  if (pollenCache && Date.now() - pollenCache.fetchedAt < POLLEN_CACHE_TTL) {
    return pollenCache.data;
  }

  try {
    const resp = await fetch(DWD_POLLEN_URL, {
      next: { revalidate: 10800 }, // 3 hours
    });
    if (!resp.ok) throw new Error(`DWD pollen HTTP ${resp.status}`);

    const json = await resp.json();
    const regions: Array<{
      region_id: number;
      partregion_id: number;
      region_name: string;
      partregion_name: string;
      Pollen: Record<string, { today: string; tomorrow: string; dayafter_to: string }>;
    }> = json.content ?? [];

    // Find München region: region_id=120, partregion_id=121
    const region =
      regions.find(
        (r) => r.region_id === DWD_REGION_ID && r.partregion_id === DWD_PARTREGION_ID
      ) ?? regions.find((r) => r.region_id === DWD_REGION_ID);

    if (!region) throw new Error("DWD region for München not found");

    const p = region.Pollen;

    const data: PollenData = {
      updatedAt: json.last_update ?? new Date().toISOString(),
      nextUpdate: json.next_update ?? "",
      regionName: region.partregion_name || region.region_name,
      birke: { today: parseDWDLevel(p.Birke?.today), tomorrow: parseDWDLevel(p.Birke?.tomorrow) },
      erle: { today: parseDWDLevel(p.Erle?.today), tomorrow: parseDWDLevel(p.Erle?.tomorrow) },
      hasel: { today: parseDWDLevel(p.Hasel?.today), tomorrow: parseDWDLevel(p.Hasel?.tomorrow) },
      graeser: { today: parseDWDLevel(p.Graeser?.today), tomorrow: parseDWDLevel(p.Graeser?.tomorrow) },
      esche: { today: parseDWDLevel(p.Esche?.today), tomorrow: parseDWDLevel(p.Esche?.tomorrow) },
      roggen: { today: parseDWDLevel(p.Roggen?.today), tomorrow: parseDWDLevel(p.Roggen?.tomorrow) },
      beifuss: { today: parseDWDLevel(p.Beifuss?.today), tomorrow: parseDWDLevel(p.Beifuss?.tomorrow) },
      ambrosia: { today: parseDWDLevel(p.Ambrosia?.today), tomorrow: parseDWDLevel(p.Ambrosia?.tomorrow) },
      source: "DWD",
    };

    pollenCache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.error("DWD pollen fetch error:", err);
    if (pollenCache) return { ...pollenCache.data };

    // Fallback: all unknown
    const unknown = { today: -1, tomorrow: -1 };
    return {
      updatedAt: new Date().toISOString(),
      nextUpdate: "",
      regionName: "Bayern (Allgäu/Oberbayern)",
      birke: unknown, erle: unknown, hasel: unknown, graeser: unknown,
      esche: unknown, roggen: unknown, beifuss: unknown, ambrosia: unknown,
      source: "DWD",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch air quality from Open-Meteo / Copernicus CAMS
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAirQuality(): Promise<AirQualityData> {
  if (aqCache && Date.now() - aqCache.fetchedAt < AQ_CACHE_TTL) {
    return aqCache.data;
  }

  try {
    const url = new URL(OPENMETEO_AQ_URL);
    url.searchParams.set("latitude", LAT);
    url.searchParams.set("longitude", LNG);
    url.searchParams.set(
      "current",
      "european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen"
    );
    url.searchParams.set("timezone", "Europe/Berlin");

    const resp = await fetch(url.toString(), { cache: "no-store" });
    if (!resp.ok) throw new Error(`Open-Meteo AQ HTTP ${resp.status}`);

    const json = await resp.json();
    const c = json.current ?? {};

    const aqi = Math.round(c.european_aqi ?? 0);
    const data: AirQualityData = {
      timestamp: c.time ?? new Date().toISOString(),
      europeanAQI: aqi,
      pm25: Math.round((c.pm2_5 ?? 0) * 10) / 10,
      pm10: Math.round((c.pm10 ?? 0) * 10) / 10,
      no2: Math.round((c.nitrogen_dioxide ?? 0) * 10) / 10,
      ozone: Math.round((c.ozone ?? 0) * 10) / 10,
      alderPollen: Math.round((c.alder_pollen ?? 0) * 10) / 10,
      birchPollen: Math.round((c.birch_pollen ?? 0) * 10) / 10,
      grassPollen: Math.round((c.grass_pollen ?? 0) * 10) / 10,
      mugwortPollen: Math.round((c.mugwort_pollen ?? 0) * 10) / 10,
      aqiLabel: getAQILabel(aqi),
      source: "Copernicus CAMS (Open-Meteo)",
    };

    aqCache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.error("Open-Meteo AQ fetch error:", err);
    if (aqCache) return { ...aqCache.data };

    return {
      timestamp: new Date().toISOString(),
      europeanAQI: 0, pm25: 0, pm10: 0, no2: 0, ozone: 0,
      alderPollen: 0, birchPollen: 0, grassPollen: 0, mugwortPollen: 0,
      aqiLabel: "Sehr gut",
      source: "Copernicus CAMS (Open-Meteo)",
    };
  }
}
