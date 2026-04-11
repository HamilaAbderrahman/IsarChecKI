import { NextRequest, NextResponse } from "next/server";
import { fetchIsarWaterData } from "@/lib/fetchIsarData";
import { fetchTemperature } from "@/lib/fetchTemperature";
import { fetchWeather } from "@/lib/fetchWeather";
import { getEisbachRealtimeData } from "@/lib/fetchEisbachData";
import { fetchPollen, fetchAirQuality } from "@/lib/fetchAirQuality";
import { buildIsarData } from "@/lib/safetyLogic";
import { generateVerdict } from "@/lib/verdictEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never pre-render during build
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    const [water, temperature, weather, eisbach, pollen, airQuality] =
      await Promise.all([
        fetchIsarWaterData(),
        fetchTemperature(),
        fetchWeather(),
        getEisbachRealtimeData(),
        fetchPollen(),
        fetchAirQuality(),
      ]);

    const data = buildIsarData(water, temperature, weather, eisbach, pollen, airQuality);
    const verdict = await generateVerdict(data);

    return NextResponse.json(
      { verdict, data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error generating verdict:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Urteils" },
      { status: 500 }
    );
  }
}
