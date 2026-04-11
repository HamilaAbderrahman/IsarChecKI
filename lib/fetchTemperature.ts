import type { TemperatureData } from "./types";

// Station 16005701 = München Isar (GKD Bayern)
// Correct URL structure: /de/fluesse/wassertemperatur/kelheim/{name}-{id}/messwerte/tabelle
const GKD_TABLE_URL =
  "https://www.gkd.bayern.de/de/fluesse/wassertemperatur/kelheim/muenchen-16005701/messwerte/tabelle";

// Station listing page — embeds current values as JSON in the map init script
const GKD_LISTING_URL =
  "https://www.gkd.bayern.de/de/fluesse/wassertemperatur";

const STATION_ID = "16005701";

let cache: { data: TemperatureData; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/** Parse German decimal: "8,3" → 8.3, "8.3" → 8.3 */
function parseDE(s: string): number {
  return parseFloat(s.replace(",", "."));
}

async function tryGKDTablePage(): Promise<number | null> {
  try {
    const html = await fetch(GKD_TABLE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IsarChecKI/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      next: { revalidate: 1800 },
    }).then((r) => r.text());

    // GKD table: <td class="center">8,3</td> (German comma notation)
    const tdMatch = html.match(
      /class="center">\s*([\d]+[,\.][\d]+)\s*<\/td>/
    );
    if (tdMatch) {
      return parseDE(tdMatch[1]);
    }

    return null;
  } catch {
    return null;
  }
}

async function tryGKDListingPage(): Promise<number | null> {
  try {
    const html = await fetch(GKD_LISTING_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IsarChecKI/1.0)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
      },
      next: { revalidate: 1800 },
    }).then((r) => r.text());

    // GKD listing page embeds current station data as JSON in the map init script:
    // {"p":"16005701","n":"München",...,"w":"8,3"}
    const re = new RegExp(
      `"p":"${STATION_ID}"[^}]*"w":"([\\d,\\.]+)"`
    );
    const m = html.match(re);
    if (m) {
      return parseDE(m[1]);
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchTemperature(): Promise<TemperatureData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  // 1. GKD table page (most reliable — actual measurement rows)
  let temp = await tryGKDTablePage();

  // 2. GKD listing page (has current value embedded in map JSON)
  if (temp === null) {
    temp = await tryGKDListingPage();
  }

  if (temp !== null) {
    const data: TemperatureData = {
      temperatur: temp,
      timestamp: new Date().toISOString(),
    };
    cache = { data, fetchedAt: now };
    return data;
  }

  // Return cached stale data or seasonal estimate
  if (cache) {
    return { ...cache.data, stale: true };
  }

  // Seasonal estimate fallback (Munich Isar monthly averages)
  const month = new Date().getMonth();
  const seasonalEstimates = [4, 5, 7, 9, 14, 18, 20, 19, 16, 12, 8, 5];
  return {
    temperatur: seasonalEstimates[month],
    timestamp: new Date().toISOString(),
    stale: true,
  };
}
