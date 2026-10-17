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
    const periodSettings = { "1D": { interval: "1h", outputsize: "24" }, "1S": { interval: "1day", outputsize: "7" }, "1M": { interval: "1day", outputsize: "30" }, "3M": { interval: "1day", outputsize: "90" }, "1A": { interval: "1day", outputsize: "365" } };
    if (history && !periodSettings[requestedPeriod]) {
      return NextResponse.json({ error: "Período inválido. Usa 1D, 1S, 1M, 3M ou 1A." }, { status: 400 });
    }
    const settings = history ? periodSettings[requestedPeriod] : { interval: "1day", outputsize: "1" };
    const params = new URLSearchParams({
      symbol,
      interval: settings.interval,
      outputsize: settings.outputsize,
      apikey: apiKey,
      format: "JSON"
    });
    // Cachear a resposta da Twelve Data na cache partilhada da Next/Vercel.
    // Sem isto, o painel + calculadora + gráfico gastam créditos repetidos
    // sempre que o utilizador abre ou atualiza a página.
    const response = await fetch(`${API_BASE}/time_series?${params.toString()}`, {
      next: { revalidate: history ? 3600 : 300 },
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
      }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
    }

    const latest = values.at(-1);
    return NextResponse.json({
      symbol,
      rate: latest.rate,
      rateDate: latest.date,
      source: "Twelve Data",
      updatedAt: new Date().toISOString(),
      updateFrequency: "conforme disponibilidade e plano da Twelve Data"
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Não foi possível consultar as cotações neste momento." },
      { status: 502 }
    );
  }
}
