// To push to SmallTV: POST the image binary to http://<device-ip>/upload
// or schedule in n8n: HTTP Request node → GET this endpoint →
// HTTP Request node → POST to SmallTV local IP as multipart/form-data

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { fetchIsarWaterData } from "@/lib/fetchIsarData";
import { fetchTemperature } from "@/lib/fetchTemperature";
import { fetchWeather } from "@/lib/fetchWeather";
import { getEisbachRealtimeData } from "@/lib/fetchEisbachData";
import { fetchPollen, fetchAirQuality } from "@/lib/fetchAirQuality";
import { buildIsarData } from "@/lib/safetyLogic";
import { generateVerdict } from "@/lib/verdictEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SIZE = 240;

const VERDICT_MAP = {
  sicher:  { emoji: "✅", label: "PASST",    color: "#22c55e" },
  vorsicht:{ emoji: "⚠️",  label: "VORSICHT", color: "#f59e0b" },
  meiden:  { emoji: "❌", label: "STOPP",    color: "#ef4444" },
} as const;

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

    const v = VERDICT_MAP[verdict.verdict];
    const temp = Math.round(data.temperature.temperatur);
    const level = Math.round(data.water.wasserstand);
    const flow = Math.round(data.water.abfluss);
    const headline =
      verdict.headline.length > 40
        ? verdict.headline.slice(0, 40) + "…"
        : verdict.headline;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#0f172a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 10px",
          }}
        >
          {/* "Isar Check" label */}
          <div
            style={{
              color: "#64748b",
              fontSize: 10,
              letterSpacing: 2,
              display: "flex",
            }}
          >
            ISAR CHECK
          </div>

          {/* Verdict emoji */}
          <div style={{ fontSize: 52, display: "flex" }}>{v.emoji}</div>

          {/* Verdict status text */}
          <div
            style={{
              color: v.color,
              fontSize: 28,
              fontWeight: "bold",
              letterSpacing: 4,
              display: "flex",
            }}
          >
            {v.label}
          </div>

          {/* Water temp + water level */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div style={{ color: "#64748b", fontSize: 9, display: "flex" }}>
                TEMP
              </div>
              <div
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "bold",
                  display: "flex",
                }}
              >
                {temp}°C
              </div>
            </div>

            <div
              style={{ color: "#334155", fontSize: 18, display: "flex" }}
            >
              |
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div style={{ color: "#64748b", fontSize: 9, display: "flex" }}>
                PEGEL
              </div>
              <div
                style={{
                  color: "white",
                  fontSize: 15,
                  fontWeight: "bold",
                  display: "flex",
                }}
              >
                {level} cm
              </div>
            </div>
          </div>

          {/* Strömung */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ color: "#64748b", fontSize: 9, display: "flex" }}>
              STRÖMUNG
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: "bold",
                display: "flex",
              }}
            >
              {flow} m³/s
            </div>
          </div>

          {/* One-liner headline (≤40 chars) */}
          <div
            style={{
              color: "#cbd5e1",
              fontSize: 9,
              textAlign: "center",
              display: "flex",
              maxWidth: 210,
            }}
          >
            {headline}
          </div>
        </div>
      ),
      {
        width: SIZE,
        height: SIZE,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=1800",
        },
      }
    );
  } catch (error) {
    console.error("Error generating SmallTV image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
