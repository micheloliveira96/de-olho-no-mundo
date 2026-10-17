"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const currencies = [
  { code: "EUR", name: "Euro", flag: "🇪🇺", locale: "pt-PT" },
  { code: "BRL", name: "Real brasileiro", flag: "🇧🇷", locale: "pt-BR" },
  { code: "USD", name: "Dólar americano", flag: "🇺🇸", locale: "en-US" }
];
const pairs = ["EUR/USD", "EUR/BRL", "USD/BRL"];

function formatMoney(value, currency) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState("10");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("BRL");
  const [rates, setRates] = useState({});
  const [rateDates, setRateDates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRates = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.all(pairs.map(async (symbol) => {
      try {
        const response = await fetch("/api/forex?symbol=" + encodeURIComponent(symbol), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Cotação indisponível.");
        return { symbol, rate: Number(data.rate), date: data.rateDate };
      } catch (err) {
        return { symbol, error: err.message || "Não foi possível carregar a cotação." };
      }
    }));
    const valid = results.filter(item => Number.isFinite(item.rate) && item.rate > 0);
    setRates(Object.fromEntries(valid.map(item => [item.symbol, item.rate])));
    setRateDates(Object.fromEntries(valid.map(item => [item.symbol, item.date])));
    if (valid.length !== pairs.length) {
      setError("Algumas cotações não estão disponíveis. Tenta atualizar novamente.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadRates(); }, [loadRates]);

  const exchangeRate = useMemo(() => {
    if (from === to) return 1;
    const direct = rates[from + "/" + to];
    if (Number.isFinite(direct)) return direct;
    const inverse = rates[to + "/" + from];
    if (Number.isFinite(inverse) && inverse > 0) return 1 / inverse;
    const perEuro = { EUR: 1, USD: rates["EUR/USD"], BRL: rates["EUR/BRL"] };
    if (from === "USD" && to === "BRL" && Number.isFinite(rates["USD/BRL"])) return rates["USD/BRL"];
    if (from === "BRL" && to === "USD" && Number.isFinite(rates["USD/BRL"])) return 1 / rates["USD/BRL"];
    if (Number.isFinite(perEuro[from]) && Number.isFinite(perEuro[to]) && perEuro[from] > 0) {
      return perEuro[to] / perEuro[from];
    }
    return null;
  }, [from, to, rates]);

  const numericAmount = amount.trim() === "" ? NaN : Number(amount.replace(",", "."));
  const result = Number.isFinite(numericAmount) && numericAmount >= 0 && Number.isFinite(exchangeRate)
    ? numericAmount * exchangeRate
    : null;
  const sourceDate = rateDates[from + "/" + to] || rateDates[to + "/" + from] || rateDates["EUR/" + to] || rateDates["EUR/" + from];
  const fromCurrency = currencies.find(currency => currency.code === from);
  const toCurrency = currencies.find(currency => currency.code === to);

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
  }

  return (
    <main className="converterPage">
      <header className="converterTopbar">
        <a className="brand converterBrand" href="/" aria-label="De Olho no Mundo, página inicial">
          <span className="brandIcon">◉</span>
          <span><b>DE OLHO</b><small>NO MUNDO</small></span>
        </a>
        <a className="converterBack" href="/">← Voltar ao painel</a>
      </header>

      <div className="converterContent">
        <div className="converterIntro">
          <p className="eyebrow"><span className="pulse" /> CONVERSOR DE MOEDAS</p>
          <h1>O teu dinheiro,<br /><em>em qualquer moeda.</em></h1>
          <p className="subtitle">Escolhe a moeda de envio, a moeda de destino e o valor. Calculamos a conversão com base nas cotações disponíveis.</p>
        </div>

        <section className="panel converterCard" aria-labelledby="converter-heading">
          <div className="panelHead converterCardHead">
            <div><h3 id="converter-heading">Calculadora de câmbio</h3><p>Conversão indicativa com cotações da Twelve Data</p></div>
            <span className="converterBadge">⇄ Câmbio</span>
          </div>

          <label className="converterField">
            <span>Valor a enviar</span>
            <div className="amountInputWrap">
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                aria-label="Valor a converter"
                placeholder="Introduz um valor"
              />
              <strong>{from}</strong>
            </div>
          </label>

          <div className="currencySwapRow">
            <label className="converterField">
              <span>Moeda de envio</span>
              <select value={from} onChange={event => setFrom(event.target.value)} aria-label="Moeda de envio">
                {currencies.map(currency => <option key={currency.code} value={currency.code}>{currency.flag} {currency.code} — {currency.name}</option>)}
              </select>
            </label>
            <button className="swapButton" type="button" onClick={swapCurrencies} aria-label="Trocar moedas" title="Trocar moedas">⇅</button>
            <label className="converterField">
              <span>Moeda que recebe</span>
              <select value={to} onChange={event => setTo(event.target.value)} aria-label="Moeda de destino">
                {currencies.map(currency => <option key={currency.code} value={currency.code}>{currency.flag} {currency.code} — {currency.name}</option>)}
              </select>
            </label>
          </div>

          <div className="conversionResult" aria-live="polite">
            <span className="resultLabel">Valor estimado a receber</span>
            <strong>{result === null ? "—" : formatMoney(result, to)}</strong>
            <span className="resultEquation">{Number.isFinite(numericAmount) && numericAmount >= 0 ? formatMoney(numericAmount, from) : "Valor inválido"} <span>→</span> {toCurrency?.flag} {toCurrency?.code}</span>
          </div>

          {loading && <p className="converterStatus">A obter cotações atuais…</p>}
          {error && <p className="converterError" role="status">{error}</p>}
          {!loading && Number.isFinite(exchangeRate) && <p className="rateInfo">1 {from} = {new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 6 }).format(exchangeRate)} {to}{sourceDate ? " · Cotação de " + sourceDate : ""}</p>}
          <button className="primaryButton converterRefresh" type="button" onClick={loadRates} disabled={loading}>{loading ? "A atualizar…" : "↻ Atualizar cotações"}</button>
          <p className="converterDisclaimer">Valor indicativo, sem incluir comissões, margens de bancos ou serviços de transferência. A taxa final aplicada pode ser diferente.</p>
        </section>

        <section className="converterExamples">
          <h2>Conversões rápidas</h2>
          <div className="converterQuickLinks">
            <button type="button" onClick={() => { setAmount("10"); setFrom("EUR"); setTo("BRL"); }}>🇪🇺 <span><b>10 euros em reais</b><small>EUR → BRL</small></span><strong>↗</strong></button>
            <button type="button" onClick={() => { setAmount("100"); setFrom("BRL"); setTo("EUR"); }}>🇧🇷 <span><b>100 reais em euros</b><small>BRL → EUR</small></span><strong>↗</strong></button>
            <button type="button" onClick={() => { setAmount("50"); setFrom("EUR"); setTo("USD"); }}>🇺🇸 <span><b>50 euros em dólares</b><small>EUR → USD</small></span><strong>↗</strong></button>
          </div>
        </section>
        <footer>DE OLHO NO MUNDO · Cotações indicativas, não aconselhamento financeiro.</footer>
      </div>
    </main>
  );
}
