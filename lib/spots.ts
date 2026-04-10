import type { Spot } from "./types";

export const SPOTS: Spot[] = [
  {
    id: "flaucher",
    name: "Flaucher",
    description: "Münchens beliebtester Badeplatz. Flaches Wasser, viele Buchten.",
    kidFriendly: true,
    coordinates: { lat: 48.098, lng: 11.539 },
    characteristics: ["Flaches Wasser", "Kiesbänke", "Biergarten", "Grillzone"],
    mapsUrl: "https://maps.app.goo.gl/7tQsNXHfR5xJhkqp6",
  },
  {
    id: "thalkirchen",
    name: "Thalkirchen",
    description: "Schöne Strände, ruhiger als Flaucher.",
    kidFriendly: true,
    coordinates: { lat: 48.103, lng: 11.54 },
    characteristics: ["Sandstrand", "Ruhiger", "Gut erreichbar"],
    mapsUrl: "https://maps.app.goo.gl/4nWmTvhBgDvdkViv6",
  },
  {
    id: "grosshesselohe",
    name: "Großhesselohe",
    description: "Ruhiger, weniger Andrang. Ideal für Familien.",
    kidFriendly: true,
    coordinates: { lat: 48.085, lng: 11.527 },
    characteristics: ["Wenig Andrang", "Seicht", "Naturnah"],
    mapsUrl: "https://maps.app.goo.gl/1ZvPpHPy4Y5BGPKQ6",
  },
  {
    id: "maximiliansanlagen",
    name: "Maximiliansanlagen",
    description: "Im Stadtbereich. Stärkere Strömung — Vorsicht.",
    kidFriendly: false,
    coordinates: { lat: 48.138, lng: 11.601 },
    characteristics: ["Zentral", "Stärkere Strömung", "Für Geübte"],
    mapsUrl: "https://maps.app.goo.gl/y3Bj5M8D5WvMfXF48",
  },
  {
    id: "eisbach",
    name: "Eisbach",
    description: "Münchens legendäre Surf-Welle im Englischen Garten. Nur für erfahrene Surfer — kein Schwimmen.",
    kidFriendly: false,
    surfSpot: true,
    coordinates: { lat: 48.1428, lng: 11.5863 },
    characteristics: ["Surf-Welle", "Starke Strömung", "Nur Profis", "Zuschauer willkommen"],
    // Optimal Isar flow for Eisbach surfing: 50–85 m³/s
    optimalFlowMin: 50,
    optimalFlowMax: 85,
    mapsUrl: "https://maps.app.goo.gl/NW2RzqzDG8EgRDEF8",
  },
];
