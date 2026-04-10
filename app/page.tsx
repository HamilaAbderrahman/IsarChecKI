"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import VerdictHero from "@/components/VerdictHero";
import DataCards from "@/components/DataCards";
import SpotsList from "@/components/SpotsList";
import AIBriefing from "@/components/AIBriefing";
import AlertBanner from "@/components/AlertBanner";
import WeekForecast from "@/components/WeekForecast";
import EisbachCard from "@/components/EisbachCard";
import AirQualityCard from "@/components/AirQualityCard";
import Footer from "@/components/Footer";
import { useIsarData, useVerdict } from "@/hooks/useIsarData";

export default function Home() {
  // Fast path: isar-data has no AI call — loads in ~500 ms
  const { data: isarData, isLoading: isarLoading } = useIsarData();

  // Slow path: verdict waits for Gemini — loads in 2–5 s
  const { verdict, isLoading: verdictLoading } = useVerdict();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bayern-cream)" }}
    >
      <Navbar />

      {/* Hero — shows partial content instantly, verdict badge when AI ready */}
      <HeroSection verdict={verdict} isLoading={verdictLoading} />

      <main className="flex-1 max-w-2xl mx-auto w-full pb-8">
        {/* Alert banner — only needs isar data, no AI */}
        <div className="mt-4">
          <AlertBanner data={isarData} />
        </div>

       {/* AI briefing — skeleton until Gemini responds */}
        <div className="mt-6">
          <AIBriefing verdict={verdict} isLoading={verdictLoading} />
        </div>

        {/* AI verdict card — skeleton until Gemini responds */}
        <VerdictHero verdict={verdict} isLoading={verdictLoading} />

        {/* Data grid — loads as soon as /api/isar-data responds */}
        <div className="mt-4">
          <DataCards data={isarData} isLoading={isarLoading} />
        </div>

        {/* Eisbach — loads with isar data, no AI needed */}
        <div className="mt-6">
          <EisbachCard data={isarData} isLoading={isarLoading} />
        </div>

        {/* Spots — shows chips immediately; AI recommendation fills in later */}
        <div className="mt-6">
          <SpotsList verdict={verdict} isarData={isarData} />
        </div>

        {/* Air quality & pollen — loads with isar data */}
        <div className="mt-6">
          <AirQualityCard data={isarData} isLoading={isarLoading} />
        </div>

        {/* 7-day forecast — loads with isar data */}
        <div className="mt-6">
          <WeekForecast data={isarData} isLoading={isarLoading} />
        </div>

        <div className="px-4 mt-6">
          <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
            Daten aktualisieren sich alle 10 Minuten automatisch.
            <br />
            Quelle: HND Bayern · GKD Bayern · Open-Meteo · DWD · Copernicus CAMS · Google Gemini
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
