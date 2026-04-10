/**
 * Eisbach Real-Time Data Fetcher
 * Station: München Himmelreichbrücke (ID: 16515005)
 *
 * Source priority:
 *   1. HND Bayern (official Bavarian Flood Warning Service) — primary
 *   2. GKD Bayern (official Bavarian Hydrological Service) — secondary
 *   3. RiverApp (re-publishes HND data as JSON-LD) — fallback only
 *
 * No hidden JSON API exists for HND or GKD Bayern; HTML scraping is required.
 */

import type { EisbachData } from "./types";

const STATION_ID = "16515005" as const;
const STATION_NAME = "München Himmelreichbrücke / Eisbach";

// ── HND Bayern (OFFICIAL — Hochwassernachrichtendienst Bayern) ────────────────
const HND_LEVEL_URL =
  "https://www.hnd.bayern.de/pegel/isar/muenchen-himmelreichbruecke-16515005";
const HND_FLOW_URL =
  "https://www.hnd.bayern.de/pegel/isar/muenchen-himmelreichbruecke-16515005/abfluss";

// Table pages (hourly data, 4-digit year in timestamps)
const HND_LEVEL_TABLE =
  "https://www.hnd.bayern.de/pegel/isar/muenchen-himmelreichbruecke-16515005/tabelle?methode=wasserstand";
const HND_FLOW_TABLE =
  "https://www.hnd.bayern.de/pegel/isar/muenchen-himmelreichbruecke-16515005/tabelle?methode=abfluss";

// ── GKD Bayern (OFFICIAL — Gewässerkundlicher Dienst Bayern) ─────────────────
const GKD_LEVEL_TABLE =
  "https://www.gkd.bayern.de/de/fluesse/wasserstand/kelheim/muenchen-himmelreichbruecke-16515005/messwerte/tabelle";
const GKD_FLOW_TABLE =
  "https://www.gkd.bayern.de/de/fluesse/abfluss/kelheim/muenchen-himmelreichbruecke-16515005/messwerte";
const GKD_TEMP_URL =
  "https://www.gkd.bayern.de/en/rivers/watertemperature/isar/muenchen-himmelreichbruecke-16515005/current-values";

// ── RiverApp (FALLBACK — re-publishes HND Bayern data) ────────────────────────
const RIVERAPP_URL =
  "https://www.riverapp.net/en/station/51b60b15e4b047688ee9d0e4";

// ── 15-minute cache ────────────────────────────────────────────────────────────
let cache: { data: EisbachData; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse German decimal: "24,2" → 24.2 */
function parseDE(s: string): number {
  return parseFloat(s.replace(",", "."));
}

/**
 * Parse German date formats:
 *   "10.04.26 19:45"   (HND main pages — 2-digit year)
 *   "10.04.2026 19:45" (HND/GKD table pages — 4-digit year)
 */
function parseGermanDate(s: string): string {
  const m = s.trim().match(/^(\d{2})\.(\d{2})\.(\d{2,4})\s+(\d{2}):(\d{2})$/);
  if (!m) return new Date().toISOString();
  const [, d, mo, y, h, min] = m;
  const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
  return new Date(year, parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(min)).toISOString();
}

/** Fetch with up to `retries` retries on network/non-200 errors. */
async function fetchHTML(url: string, retries = 2): Promise<string | null> {
  const opts: RequestInit = {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; IsarChecKI/1.0)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "de-DE,de;q=0.9",
    },
    // Next.js ISR — revalidate every 15 minutes server-side
    next: { revalidate: 900 },
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, opts);
      if (resp.ok) return await resp.text();
    } catch {
      // fall through to retry
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction: HND Bayern MAIN pages
// Pattern: Letzter Messwert vom <b|strong>DD.MM.YY HH:MM</b|strong> Uhr: <b|strong>VALUE</b|strong> UNIT
// ─────────────────────────────────────────────────────────────────────────────
function extractHNDMain(
  html: string
): { value: number; timestamp: string } | null {
  // HND pages use either <b> or <strong> (differs between station pages)
  const re =
    /Letzter Messwert vom\s*<(?:b|strong)>([^<]+)<\/(?:b|strong)>\s*Uhr:\s*<(?:b|strong)>([\d,\.]+)<\/(?:b|strong)>/i;
  const m = html.match(re);
  if (!m) return null;
  return { value: parseDE(m[2]), timestamp: parseGermanDate(m[1]) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction: HND/GKD TABLE pages
// Both sites render measurement tables as definition-list-style HTML pairs:
//   <...>DD.MM.YYYY HH:MM</...><...>VALUE</...>
// We strip HTML tags and extract the first (newest) timestamp+value pair.
// ─────────────────────────────────────────────────────────────────────────────
function extractTablePage(
  html: string
): { value: number; timestamp: string } | null {
  // Strip tags, collapse whitespace
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // Match: DD.MM.YYYY HH:MM followed by a decimal number (with optional comma)
  const re =
    /(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2})\s+([\d]+(?:[,\.]\d+)?)/;
  const m = text.match(re);
  if (!m) return null;
  return { value: parseDE(m[2]), timestamp: parseGermanDate(m[1]) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction: RiverApp JSON-LD (fallback)
// RiverApp embeds structured data: "value":NUMBER,"unitText":"UNIT"
// ─────────────────────────────────────────────────────────────────────────────
type RiverAppResult = {
  level?: number;
  flow?: number;
  temp?: number;
};

function extractRiverApp(html: string): RiverAppResult {
  const result: RiverAppResult = {};
  // JSON-LD blocks: "value":24.2,"unitText":"m³/s"
  const re = /"value"\s*:\s*([\d.]+)\s*,\s*"unitText"\s*:\s*"([^"]+)"/g;
  for (const m of html.matchAll(re)) {
    const v = parseFloat(m[1]);
    const unit = m[2].trim();
    if (unit === "cm" && result.level === undefined) result.level = v;
    else if (unit === "m³/s" && result.flow === undefined) result.flow = v;
    else if (unit === "°C" && result.temp === undefined) result.temp = v;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — individual metric functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Eisbach water level in cm.
 * Primary:   HND Bayern main station page (official)
 * Secondary: HND Bayern water-level table page (official)
 * Tertiary:  GKD Bayern water-level table page (official)
 * Fallback:  RiverApp JSON-LD (re-publishes HND data)
 */
export async function getEisbachWaterLevel(): Promise<{
  value: number | null;
  timestamp: string;
  source: string;
}> {
  // 1. HND Bayern main page
  const hndMain = await fetchHTML(HND_LEVEL_URL);
  if (hndMain) {
    const r = extractHNDMain(hndMain);
    if (r) return { ...r, source: "HND Bayern" };
  }

  // 2. HND Bayern table page (hourly)
  const hndTable = await fetchHTML(HND_LEVEL_TABLE);
  if (hndTable) {
    const r = extractTablePage(hndTable);
    if (r) return { ...r, source: "HND Bayern (Tabelle)" };
  }

  // 3. GKD Bayern table page (15-min)
  const gkdTable = await fetchHTML(GKD_LEVEL_TABLE);
  if (gkdTable) {
    const r = extractTablePage(gkdTable);
    if (r) return { ...r, source: "GKD Bayern" };
  }

  // 4. RiverApp fallback
  const ra = await fetchHTML(RIVERAPP_URL);
  if (ra) {
    const r = extractRiverApp(ra);
    if (r.level !== undefined) {
      return { value: r.level, timestamp: new Date().toISOString(), source: "RiverApp (HND)" };
    }
  }

  return { value: null, timestamp: new Date().toISOString(), source: "unavailable" };
}

/**
 * Eisbach discharge (Abfluss) in m³/s.
 * Primary:   HND Bayern abfluss page (official)
 * Secondary: HND Bayern discharge table page (official)
 * Tertiary:  GKD Bayern discharge page (official)
 * Fallback:  RiverApp JSON-LD
 */
export async function getEisbachDischarge(): Promise<{
  value: number | null;
  timestamp: string;
  source: string;
}> {
  // 1. HND Bayern abfluss main page
  const hndMain = await fetchHTML(HND_FLOW_URL);
  if (hndMain) {
    const r = extractHNDMain(hndMain);
    if (r) return { ...r, source: "HND Bayern" };
  }

  // 2. HND Bayern discharge table
  const hndTable = await fetchHTML(HND_FLOW_TABLE);
  if (hndTable) {
    const r = extractTablePage(hndTable);
    if (r) return { ...r, source: "HND Bayern (Tabelle)" };
  }

  // 3. GKD Bayern discharge page
  const gkdFlow = await fetchHTML(GKD_FLOW_TABLE);
  if (gkdFlow) {
    const r = extractTablePage(gkdFlow);
    if (r) return { ...r, source: "GKD Bayern" };
  }

  // 4. RiverApp fallback
  const ra = await fetchHTML(RIVERAPP_URL);
  if (ra) {
    const r = extractRiverApp(ra);
    if (r.flow !== undefined) {
      return { value: r.flow, timestamp: new Date().toISOString(), source: "RiverApp (HND)" };
    }
  }

  return { value: null, timestamp: new Date().toISOString(), source: "unavailable" };
}

/**
 * Eisbach water temperature in °C.
 * Primary:  GKD Bayern temperature page (15-min, official)
 * Fallback: RiverApp JSON-LD
 */
export async function getEisbachWaterTemperature(): Promise<{
  value: number | null;
  timestamp: string;
  source: string;
}> {
  // 1. GKD Bayern temperature page (best resolution — 15 min)
  const gkdTemp = await fetchHTML(GKD_TEMP_URL);
  if (gkdTemp) {
    const r = extractTablePage(gkdTemp);
    if (r) return { ...r, source: "GKD Bayern" };
  }

  // 2. RiverApp fallback
  const ra = await fetchHTML(RIVERAPP_URL);
  if (ra) {
    const r = extractRiverApp(ra);
    if (r.temp !== undefined) {
      return { value: r.temp, timestamp: new Date().toISOString(), source: "RiverApp (HND)" };
    }
  }

  return { value: null, timestamp: new Date().toISOString(), source: "unavailable" };
}

/**
 * Combined Eisbach real-time data from station 16515005 (Himmelreichbrücke).
 * Fetches all three metrics in parallel; results are individually cached.
 */
export async function getEisbachRealtimeData(): Promise<EisbachData> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  const [level, discharge, temp] = await Promise.all([
    getEisbachWaterLevel(),
    getEisbachDischarge(),
    getEisbachWaterTemperature(),
  ]);

  // Use the most recent non-fallback timestamp
  const timestamps = [level.timestamp, discharge.timestamp, temp.timestamp];
  const latestTimestamp = timestamps.reduce((latest, t) =>
    new Date(t) > new Date(latest) ? t : latest
  );

  // Deduplicate source labels
  const sources = [...new Set([level.source, discharge.source, temp.source])]
    .filter((s) => s !== "unavailable")
    .join(", ");

  const data: EisbachData = {
    stationId: STATION_ID,
    stationName: STATION_NAME,
    timestamp: latestTimestamp,
    waterLevelCm: level.value,
    dischargeM3s: discharge.value,
    waterTemperatureC: temp.value,
    source: sources || "unavailable",
  };

  cache = { data, fetchedAt: Date.now() };
  return data;
}
