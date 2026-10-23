import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const locations = [
  { key: "cacia", latitude: 40.684, longitude: -8.597, timezone: "Europe/Lisbon" },
  { key: "recife", latitude: -8.0543, longitude: -34.8813, timezone: "America/Recife" },
];
export async function GET() {
  try {
    const results = await Promise.all(locations.map(async ({key,latitude,longitude,timezone}) => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:"temperature_2m",timezone}).toString();
      const response = await fetch(url, {next:{revalidate:300}});
      if (!response.ok) throw new Error("Weather provider unavailable");
      const payload = await response.json();
      const temperature = payload.current?.temperature_2m;
      if (!Number.isFinite(temperature)) throw new Error("Invalid temperature");
      return [key,{temperature,observedAt:payload.current.time,unit:"°C"}];
    }));
    return NextResponse.json({locations:Object.fromEntries(results),source:"Open-Meteo"},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=60"}});
  } catch {
    return NextResponse.json({error:"Temperaturas temporariamente indisponíveis."},{status:503});
  }
}
