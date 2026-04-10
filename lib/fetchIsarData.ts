import type { IsarWaterData } from "./types";

const WATER_LEVEL_URL =
  "https://www.hnd.bayern.de/pegel/isar/muenchen-16005701";
const FLOW_URL =
  "https://www.hnd.bayern.de/pegel/isar/muenchen-16005701/abfluss";

let cache: { data: IsarWaterData; fetchedAt: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function extractValue(html: string, unit: string): number | null {
  // Pattern: "Letzter Messwert vom <b>DD.MM.YY HH:MM</b> Uhr: <b>VALUE</b> UNIT"
  // Use non-dotAll pattern: match up to "Uhr:" without spanning newlines
  const regex = new RegExp(
    `Letzter Messwert vom[^U]*Uhr: <b>([\\d,\\.]+)<\\/b>\\s*${unit.replace("/", "/")}`
  );
  const match = html.match(regex);
  if (!match) return null;
  // German number format: 52,4 -> 52.4
  return parseFloat(match[1].replace(",", "."));
}

function extractTimestamp(html: string): string {
  const match = html.match(
    /Letzter Messwert vom <b>([\d.:]+ [\d:]+)<\/b> Uhr/
  );
  if (!match) return new Date().toISOString();
  // Parse "07.04.26 22:00" format
  const parts = match[1].split(" ");
  const dateParts = parts[0].split(".");
  const timeParts = parts[1].split(":");
  const year = parseInt(dateParts[2]) + 2000;
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[0]);
  const hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);
  return new Date(year, month, day, hour, minute).toISOString();
}

function extractMeldestufe(html: string): number {
  // Look for active Meldestufe indicators
  // The page shows meldestufen thresholds, actual level is implied by water level
  // Check if there's a highlighted Meldestufe
  if (html.includes("Meldestufe 4") && html.includes("color:#840084")) {
    // Check if we're above MS4 threshold
  }
  // Parse the current water level and infer meldestufe
  // MS1=240, MS2=300, MS3=380, MS4=520
  const wasserstand = extractValue(html, "cm");
  if (!wasserstand) return 0;
  if (wasserstand >= 520) return 4;
  if (wasserstand >= 380) return 3;
  if (wasserstand >= 300) return 2;
  if (wasserstand >= 240) return 1;
  return 0;
}

export async function fetchIsarWaterData(): Promise<IsarWaterData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  try {
    const [levelHtml, flowHtml] = await Promise.all([
      fetch(WATER_LEVEL_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IsarChecKI/1.0)",
          Accept: "text/html",
        },
        next: { revalidate: 600 },
      }).then((r) => r.text()),
      fetch(FLOW_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IsarChecKI/1.0)",
          Accept: "text/html",
        },
        next: { revalidate: 600 },
      }).then((r) => r.text()),
    ]);

    const wasserstand = extractValue(levelHtml, "cm");
    const abfluss = extractValue(flowHtml, "m");
    const timestamp = extractTimestamp(levelHtml);
    const meldestufe = extractMeldestufe(levelHtml);

    if (wasserstand === null || abfluss === null) {
      throw new Error("Could not extract water data from HND Bayern");
    }

    const data: IsarWaterData = {
      wasserstand,
      abfluss,
      meldestufe,
      timestamp,
    };

    cache = { data, fetchedAt: now };
    return data;
  } catch (error) {
    if (cache) {
      return { ...cache.data, stale: true };
    }
    // Fallback defaults
    return {
      wasserstand: 0,
      abfluss: 0,
      meldestufe: 0,
      timestamp: new Date().toISOString(),
      stale: true,
    };
  }
}
