import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IsarData, AIVerdict } from "./types";
import { generateFallbackVerdict } from "./safetyLogic";
import { DWD_LEVEL_LABELS } from "./fetchAirQuality";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

let cache: { verdict: AIVerdict; fetchedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000;

// Model cascade: try in order until one succeeds.
// Each model has its own separate daily quota on the free tier.
const MODEL_CASCADE = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite-preview",
];

const SYSTEM_PROMPT = `Du bist der Isar Check KI-Assistent, ein freundlicher und sachkundiger Experte für die Münchner Isar. Du sprichst Hochdeutsch mit gelegentlichen bayerischen Ausdrücken wie gmiatlich, schee und Vergelt\\'s Gott. Deine Aufgabe ist es, Münchner Familien klar und ehrlich einzuschätzen, ob die Isar heute sicher zum Schwimmen ist. Antworte direkt, warm und ohne Fachjargon. Zielgruppe sind Eltern mit Kindern. Antworte ausschließlich mit validem JSON. Gib kein Markdown aus. Gib keine Einleitung, keine Erklärung und keinen Text außerhalb des JSON aus.`;

function pollenSummary(data: IsarData): string {
  const p = data.pollen;
  const active = [
    p.birke.today > 1 && `Birke: ${DWD_LEVEL_LABELS[p.birke.today]}`,
    p.erle.today > 1 && `Erle: ${DWD_LEVEL_LABELS[p.erle.today]}`,
    p.graeser.today > 1 && `Gräser: ${DWD_LEVEL_LABELS[p.graeser.today]}`,
    p.esche.today > 1 && `Esche: ${DWD_LEVEL_LABELS[p.esche.today]}`,
  ].filter(Boolean);
  return active.length > 0 ? active.join(", ") : "gering";
}

// ── Error classification helpers ──────────────────────────────────────────────

/** 429 rate-limit, but it might be per-minute (retriable) or daily (not retriable). */
function isRateLimitError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: number }).status === 429
  );
}

/**
 * Returns true if the quota violation is a DAILY limit — retrying is futile.
 * Detects by looking for "PerDay" or "PerDayPer" in the quotaId strings.
 */
function isDailyQuotaExhausted(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as {
    errorDetails?: Array<{
      violations?: Array<{ quotaId?: string }>;
    }>;
  };
  return (e.errorDetails ?? []).some((d) =>
    (d.violations ?? []).some((v) => v.quotaId?.includes("PerDay"))
  );
}

/** Extract RetryInfo delay in ms from the Gemini error, defaulting to 12 s. */
function getRetryDelayMs(error: unknown): number {
  if (typeof error !== "object" || error === null) return 12_000;
  const e = error as {
    errorDetails?: Array<{ retryDelay?: string }>;
  };
  for (const d of e.errorDetails ?? []) {
    if (d.retryDelay) {
      const secs = parseFloat(d.retryDelay);
      if (!isNaN(secs)) return Math.ceil(secs) * 1000 + 1000; // add 1 s buffer
    }
  }
  return 12_000;
}

// ── Core call: one model, one attempt ─────────────────────────────────────────
async function callGemini(
  modelName: string,
  prompt: string
): Promise<AIVerdict> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
      temperature: 0.4,
    },
  });
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text()) as Omit<AIVerdict, "updatedAt">;
  return { ...parsed, updatedAt: new Date().toISOString() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export async function generateVerdict(data: IsarData): Promise<AIVerdict> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.verdict;
  }

  const { water, temperature, weather, eisbach, airQuality } = data;

  const prompt = `Aktuelle Isardaten:

ISAR ALLGEMEIN (Pegel München, Station 16005701):
- Wasserstand: ${water.wasserstand} cm (Meldestufe ${water.meldestufe})
- Abfluss: ${water.abfluss} m³/s
- Wassertemperatur: ${temperature.temperatur}°C${temperature.stale ? " (Schätzwert)" : ""}

EISBACH (Station Himmelreichbrücke 16515005 — direkt am Surfspot):
- Wasserstand: ${eisbach.waterLevelCm ?? "n/v"} cm
- Abfluss: ${eisbach.dischargeM3s ?? "n/v"} m³/s → Eisbach-Welle: ${data.eisbachSurfable} (optimal 50–85 m³/s)
- Wassertemperatur: ${eisbach.waterTemperatureC ?? "n/v"}°C
- Datenquelle: ${eisbach.source}

WETTER:
- Regen letzte 24h: ${weather.rainLast24h}mm / 48h: ${weather.rainLast48h}mm
- Regenvorhersage nächste 24h: ${weather.forecastRain}mm
- UV-Index heute: ${weather.uvIndexMax} / Wind: ${weather.windSpeedMax} km/h

LUFT & POLLEN (Copernicus CAMS + DWD):
- Luftqualität (EU AQI): ${airQuality.europeanAQI} — ${airQuality.aqiLabel}
- PM2.5: ${airQuality.pm25} μg/m³ · PM10: ${airQuality.pm10} μg/m³
- Aktive Pollenbelastung: ${pollenSummary(data)}

Erstelle eine Sicherheitseinschätzung als JSON:
{
  "verdict": "sicher" | "vorsicht" | "meiden",
  "headline": "Kurze prägnante Headline (max 8 Wörter, darf bayerisch sein)",
  "summary": "2-3 Sätze Erklärung für Eltern (Hochdeutsch)",
  "childrenRating": {
    "under5": "sicher" | "vorsicht" | "meiden",
    "age5to12": "sicher" | "vorsicht" | "meiden",
    "adults": "sicher" | "vorsicht" | "meiden"
  },
  "keyFactors": ["Faktor 1", "Faktor 2", "Faktor 3"],
  "bestSpot": "Empfohlener Spot (Schwimmen: Flaucher, Thalkirchen, Großhesselohe, Maximiliansanlagen; Surfen: Eisbach wenn Abfluss 50–85 m³/s)",
  "tip": "1 konkreter Tipp für heute inkl. Pollen/Luft wenn relevant (max 20 Wörter)"
}`;

  // Try each model in the cascade
  for (const modelName of MODEL_CASCADE) {
    let lastError: unknown;

    // Per-minute rate limits are retriable once; daily limits are not.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const verdict = await callGemini(modelName, prompt);
        cache = { verdict, fetchedAt: now };
        return verdict;
      } catch (err) {
        lastError = err;

        if (!isRateLimitError(err)) break; // not a quota error — no point retrying

        if (isDailyQuotaExhausted(err)) {
          // Daily quota gone for this model — try next model immediately
          console.warn(`Gemini daily quota exhausted for ${modelName}, trying next model`);
          break;
        }

        if (attempt === 0) {
          // Per-minute limit — wait what Gemini tells us, then retry once
          const delay = getRetryDelayMs(err);
          console.warn(`Gemini 429 (per-minute) for ${modelName} — waiting ${delay / 1000}s`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // Log the last error for this model before moving to the next
    if (lastError) console.error(`Gemini error (${modelName}):`, lastError);
  }

  // All models exhausted — return stale cache or rule-based fallback
  console.warn("All Gemini models failed — using fallback verdict");
  if (cache) return { ...cache.verdict, stale: true };
  return generateFallbackVerdict(data);
}
