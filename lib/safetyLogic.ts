import type { IsarData, AIVerdict, Verdict, EisbachData, PollenData, AirQualityData } from "./types";
import type { IsarWaterData, WeatherData, TemperatureData } from "./types";

export function computeBacteriaRisk(
  weather: WeatherData
): "niedrig" | "mittel" | "hoch" {
  if (weather.rainLast24h > 15 || weather.rainLast48h > 25) return "hoch";
  if (weather.rainLast24h > 5 || weather.rainLast48h > 10) return "mittel";
  return "niedrig";
}

export function computeFlowLabel(
  abfluss: number
): "ruhig" | "moderat" | "gefährlich" {
  if (abfluss > 200) return "gefährlich";
  if (abfluss > 100) return "moderat";
  return "ruhig";
}

export function computeTempLabel(
  temp: number
): "warm" | "angenehm" | "kalt" | "zu kalt" {
  if (temp >= 18) return "warm";
  if (temp >= 14) return "angenehm";
  if (temp >= 10) return "kalt";
  return "zu kalt";
}

export function computeLevelLabel(
  wasserstand: number
): "sicher" | "vorsicht" | "gefährlich" {
  if (wasserstand > 150) return "gefährlich";
  if (wasserstand > 120) return "vorsicht";
  return "sicher";
}

/**
 * Eisbach surfability based on discharge at Himmelreichbrücke (station 16515005).
 * Falls back to München Pegel (16005701) discharge if Eisbach data unavailable.
 *
 * Optimal range: 50–85 m³/s (confirmed by Münchner surf community & historical data).
 *   - Below 35: wave too flat / non-existent
 *   - 35–50: wave starting to form, possible for advanced surfers
 *   - 50–85: ideal conditions
 *   - 85–120: strong wave, expert only
 *   - Above 120: too powerful, dangerous, wave closes
 */
export function computeEisbachSurfable(
  eisbachDischarge: number | null,
  fallbackAbfluss: number
): "ideal" | "möglich" | "nicht surfbar" {
  const q = eisbachDischarge ?? fallbackAbfluss;
  if (q >= 50 && q <= 85) return "ideal";
  if ((q >= 35 && q < 50) || (q > 85 && q <= 120)) return "möglich";
  return "nicht surfbar";
}

export function buildIsarData(
  water: IsarWaterData,
  temperature: TemperatureData,
  weather: WeatherData,
  eisbach: EisbachData,
  pollen: PollenData,
  airQuality: AirQualityData
): IsarData {
  return {
    water,
    temperature,
    weather,
    eisbach,
    pollen,
    airQuality,
    bacteriaRisk: computeBacteriaRisk(weather),
    flowLabel: computeFlowLabel(water.abfluss),
    tempLabel: computeTempLabel(temperature.temperatur),
    levelLabel: computeLevelLabel(water.wasserstand),
    eisbachSurfable: computeEisbachSurfable(eisbach.dischargeM3s, water.abfluss),
  };
}

export function generateFallbackVerdict(data: IsarData): AIVerdict {
  const { water, temperature, weather, bacteriaRisk, flowLabel, levelLabel } = data;

  let verdict: Verdict = "sicher";
  const factors: string[] = [];

  if (levelLabel === "gefährlich") {
    verdict = "meiden";
    factors.push(`Hoher Wasserstand: ${water.wasserstand} cm`);
  } else if (levelLabel === "vorsicht") {
    verdict = verdict === "sicher" ? "vorsicht" : verdict;
    factors.push(`Erhöhter Wasserstand: ${water.wasserstand} cm`);
  } else {
    factors.push(`Wasserstand normal: ${water.wasserstand} cm`);
  }

  if (flowLabel === "gefährlich") {
    verdict = "meiden";
    factors.push(`Starke Strömung: ${water.abfluss} m³/s`);
  } else if (flowLabel === "moderat") {
    verdict = verdict === "sicher" ? "vorsicht" : verdict;
    factors.push(`Moderate Strömung: ${water.abfluss} m³/s`);
  } else {
    factors.push(`Ruhige Strömung: ${water.abfluss} m³/s`);
  }

  if (bacteriaRisk === "hoch") {
    verdict = "meiden";
    factors.push(`Hohes Bakterienrisiko nach starkem Regen`);
  } else if (bacteriaRisk === "mittel") {
    verdict = verdict === "sicher" ? "vorsicht" : verdict;
    factors.push(`Mittleres Bakterienrisiko`);
  } else {
    factors.push(`Niedriges Bakterienrisiko`);
  }

  if (temperature.stale) {
    factors.push("Wassertemperatur nicht verfügbar – bitte vor Ort prüfen");
  } else if (temperature.temperatur < 10) {
    verdict = verdict === "sicher" ? "vorsicht" : verdict;
    factors.push(`Sehr kaltes Wasser: ${temperature.temperatur}°C`);
  }

  const under5: Verdict =
    verdict === "sicher" && temperature.temperatur >= 14 && flowLabel === "ruhig"
      ? "sicher"
      : verdict === "meiden"
      ? "meiden"
      : "vorsicht";
  const age5to12: Verdict =
    verdict === "sicher" || (verdict === "vorsicht" && flowLabel !== "gefährlich")
      ? verdict === "sicher" ? "sicher" : "vorsicht"
      : "meiden";
  const adults: Verdict =
    verdict === "meiden" && levelLabel === "gefährlich" ? "meiden" : verdict;

  const headlines: Record<Verdict, string> = {
    sicher: "Heut is a schöner Tag zum Baden!",
    vorsicht: "Mit Vorsicht ins Wasser",
    meiden: "Besser heute nicht schwimmen",
  };

  const tempNote = temperature.stale
    ? " Die Wassertemperatur konnte nicht abgerufen werden – bitte vor Ort prüfen."
    : "";
  const waterNote = water.stale
    ? " Wasserstand und Abfluss sind derzeit nicht verfügbar – Einschätzung unvollständig."
    : "";
  const dataNote = tempNote + waterNote;

  const summaries: Record<Verdict, string> = {
    sicher: `Die Isar zeigt sich heute von ihrer besten Seite. Wasserstand bei ${water.stale ? "N/V" : `${water.wasserstand} cm`}, die Strömung ist ${water.stale ? "unbekannt" : flowLabel}${temperature.stale ? "" : ` und die Wassertemperatur liegt bei ${temperature.temperatur}°C`}. Perfekt für einen Familienausflug!${dataNote}`,
    vorsicht: `Die Isar ist heute mit etwas Vorsicht genießbar. ${water.stale ? "Wasserstand und Abfluss nicht verfügbar." : `Wasserstand: ${water.wasserstand} cm, Strömung ${flowLabel}.`} Kinder sollten nur unter direkter Aufsicht ins Wasser.${dataNote}`,
    meiden: `Heute sollte die Isar gemieden werden. ${factors[0]}. Bitte warten Sie bis sich die Bedingungen verbessert haben.${dataNote}`,
  };

  const tips: Record<Verdict, string> = {
    sicher: "Sonnencreme nicht vergessen und genug Wasser mitbringen!",
    vorsicht: "Kinder immer im Blickfeld behalten und nah am Ufer bleiben.",
    meiden: "Schöner Spaziergang am Ufer ist heute die bessere Wahl.",
  };

  const bestSpots: Record<Verdict, string> = {
    sicher: "Flaucher — flaches Wasser, ideal für Familien",
    vorsicht: "Thalkirchen — ruhigere Strömung als anderswo",
    meiden: "Heute keinen Badeplatz empfohlen",
  };

  return {
    verdict,
    headline: headlines[verdict],
    summary: summaries[verdict],
    childrenRating: { under5, age5to12, adults },
    keyFactors: factors.slice(0, 3),
    bestSpot: bestSpots[verdict],
    tip: tips[verdict],
    updatedAt: new Date().toISOString(),
    fallback: true,
  };
}
