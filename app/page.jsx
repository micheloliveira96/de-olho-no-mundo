"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

const sections = ["Visão geral", "Câmbio", "Criptomoedas", "Mercados", "Favoritos"];
const pairs = [
  { symbol: "EUR/USD", label: "EUR / USD", detail: "USD por EUR", icon: "€$", tone: "blue" },
  { symbol: "EUR/BRL", label: "EUR / BRL", detail: "BRL por EUR", icon: "€R$", tone: "green" },
  { symbol: "USD/BRL", label: "USD / BRL", detail: "BRL por USD", icon: "$R$", tone: "orange" }
];
const assets = [
  {name:"Bitcoin",symbol:"BTC",type:"Cripto",icon:"₿",tone:"purple"},
  {name:"Ethereum",symbol:"ETH",type:"Cripto",icon:"◆",tone:"blue"},
  {name:"Solana",symbol:"SOL",type:"Cripto",icon:"≋",tone:"green"},
  {name:"S&P 500",symbol:"SPX",type:"Índice",icon:"S",tone:"orange"}
];
const money = (n) => new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

export default function Home() {
  const [active,setActive] = useState("Visão geral");
  const [period,setPeriod] = useState("1M");
  const [selected,setSelected] = useState("EUR/BRL");
  const [search,setSearch] = useState("");
  const [rates,setRates] = useState({});
  const [history,setHistory] = useState({});
  const [error,setError] = useState("");
  const [lastUpdated,setLastUpdated] = useState(null);
  const [loading,setLoading] = useState(true);
  const filtered = useMemo(() => assets.filter(a => (a.name+" "+a.symbol).toLowerCase().includes(search.toLowerCase())),[search]);

  const loadRates = useCallback(async () => {
    try {
      const results = await Promise.all(pairs.map(async p => {
        const res = await fetch("/api/forex?symbol=" + encodeURIComponent(p.symbol), { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Não foi possível carregar as cotações.");
        return [p.symbol, data.rate];
      }));
      setRates(Object.fromEntries(results));
      setError("");
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Não foi possível carregar as cotações.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadRates();
    const timer = setInterval(loadRates, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadRates]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const res = await fetch("/api/forex?symbol=" + encodeURIComponent(selected) + "&history=true", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Histórico indisponível.");
        if (!cancelled) setHistory(prev => ({ ...prev, [selected]: data.values || [] }));
      } catch (e) {
        if (!cancelled) setError(e.message || "Não foi possível carregar o histórico.");
      }
    }
    loadHistory();
    return () => { cancelled = true; };
  }, [selected]);

  const chartValues = history[selected] || [];
  const chartPath = useMemo(() => {
    if (chartValues.length < 2) return "";
    const values = chartValues.map(x => x.rate);
    const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    return values.map((v,i) => `${i === 0 ? "M" : "L"}${(i/(values.length-1))*650} ${160-((v-min)/span)*130}`).join(" ");
  }, [chartValues]);

  return <main className="layout">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brandIcon">◉</span><span><b>de olho</b><small>NO MUNDO</small></span></a>
      <p className="label">MENU PRINCIPAL</p>
      <nav>{sections.map((s,i)=><button key={s} className={active===s?"nav active":"nav"} onClick={()=>setActive(s)}><span>{["◫","⇄","₿","▥","☆"][i]}</span>{s}</button>)}</nav>
      <div className="sideNote"><i/> <div><b>Centro de controlo</b><small>{lastUpdated ? "Cotações atualizadas" : "A ligar aos mercados"}</small></div></div>
      <div className="profile"><div className="avatar">DM</div><div><b>Meu painel</b><small>Conta pessoal</small></div></div>
    </aside>
    <section className="main">
      <header className="topbar"><span>Painel <b>/</b> {active}</span><span className="live"><i/> {lastUpdated ? "Atualização automática ativa" : "A ligar à fonte de dados"}</span></header>
      <div className="page">
        <div className="welcome"><div><p className="eyebrow">● O TEU RADAR FINANCEIRO</p><h1>De olho no <em>mundo.</em></h1><p className="subtitle">Câmbio, cripto e mercados financeiros — tudo num só lugar.</p></div><span className="tag">CÂMBIO · DADOS DE MERCADO</span></div>
        <div className="notice"><span>i</span><div><b>{error ? "A fonte de dados precisa de configuração" : "Cotações cambiais"}</b><p>{error || "Dólar e euro em reais, com atualização automática a cada 10 minutos e histórico diário para o gráfico."}{lastUpdated && !error ? " Última consulta: " + lastUpdated.toLocaleTimeString("pt-PT") + "." : ""}</p></div></div>
        <div className="sectionTitle"><div><h2>Mercado em resumo</h2><p>Taxas de câmbio atuais da fonte selecionada.</p></div><button className="textButton" onClick={()=>setActive("Mercados")}>Explorar mercados ↗</button></div>
        <div className="stats">
          {pairs.map(p=><article className="stat" key={p.symbol}><div className="statHead"><span>{p.label}</span><span className={"coin "+p.tone}>{p.icon}</span></div><div className="value">{rates[p.symbol] ? money(rates[p.symbol]) : "—"} <small>{p.detail}</small></div><span className="pending">{rates[p.symbol] ? "Fonte: Twelve Data" : loading ? "A carregar…" : "Sem cotação"}</span></article>)}
          <article className="stat dark"><div className="statHead"><span>Mercado cripto</span><span className="coin dark">₿</span></div><div className="value">— <small>capitalização global</small></div><span className="pending">Fonte cripto por ligar</span></article>
        </div>
        <div className="columns">
          <article className="panel"><div className="panelHead"><div><h3>Histórico cambial</h3><p>Últimos dados diários disponíveis</p></div><select aria-label="Indicador" value={selected} onChange={e=>setSelected(e.target.value)}>{pairs.map(p=><option key={p.symbol}>{p.symbol}</option>)}</select></div>
            <div className="chart"><div className="gridLines"><i/><i/><i/><i/></div><svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label="Histórico cambial"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9282f4" stopOpacity=".25"/><stop offset="100%" stopColor="#9282f4" stopOpacity="0"/></linearGradient></defs>{chartPath && <><path d={chartPath+" L650 180 L0 180Z"} fill="url(#fill)"/><path d={chartPath} fill="none" stroke="#8b7aff" strokeWidth="3"/></>}</svg>{chartValues.length < 2 && <div className="chartMessage">{error || "A carregar histórico…"}<br/><b>O gráfico aparece quando a API estiver configurada</b></div>}</div>
            <div className="chartFooter"><span>{chartValues.length ? `${chartValues.length} observações · ${chartValues[0]?.date} a ${chartValues[chartValues.length-1]?.date}` : "Histórico diário"}</span><div className="period">{["1D","1S","1M","3M","1A"].map(p=><button key={p} className={period===p?"chosen":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
          </article>
          <article className="panel watch"><div className="panelHead"><div><h3>Lista de acompanhamento</h3><p>Ativos que importam para ti</p></div><button className="add" onClick={()=>setActive("Favoritos")} aria-label="Adicionar favorito">＋</button></div><input className="search" placeholder="Pesquisar ativos..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="assetList">{filtered.map(a=><div className="asset" key={a.symbol}><span className={"assetIcon "+a.tone}>{a.icon}</span><div><b>{a.name}</b><small>{a.symbol}</small></div><div className="assetValue"><b>—</b><small>Fonte por ligar</small></div></div>)}{filtered.length===0&&<p className="empty">Nenhum ativo encontrado.</p>}</div><button className="viewAll" onClick={()=>setActive("Criptomoedas")}>Ver todos os ativos →</button></article>
        </div>
        <div className="sectionTitle lower"><div><h2>O que queres acompanhar?</h2><p>Escolhe uma área para a próxima fase.</p></div></div>
        <div className="quick">{[["⇄","Taxas de câmbio","Euro, dólar e real","Câmbio"],["₿","Criptomoedas","BTC, ETH, SOL e mais","Criptomoedas"],["▥","Mercados globais","Índices, ações e notícias","Mercados"]].map(x=><button key={x[1]} onClick={()=>setActive(x[3])}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div>↗</button>)}</div>
        <footer>DE OLHO NO MUNDO · Cotações indicativas, não aconselhamento financeiro. Fonte cambial: Twelve Data.</footer>
      </div>
    </section>
  </main>;
}
