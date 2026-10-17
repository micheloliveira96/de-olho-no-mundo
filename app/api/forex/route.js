import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE = "https://api.twelvedata.com";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "USD/BRL";
  const allowed = new Set(["USD/BRL", "EUR/BRL", "EUR/USD"]);
  if (!allowed.has(symbol)) {
    return NextResponse.json({ error: "Par de moedas não permitido." }, { status: 400 });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar TWELVE_DATA_API_KEY nas variáveis de ambiente da Vercel." },
      { status: 503 }
    );
  }

  try {
    const history = searchParams.get("history") === "true";
    const requestedPeriod = searchParams.get("period") || "1M";
    const periodSizes = { "1D": "2", "1S": "7", "1M": "30", "3M": "90", "1A": "365" };
    const outputsize = history ? (periodSizes[requestedPeriod] || periodSizes["1M"]) : "1";
    const params = new URLSearchParams({
      symbol,
      interval: "1day",
      outputsize,
      apikey: apiKey,
      format: "JSON"
    });
    const response = await fetch(`${API_BASE}/time_series?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    const data = await response.json();

    if (!response.ok || data.status === "error" || data.code || !Array.isArray(data.values)) {
      const message = data.message || "A Twelve Data não conseguiu fornecer esta cotação.";
      throw new Error(message);
    }

    const values = data.values
      .map((item) => ({ date: item.datetime, rate: Number(item.close) }))
      .filter((item) => Number.isFinite(item.rate))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!values.length) throw new Error("A Twelve Data não devolveu valores para este par.");

    if (history) {
      return NextResponse.json({
        symbol,
        values,
        source: "Twelve Data",
        rateDate: values.at(-1).date,
        updatedAt: new Date().toISOString(),
        updateFrequency: "conforme disponibilidade e plano da Twelve Data"
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const latest = values.at(-1);
    return NextResponse.json({
      symbol,
      rate: latest.rate,
      rateDate: latest.date,
      source: "Twelve Data",
      updatedAt: new Date().toISOString(),
      updateFrequency: "conforme disponibilidade e plano da Twelve Data"
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Não foi possível consultar as cotações neste momento." },
      { status: 502 }
    );
  }
}
