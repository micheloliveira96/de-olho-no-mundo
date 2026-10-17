import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const API_BASE = "https://api.frankfurter.dev/v2";

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("A fonte gratuita de câmbio não respondeu.");
  return response.json();
}

function mapRates(rows) {
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, {});
    byDate.get(row.date)[row.quote] = Number(row.rate);
  }
  return byDate;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "USD/BRL";
  const allowed = new Set(["USD/BRL", "EUR/BRL", "EUR/USD"]);
  if (!allowed.has(symbol)) {
    return NextResponse.json({ error: "Par de moedas não permitido." }, { status: 400 });
  }

  try {
    const history = searchParams.get("history") === "true";
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 45);
    const from = start.toISOString().slice(0, 10);
    const url = history
      ? `${API_BASE}/rates?from=${from}&quotes=USD,BRL`
      : `${API_BASE}/rates?quotes=USD,BRL`;
    const rows = await fetchJson(url);
    const byDate = mapRates(rows);
    const values = [...byDate.entries()]
      .map(([date, rates]) => {
        let rate;
        if (symbol === "EUR/BRL") rate = rates.BRL;
        else if (symbol === "EUR/USD") rate = rates.USD;
        else if (rates.BRL && rates.USD) rate = rates.BRL / rates.USD;
        return { date, rate };
      })
      .filter((item) => Number.isFinite(item.rate))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (history) {
      return NextResponse.json({
        symbol,
        values,
        source: "Frankfurter (taxas de referência de bancos centrais)",
        updatedAt: new Date().toISOString(),
        updateFrequency: "dias úteis"
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const latest = values.at(-1);
    if (!latest) throw new Error("Ainda não há uma cotação disponível para este par.");
    return NextResponse.json({
      symbol,
      rate: latest.rate,
      rateDate: latest.date,
      source: "Frankfurter (taxas de referência de bancos centrais)",
      updatedAt: new Date().toISOString(),
      updateFrequency: "dias úteis"
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Não foi possível consultar as cotações neste momento." },
      { status: 502 }
    );
  }
}
