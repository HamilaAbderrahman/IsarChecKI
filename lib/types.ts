export type Verdict = "sicher" | "vorsicht" | "meiden";

export interface IsarWaterData {
  wasserstand: number; // cm
  abfluss: number; // m³/s
  meldestufe: number; // 0-4
  timestamp: string;
  stale?: boolean;
}

export interface WeatherData {
  rainLast24h: number; // mm
  rainLast48h: number; // mm
  rainLast72h: number; // mm
  forecastRain: number; // next 24h mm
  weatherCode: number; // WMO code
  uvIndexMax: number;
  windSpeedMax: number; // km/h
  forecastDays: ForecastDay[];
}

export interface ForecastDay {
  date: string; // ISO date
  dayLabel: string; // "Mo", "Di", etc.
  rainSum: number; // mm
  maxTemp: number; // °C
  weatherCode: number;
  uvIndexMax: number;
  windSpeedMax: number; // km/h
}

export interface TemperatureData {
  temperatur: number; // °C
  timestamp: string;
  stale?: boolean;
}

// ── Eisbach station 16515005 (Himmelreichbrücke) ─────────────────────────────
export interface EisbachData {
  stationId: string;
  stationName: string;
  timestamp: string;
  waterLevelCm: number | null;
  dischargeM3s: number | null; // This is the key input for surf conditions
  waterTemperatureC: number | null;
  source: string; // e.g. "HND Bayern, GKD Bayern"
  stale?: boolean;
}

// ── DWD Pollen (Pollenflug-Gefahrenindex) ─────────────────────────────────────
// Level scale: 0=keine, 0.5=sehr gering, 1=gering, 1.5=gering-mittel,
//              2=mittel, 2.5=mittel-hoch, 3=hoch, -1=unbekannt
export interface PollenEntry {
  today: number;
  tomorrow: number;
}

export interface PollenData {
  updatedAt: string;
  nextUpdate: string;
  regionName: string;
  birke: PollenEntry;
  erle: PollenEntry;
  hasel: PollenEntry;
  graeser: PollenEntry;
  esche: PollenEntry;
  roggen: PollenEntry;
  beifuss: PollenEntry;
  ambrosia: PollenEntry;
  source: "DWD";
}

// ── Air Quality (Copernicus CAMS via Open-Meteo) ──────────────────────────────
export interface AirQualityData {
  timestamp: string;
  europeanAQI: number; // EAQI 0–100+ (0–20 very good, 80+ very bad)
  pm25: number; // μg/m³
  pm10: number; // μg/m³
  no2: number; // μg/m³
  ozone: number; // μg/m³
  alderPollen: number; // grains/m³ (Erle)
  birchPollen: number; // grains/m³ (Birke)
  grassPollen: number; // grains/m³ (Gräser)
  mugwortPollen: number; // grains/m³ (Beifuß)
  aqiLabel: "Sehr gut" | "Gut" | "Mäßig" | "Schlecht" | "Sehr schlecht";
  source: "Copernicus CAMS (Open-Meteo)";
}

// ── Combined IsarData ─────────────────────────────────────────────────────────
export interface IsarData {
  water: IsarWaterData;
  temperature: TemperatureData;
  weather: WeatherData;
  eisbach: EisbachData;
  pollen: PollenData;
  airQuality: AirQualityData;
  bacteriaRisk: "niedrig" | "mittel" | "hoch";
  flowLabel: "ruhig" | "moderat" | "gefährlich";
  tempLabel: "warm" | "angenehm" | "kalt" | "zu kalt";
  levelLabel: "sicher" | "vorsicht" | "gefährlich";
  eisbachSurfable: "ideal" | "möglich" | "nicht surfbar";
}

export interface ChildrenRating {
  under5: Verdict;
  age5to12: Verdict;
  adults: Verdict;
}

export interface AIVerdict {
  verdict: Verdict;
  headline: string;
  summary: string;
  childrenRating: ChildrenRating;
  keyFactors: string[];
  bestSpot: string;
  tip: string;
  updatedAt: string;
  stale?: boolean;
  fallback?: boolean;
}

export interface Spot {
  id: string;
  name: string;
  description: string;
  kidFriendly: boolean;
  surfSpot?: boolean;
  optimalFlowMin?: number;
  optimalFlowMax?: number;
  coordinates: { lat: number; lng: number };
  characteristics: string[];
  mapsUrl?: string;
}
