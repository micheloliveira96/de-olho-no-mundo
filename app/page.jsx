"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

const sections = ["Visão geral", "Câmbio", "Criptomoedas", "Mercados", "Favoritos"];
const pairs = [
  { symbol: "EUR/USD", label: "EURO", detail: "EUR / USD", icon: "€", tone: "blue" },
  { symbol: "EUR/BRL", label: "EURO", detail: "EUR / BRL", icon: "€", tone: "green" },
  { symbol: "USD/BRL", label: "DÓLAR", detail: "USD / BRL", icon: "$", tone: "orange" }
];
const assets = [
  {name:"Bitcoin",symbol:"BTC",type:"Cripto",icon:"₿",tone:"purple",id:"bitcoin"},
  {name:"Ethereum",symbol:"ETH",type:"Cripto",icon:"◆",tone:"blue",id:"ethereum"},
  {name:"Solana",symbol:"SOL",type:"Cripto",icon:"≋",tone:"green",id:"solana"},
  {name:"BNB",symbol:"BNB",type:"Cripto",icon:"◆",tone:"orange",id:"binancecoin"},
  {name:"XRP",symbol:"XRP",type:"Cripto",icon:"✕",tone:"blue",id:"ripple"},
  {name:"Dogecoin",symbol:"DOGE",type:"Cripto",icon:"Ð",tone:"orange",id:"dogecoin"},
  {name:"S&P 500",symbol:"SPX",type:"Índice",icon:"S",tone:"orange"}
];
const money = (n) => new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
const usd = (n) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:n < 1 ? 6 : 2 }).format(n);
const clocks = [
  { city: "Brasília", zone: "America/Sao_Paulo", flag: "🇧🇷" },
  { city: "Portugal", zone: "Europe/Lisbon", flag: "🇵🇹" },
  { city: "Estados Unidos", zone: "America/New_York", flag: "🇺🇸" }
];

export default function Home() {
  const [active,setActive] = useState("Visão geral");
  const [period,setPeriod] = useState("1M");
  const [selected,setSelected] = useState("EUR/BRL");
  const [search,setSearch] = useState("");
  const [rates,setRates] = useState({});
  const [history,setHistory] = useState({});
  const [crypto,setCrypto] = useState([]);
  const [cryptoUpdated,setCryptoUpdated] = useState(null);
  const [cryptoError,setCryptoError] = useState("");
  const [cryptoLoading,setCryptoLoading] = useState(true);
  const [error,setError] = useState("");
  const [lastUpdated,setLastUpdated] = useState(null);
  const [loading,setLoading] = useState(true);
  const [clockNow,setClockNow] = useState(new Date());
  const filtered = useMemo(() => assets.filter(a => (a.name+" "+a.symbol).toLowerCase().includes(search.toLowerCase())),[search]);
  const cryptoById = useMemo(() => Object.fromEntries(crypto.map(c => [c.id,c])),[crypto]);

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

  const loadCrypto = useCallback(async () => {
    try {
      const res = await fetch("/api/crypto", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar as criptomoedas.");
      setCrypto(data.coins || []);
      setCryptoUpdated(data.updatedAt ? new Date(data.updatedAt) : new Date());
      setCryptoError("");
    } catch (e) {
      setCryptoError(e.message || "Não foi possível carregar as criptomoedas.");
    } finally { setCryptoLoading(false); }
  }, []);

  useEffect(() => {
    loadRates();
    const timer = setInterval(loadRates, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadRates]);

  useEffect(() => {
    loadCrypto();
    const timer = setInterval(loadCrypto, 60 * 1000);
    return () => clearInterval(timer);
  }, [loadCrypto]);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      <a className="brand" href="#"><span className="brandIcon">◉</span><span><b>DE OLHO</b><small>NO MUNDO</small></span></a>
      <p className="label">MENU PRINCIPAL</p>
      <nav>{sections.map((s,i)=><button key={s} className={active===s?"nav active":"nav"} onClick={()=>setActive(s)}><span>{["⌂","⇄","₿","▥","☆"][i]}</span>{s}</button>)}</nav>
      <div className="sideNote"><i/> <div><b>Centro de controlo</b><small>{lastUpdated ? "Cotações recebidas" : "A ligar aos mercados"}</small></div></div>
      <div className="profile"><div className="avatar">DM</div><div><b>Meu painel</b><small>Conta pessoal</small></div></div>
    </aside>
    <section className="main">
      <header className="topbar">
        <span className="breadcrumb">Painel <b>/</b> {active}</span>
        <div className="worldClocks" aria-label="Horários locais">
          {clocks.map(c=><div className="clock" key={c.zone}><span className="clockFlag">{c.flag}</span><span className="clockText"><small>{c.city}</small><b>{new Intl.DateTimeFormat("pt-PT",{timeZone:c.zone,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(clockNow)}</b></span></div>)}
        </div>
      </header>
      <div className="page">
        <section className="hero">
          <div className="heroGlow" aria-hidden="true"><div className="globe"><span/></div><i className="orbit orbitOne"/><i className="orbit orbitTwo"/><i className="orbit orbitThree"/></div>
          <div className="heroCopy"><p className="eyebrow"><span className="pulse"/> O TEU RADAR FINANCEIRO</p><h1>O mundo<br/><em>nos teus olhos.</em></h1><p className="subtitle">Cotações, moedas e mercados globais.<br/>Tudo o que importa, num só lugar.</p><button className="primaryButton" onClick={()=>setActive("Mercados")}>Explorar mercados <span>↗</span></button><div className="heroBadges"><span>✦ Dados de mercado</span><span>◈ Visão global</span></div></div>
          <div className="heroTag"><span className="pulse"/> RADAR GLOBAL <small>O mundo em movimento</small></div>
        </section>

        {active === "Criptomoedas" && <section className="panel cryptoDashboard">
          <div className="panelHead cryptoHeader"><div><h3>Mercado de criptomoedas</h3><p>Preços em USD · variação nas últimas 24 horas</p></div><span className="updated">{cryptoUpdated ? "● Atualizado às "+cryptoUpdated.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) : "○ A obter dados"}</span></div>
          {cryptoError && <div className="cryptoNotice">{cryptoError}</div>}
          {cryptoLoading && crypto.length===0 ? <p className="cryptoEmpty">A carregar cotações das criptomoedas…</p> : <div className="cryptoTable"><div className="cryptoRow cryptoTableHead"><span># / Ativo</span><span>Preço (USD)</span><span>24 horas</span><span>Capitalização</span></div>
            {crypto.map((coin,index)=><div className="cryptoRow" key={coin.id}><span className="cryptoName"><b>{coin.rank || index+1}</b>{coin.image ? <img src={coin.image} alt="" /> : <i>{coin.symbol.slice(0,1)}</i>}<span><strong>{coin.name}</strong><small>{coin.symbol}</small></span></span><b>{usd(coin.price)}</b><span className={coin.change24h>=0?"gain":"loss"}>{coin.change24h>=0?"+":""}{coin.change24h.toFixed(2)}%</span><span className="marketCap">{usd(coin.marketCap)}</span></div>)}
          </div>}
          <div className="cryptoFoot">Fonte: CoinGecko · atualização automática aproximada a cada minuto. Os limites da fonte podem afetar a frequência.</div>
        </section>}

        <div className="sectionTitle"><div><h2>{active === "Criptomoedas" ? "Mercados em destaque" : "Em destaque"}</h2><p>{active === "Criptomoedas" ? "Resumo das cotações cambiais." : "Uma visão rápida dos principais pares cambiais."}</p></div><span className="updated">{lastUpdated ? "● Atualizado às "+lastUpdated.toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}) : "○ A obter dados"}</span></div>
        {error && <div className="notice"><span>!</span><div><b>Não foi possível atualizar as cotações</b><p>{error}</p></div></div>}
        <div className="stats">
          {pairs.filter(p=>p.symbol!=="EUR/USD").map(p=><article className="stat" key={p.symbol}><div className="statHead"><span>{p.label}<small className="pairLabel">{p.detail}</small></span><span className={"coin "+p.tone}>{p.icon}</span></div><div className="value">{rates[p.symbol] ? money(rates[p.symbol]) : "—"}</div><div className="statBottom"><span className="pending">{rates[p.symbol] ? "Twelve Data" : loading ? "A carregar…" : "Sem cotação"}</span><span className="sparkline" aria-hidden="true">⌁⌁⌁⌁⌁</span></div></article>)}
          <article className="stat"><div className="statHead"><span>EURO <small className="pairLabel">EUR / USD</small></span><span className="coin blue">€</span></div><div className="value">{rates["EUR/USD"] ? money(rates["EUR/USD"]) : "—"}</div><div className="statBottom"><span className="pending">{rates["EUR/USD"] ? "Twelve Data" : loading ? "A carregar…" : "Sem cotação"}</span><span className="sparkline">⌁⌁⌁⌁⌁</span></div></article>
        </div>
        <div className="columns">
          <article className="panel"><div className="panelHead"><div><h3>Movimento cambial</h3><p>Histórico diário · fonte Twelve Data</p></div><select aria-label="Indicador" value={selected} onChange={e=>setSelected(e.target.value)}>{pairs.map(p=><option key={p.symbol}>{p.symbol}</option>)}</select></div>
            <div className="chart"><div className="gridLines"><i/><i/><i/><i/></div><svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label="Histórico cambial"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#159dff" stopOpacity=".3"/><stop offset="100%" stopColor="#159dff" stopOpacity="0"/></linearGradient></defs>{chartPath && <><path d={chartPath+" L650 180 L0 180Z"} fill="url(#fill)"/><path d={chartPath} fill="none" stroke="#159dff" strokeWidth="3"/></>}</svg>{chartValues.length < 2 && <div className="chartMessage">{error || "A carregar histórico…"}<br/><b>Histórico de referência</b></div>}</div>
            <div className="chartFooter"><span>{chartValues.length ? `${chartValues.length} observações · ${chartValues[0]?.date} a ${chartValues[chartValues.length-1]?.date}` : "Histórico diário"}</span><div className="period">{["1D","1S","1M","3M","1A"].map(p=><button key={p} className={period===p?"chosen":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
          </article>
          <article className="panel watch"><div className="panelHead"><div><h3>{active === "Criptomoedas" ? "Acompanhar cripto" : "Lista de acompanhamento"}</h3><p>Ativos para acompanhar mais tarde</p></div><button className="add" onClick={()=>setActive("Favoritos")} aria-label="Adicionar favorito">＋</button></div><input className="search" placeholder="Pesquisar ativos..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="assetList">{filtered.map(a=>{const coin=cryptoById[a.id];return <div className="asset" key={a.symbol}><span className={"assetIcon "+a.tone}>{a.icon}</span><div><b>{a.name}</b><small>{a.symbol}</small></div><div className="assetValue"><b>{coin?usd(coin.price):a.type==="Cripto"?(cryptoLoading?"A carregar…":"Indisponível"):"—"}</b><small>{coin? <span className={coin.change24h>=0?"gain":"loss"}>{coin.change24h>=0?"+":""}{coin.change24h.toFixed(2)}%</span> : a.type==="Cripto"?"CoinGecko":"Fonte por ligar"}</small></div></div>})}{filtered.length===0&&<p className="empty">Nenhum ativo encontrado.</p>}</div><button className="viewAll" onClick={()=>setActive("Criptomoedas")}>Ver painel de criptomoedas →</button></article>
        </div>
        <div className="sectionTitle lower"><div><h2>Explora o mercado</h2><p>Escolhe o que queres acompanhar.</p></div></div>
        <div className="quick">{[["⇄","Câmbio","Euro, dólar e real","Câmbio"],["₿","Criptomoedas","BTC, ETH, SOL e mais","Criptomoedas"],["▥","Mercados globais","Índices e ações","Mercados"]].map(x=><button key={x[1]} onClick={()=>setActive(x[3])}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div><strong>↗</strong></button>)}</div>
        <footer>DE OLHO NO MUNDO · Cotações indicativas, não aconselhamento financeiro. Câmbio: Twelve Data · Cripto: CoinGecko.</footer>
      </div>
    </section>
  </main>;
}
