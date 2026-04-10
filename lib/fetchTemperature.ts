import type { TemperatureData } from "./types";

const GKD_TABLE_URL =
  "https://www.gkd.bayern.de/en/rivers/watertemperature/isar/muenchen-16005702/table";

let cache: { data: TemperatureData; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function tryGKDTablePage(): Promise<number | null> {
  try {
    const html = await fetch(GKD_TABLE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "de-DE,de;q=0.9",
        Referer: "https://www.gkd.bayern.de/",
      },
      next: { revalidate: 1800 },
    }).then((r) => r.text());

    // Try to extract temperature from table: "<td class="center">XX.X</td>"
    const tdMatch = html.match(
      /class="center">\s*([\d]+\.[\d]+)\s*<\/td>/
    );
    if (tdMatch) {
      return parseFloat(tdMatch[1]);
    }

    // Try alternative pattern from Letzter Messwert (non-dotAll)
    const lastMatch = html.match(
      /Letzter Messwert[^<]*<b>([\d]+\.[\d]+)<\/b>/
    );
    if (lastMatch) {
      return parseFloat(lastMatch[1]);
    }

    return null;
  } catch {
    return null;
  }
}

async function tryGKDWebservices(): Promise<number | null> {
  // Try common GKD webservices URL patterns
  const patterns = [
    "https://www.gkd.bayern.de/webservices/gkd/messwerte/wassertemperatur/station/16005702/json",
    "https://www.gkd.bayern.de/webservices/gkd/messwerte/station/16005702/parameter/wassertemperatur/json",
    "https://www.gkd.bayern.de/webservices/messwerte/wassertemperatur/16005702/json",
  ];

  for (const url of patterns) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IsarChecKI/1.0)",
          Referer: "https://www.gkd.bayern.de/",
          "X-Requested-With": "XMLHttpRequest",
        },
        next: { revalidate: 1800 },
      });
      if (!resp.ok) continue;
      const text = await resp.text();
      if (text.includes("not found") || text.includes("DOCTYPE")) continue;
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        const last = data[data.length - 1];
        const val = last?.value ?? last?.wert ?? last?.messwert;
        if (val !== undefined) return parseFloat(val);
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchTemperature(): Promise<TemperatureData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  // Try multiple sources
  let temp = await tryGKDTablePage();
  if (temp === null) {
    temp = await tryGKDWebservices();
  }

  if (temp !== null) {
    const data: TemperatureData = {
      temperatur: temp,
      timestamp: new Date().toISOString(),
    };
    cache = { data, fetchedAt: now };
    return data;
  }

  // Return cached stale data or default
  if (cache) {
    return { ...cache.data, stale: true };
  }

  // Seasonal estimate fallback (April in Munich: ~8-12°C)
  const month = new Date().getMonth();
  const seasonalEstimates = [4, 5, 7, 9, 14, 18, 20, 19, 16, 12, 8, 5];
  return {
    temperatur: seasonalEstimates[month],
    timestamp: new Date().toISOString(),
    stale: true,
  };
}
