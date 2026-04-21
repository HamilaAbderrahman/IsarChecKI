// To push to SmallTV: POST the image binary to http://<device-ip>/upload
// or schedule in n8n: HTTP Request node → GET this endpoint →
// HTTP Request node → POST to SmallTV local IP as multipart/form-data

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import sharp from "sharp";
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

// Render at 2× then Lanczos-downscale to 240×240 — crisp antialiasing on all text and icons
const OUT = 240;
const SCALE = 2;
const R = OUT * SCALE; // 480 — render canvas size

const VERDICT_MAP = {
  sicher:   { label: "PASST",    color: "#22c55e", icon: "check" as const },
  vorsicht: { label: "VORSICHT", color: "#f59e0b", icon: "warn"  as const },
  meiden:   { label: "STOPP",    color: "#ef4444", icon: "cross" as const },
};

// Geometric SVG icons — render sharper than emoji at small display sizes
function Icon({ kind, color, size }: { kind: "check" | "warn" | "cross"; color: string; size: number }) {
  if (kind === "check") return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "flex" }}>
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d="M6.5 12.5l3.5 3.5 7.5-7.5"
        stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
  if (kind === "warn") return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "flex" }}>
      <polygon points="12,2.5 22.5,21.5 1.5,21.5" fill={color} />
      <rect x="11" y="8.5" width="2" height="6.5" rx="1" fill="white" />
      <circle cx="12" cy="18.5" r="1.2" fill="white" />
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "flex" }}>
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d="M8 8l8 8M16 8l-8 8"
        stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

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
    const temp  = Math.round(data.temperature.temperatur);
    const level = Math.round(data.water.wasserstand);
    const flow  = Math.round(data.water.abfluss);
    const headline = verdict.headline.length > 40
      ? verdict.headline.slice(0, 40) + "…"
      : verdict.headline;

    const png = await new ImageResponse(
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
            padding: `${14 * SCALE}px ${10 * SCALE}px`,
          }}
        >
          {/* Header label */}
          <div style={{ color: "#475569", fontSize: 10 * SCALE, letterSpacing: 2 * SCALE, display: "flex" }}>
            ISAR CHECK
          </div>

          {/* Verdict icon */}
          <Icon kind={v.icon} color={v.color} size={58 * SCALE} />

          {/* Verdict status */}
          <div
            style={{
              color: v.color,
              fontSize: 24 * SCALE,
              fontWeight: "bold",
              letterSpacing: 4 * SCALE,
              display: "flex",
            }}
          >
            {v.label}
          </div>

          {/* Water temp + level */}
          <div style={{ display: "flex", gap: 14 * SCALE, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 * SCALE }}>
              <div style={{ color: "#475569", fontSize: 9 * SCALE, letterSpacing: 1 * SCALE, display: "flex" }}>TEMP</div>
              <div style={{ color: "white",   fontSize: 15 * SCALE, fontWeight: "bold", display: "flex" }}>{temp}°C</div>
            </div>

            <div style={{ color: "#1e293b", fontSize: 18 * SCALE, display: "flex" }}>|</div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 * SCALE }}>
              <div style={{ color: "#475569", fontSize: 9 * SCALE, letterSpacing: 1 * SCALE, display: "flex" }}>PEGEL</div>
              <div style={{ color: "white",   fontSize: 15 * SCALE, fontWeight: "bold", display: "flex" }}>{level} cm</div>
            </div>
          </div>

          {/* Strömung */}
          <div style={{ display: "flex", gap: 5 * SCALE, alignItems: "center" }}>
            <div style={{ color: "#475569", fontSize: 9 * SCALE, letterSpacing: 1 * SCALE, display: "flex" }}>STRÖMUNG</div>
            <div style={{ color: "#94a3b8", fontSize: 13 * SCALE, fontWeight: "bold", display: "flex" }}>{flow} m³/s</div>
          </div>

          {/* One-liner headline */}
          <div
            style={{
              color: "#94a3b8",
              fontSize: 9 * SCALE,
              textAlign: "center",
              display: "flex",
              maxWidth: 210 * SCALE,
            }}
          >
            {headline}
          </div>
        </div>
      ),
      { width: R, height: R }
    ).arrayBuffer();

    const jpeg = await sharp(Buffer.from(png))
      .resize(OUT, OUT, { kernel: "lanczos3" })
      .jpeg({ quality: 92 })
      .toBuffer();

    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (error) {
    console.error("Error generating SmallTV image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
