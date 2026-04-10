import { NextResponse } from "next/server";
import { fetchIsarWaterData } from "@/lib/fetchIsarData";
import { fetchTemperature } from "@/lib/fetchTemperature";
import { fetchWeather } from "@/lib/fetchWeather";
import { getEisbachRealtimeData } from "@/lib/fetchEisbachData";
import { fetchPollen, fetchAirQuality } from "@/lib/fetchAirQuality";
import { buildIsarData } from "@/lib/safetyLogic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never pre-render during build
export const revalidate = 0;

export async function GET() {
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

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Error fetching Isar data:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Isardaten" },
      { status: 500 }
    );
  }
}
