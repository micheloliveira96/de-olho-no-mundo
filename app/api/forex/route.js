import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE = "https://api.twelvedata.com";

export async function GET(request) {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "A fonte de câmbio ainda não está configurada. Adiciona TWELVE_DATA_API_KEY nas variáveis de ambiente da Vercel." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "USD/BRL";
  const allowed = new Set(["USD/BRL", "EUR/BRL", "EUR/USD"]);
  if (!allowed.has(symbol)) {
    return NextResponse.json({ error: "Par de moedas não permitido." }, { status: 400 });
  }

  try {
    const history = searchParams.get("history") === "true";
    const endpoint = history ? "/time_series" : "/exchange_rate";
    const params = new URLSearchParams({
      symbol,
      apikey: key,
      ...(history ? { interval: "1day", outputsize: "30", order: "ASC" } : {})
    });
    const response = await fetch(`${API_BASE}${endpoint}?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    const data = await response.json();
    if (!response.ok || data.status === "error" || data.code) {
      return NextResponse.json(
        { error: data.message || data.status || "A fonte de câmbio não respondeu corretamente." },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    if (history) {
      const values = (data.values || []).map((item) => ({
        date: item.datetime,
        rate: Number(item.close)
      })).filter((item) => Number.isFinite(item.rate));
      return NextResponse.json({
        symbol,
        values,
        source: "Twelve Data",
        updatedAt: new Date().toISOString()
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const rate = Number(data.rate);
    if (!Number.isFinite(rate)) {
      return NextResponse.json({ error: "A fonte não devolveu uma cotação válida." }, { status: 502 });
    }
    return NextResponse.json({
      symbol,
      rate,
      source: "Twelve Data",
      updatedAt: new Date().toISOString()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível contactar a fonte de câmbio neste momento." }, { status: 502 });
  }
}
