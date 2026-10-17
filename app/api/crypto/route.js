import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" }
];

export async function GET() {
  try {
    const ids = COINS.map((coin) => coin.id).join(",");
    const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
    url.search = new URLSearchParams({
      vs_currency: "usd",
      ids,
      order: "market_cap_desc",
      per_page: "10",
      page: "1",
      sparkline: "false",
      price_change_percentage: "24h"
    }).toString();

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }
    });
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      const message = data?.status?.error_message || "A fonte de criptomoedas não respondeu. Tenta novamente mais tarde.";
      return NextResponse.json({ error: message }, { status: response.status || 502 });
    }

    const coins = data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      price: Number(coin.current_price),
      change24h: coin.price_change_percentage_24h == null || !Number.isFinite(Number(coin.price_change_percentage_24h)) ? null : Number(coin.price_change_percentage_24h),
      marketCap: coin.market_cap == null || !Number.isFinite(Number(coin.market_cap)) ? null : Number(coin.market_cap),
      volume24h: coin.total_volume == null || !Number.isFinite(Number(coin.total_volume)) ? null : Number(coin.total_volume),
      rank: coin.market_cap_rank == null || !Number.isFinite(Number(coin.market_cap_rank)) ? null : Number(coin.market_cap_rank)
    })).filter((coin) => Number.isFinite(coin.price));

    return NextResponse.json({
      source: "CoinGecko",
      currency: "USD",
      updatedAt: new Date().toISOString(),
      coins
    }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" }
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as criptomoedas agora." }, { status: 502 });
  }
}
