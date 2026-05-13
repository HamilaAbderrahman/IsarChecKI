import type { IsarData, AIVerdict, Verdict, EisbachData, EisbachSurfAssessment, PollenData, AirQualityData } from "./types";
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
 * Eisbach surfability based on water level (Pegel cm) at Himmelreichbrücke (station 16515005).
 * Ground truth from Munich surf community:
 *   <130 cm  → not surfable (wave absent or too flat)
 *   130–139  → möglich, rock danger (very low water, stones exposed)
 *   140–144  → möglich (low but rideable)
 *   145–149  → ideal (perfect wave)
 *   ≥150     → möglich (high water, wild, likely poor quality)
 */
export function computeEisbachSurfable(
  waterLevelCm: number | null
): "ideal" | "möglich" | "nicht surfbar" {
  if (waterLevelCm === null) return "nicht surfbar";
  if (waterLevelCm >= 145 && waterLevelCm < 150) return "ideal";
  if (waterLevelCm >= 130) return "möglich";
  return "nicht surfbar";
}

/**
 * Rich Eisbach assessment: skill level, water quality, smell risk, and brief text.
 * Driven by water level (cm) and bacteria risk from rain data.
 */
export function computeEisbachAssessment(
  waterLevelCm: number | null,
  bacteriaRisk: "niedrig" | "mittel" | "hoch"
): EisbachSurfAssessment {
  let skillLevel: EisbachSurfAssessment["skillLevel"] = null;
  if (waterLevelCm !== null && waterLevelCm >= 130) {
    skillLevel =
      waterLevelCm < 140 || waterLevelCm >= 150 ? "Experte" : "Fortgeschrittene";
  }

  const highWater = waterLevelCm !== null && waterLevelCm >= 150;
  const waterQuality: EisbachSurfAssessment["waterQuality"] =
    bacteriaRisk === "hoch" || highWater
      ? "schlecht"
      : bacteriaRisk === "mittel"
      ? "fraglich"
      : "gut";
  const smellRisk = bacteriaRisk === "hoch" || highWater;

  let briefText: string;
  if (waterLevelCm === null) {
    briefText =
      "Pegeldaten nicht verfügbar — Surfbedingungen können nicht beurteilt werden.";
  } else if (waterLevelCm < 130) {
    briefText =
      "Zu wenig Wasser — die Welle ist zu flach oder gar nicht vorhanden. Heute kein Surfen.";
  } else if (waterLevelCm < 140) {
    briefText = `Pegel ${waterLevelCm} cm: Welle vorhanden, aber Steine liegen frei. Hohe Verletzungsgefahr — nur für absolute Experten mit Risikobewusstsein.`;
  } else if (waterLevelCm < 145) {
    briefText = `Pegel ${waterLevelCm} cm: niedrige aber surfbare Welle. Technisch anspruchsvoll — für Fortgeschrittene geeignet.`;
  } else if (waterLevelCm < 150) {
    briefText = `Pegel ${waterLevelCm} cm: perfekte Bedingungen! Die Welle ist sauber und gut formiert. Für Fortgeschrittene und Experten.`;
  } else {
    briefText = `Pegel ${waterLevelCm} cm: hoher Wasserstand, kräftige Welle mit starker Strömung. Anfänger und Fortgeschrittene besser als Zuschauer bleiben.`;
  }

  if (smellRisk) {
    briefText +=
      " Achtung: nach Starkregen oder Hochwasser kann der Eisbach nach Kanalwasser riechen — Wasserqualität fraglich.";
  }

  return { skillLevel, waterQuality, smellRisk, briefText };
}

export function buildIsarData(
  water: IsarWaterData,
  temperature: TemperatureData,
  weather: WeatherData,
  eisbach: EisbachData,
  pollen: PollenData,
  airQuality: AirQualityData
): IsarData {
  const bacteriaRisk = computeBacteriaRisk(weather);
  return {
    water,
    temperature,
    weather,
    eisbach,
    pollen,
    airQuality,
    bacteriaRisk,
    flowLabel: computeFlowLabel(water.abfluss),
    tempLabel: computeTempLabel(temperature.temperatur),
    levelLabel: computeLevelLabel(water.wasserstand),
    eisbachSurfable: computeEisbachSurfable(eisbach.waterLevelCm),
    eisbachAssessment: computeEisbachAssessment(eisbach.waterLevelCm, bacteriaRisk),
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
