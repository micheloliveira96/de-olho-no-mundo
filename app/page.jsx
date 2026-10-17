"use client";
import { useMemo, useState } from "react";

const sections = ["Visão geral", "Câmbio", "Criptomoedas", "Mercados", "Favoritos"];
const assets = [
  {name:"Bitcoin",symbol:"BTC",type:"Cripto",icon:"₿",tone:"purple"},
  {name:"Ethereum",symbol:"ETH",type:"Cripto",icon:"◆",tone:"blue"},
  {name:"Solana",symbol:"SOL",type:"Cripto",icon:"≋",tone:"green"},
  {name:"S&P 500",symbol:"SPX",type:"Índice",icon:"S",tone:"orange"}
];

export default function Home() {
  const [active,setActive] = useState("Visão geral");
  const [period,setPeriod] = useState("1S");
  const [search,setSearch] = useState("");
  const filtered = useMemo(() => assets.filter(a => (a.name+" "+a.symbol).toLowerCase().includes(search.toLowerCase())),[search]);
  return <main className="layout">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brandIcon">◉</span><span><b>de olho</b><small>NO MUNDO</small></span></a>
      <p className="label">MENU PRINCIPAL</p>
      <nav>{sections.map((s,i)=><button key={s} className={active===s?"nav active":"nav"} onClick={()=>setActive(s)}><span>{["◫","⇄","₿","▥","☆"][i]}</span>{s}</button>)}</nav>
      <div className="sideNote"><i/> <div><b>Centro de controlo</b><small>Configuração inicial</small></div></div>
      <div className="profile"><div className="avatar">DM</div><div><b>Meu painel</b><small>Conta pessoal</small></div></div>
    </aside>
    <section className="main">
      <header className="topbar"><span>Painel <b>/</b> {active}</span><span className="live"><i/> Painel de acompanhamento</span></header>
      <div className="page">
        <div className="welcome"><div><p className="eyebrow">● O TEU RADAR FINANCEIRO</p><h1>De olho no <em>mundo.</em></h1><p className="subtitle">Câmbio, cripto e mercados financeiros — tudo num só lugar.</p></div><span className="tag">FASE 1 · INTERFACE</span></div>
        <div className="notice"><span>i</span><div><b>O painel está pronto para personalizar</b><p>As cotações reais ainda não estão ligadas. Os valores serão apresentados quando configurarmos uma fonte de dados de mercado.</p></div></div>
        <div className="sectionTitle"><div><h2>Mercado em resumo</h2><p>Os indicadores que queres acompanhar.</p></div><button className="textButton" onClick={()=>setActive("Mercados")}>Explorar mercados ↗</button></div>
        <div className="stats">
          {[["EUR / USD","—","USD por EUR","€$","blue"],["EUR / BRL","—","BRL por EUR","€R$","green"],["USD / BRL","—","BRL por USD","$R$","orange"],["Mercado cripto","—","capitalização global","₿","dark"]].map(c=><article className={"stat "+(c[4]==="dark"?"dark":"")} key={c[0]}><div className="statHead"><span>{c[0]}</span><span className={"coin "+c[4]}>{c[3]}</span></div><div className="value">{c[1]} <small>{c[2]}</small></div><span className="pending">A aguardar cotação</span></article>)}
        </div>
        <div className="columns">
          <article className="panel"><div className="panelHead"><div><h3>Visão dos mercados</h3><p>Evolução do indicador selecionado</p></div><select aria-label="Indicador"><option>EUR/USD</option><option>EUR/BRL</option><option>USD/BRL</option><option>Bitcoin</option></select></div>
            <div className="chart"><div className="gridLines"><i/><i/><i/><i/></div><svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label="Gráfico ilustrativo"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9282f4" stopOpacity=".25"/><stop offset="100%" stopColor="#9282f4" stopOpacity="0"/></linearGradient></defs><path d="M0 130 C40 105 55 142 95 100 S150 120 190 75 S240 105 285 67 S340 92 385 48 S440 90 485 54 S545 75 585 30 S620 45 650 20 L650 180 L0 180Z" fill="url(#fill)"/><path d="M0 130 C40 105 55 142 95 100 S150 120 190 75 S240 105 285 67 S340 92 385 48 S440 90 485 54 S545 75 585 30 S620 45 650 20" fill="none" stroke="#8b7aff" strokeWidth="3" strokeDasharray="7 6"/></svg><div className="chartMessage">Pré-visualização<br/><b>Dados reais serão ligados na próxima etapa</b></div></div>
            <div className="chartFooter"><span>● Exemplo visual — não representa preços reais</span><div className="period">{["1D","1S","1M","3M","1A"].map(p=><button key={p} className={period===p?"chosen":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
          </article>
          <article className="panel watch"><div className="panelHead"><div><h3>Lista de acompanhamento</h3><p>Ativos que importam para ti</p></div><button className="add" onClick={()=>setActive("Favoritos")} aria-label="Adicionar favorito">＋</button></div><input className="search" placeholder="Pesquisar ativos..." value={search} onChange={e=>setSearch(e.target.value)}/><div className="assetList">{filtered.map(a=><div className="asset" key={a.symbol}><span className={"assetIcon "+a.tone}>{a.icon}</span><div><b>{a.name}</b><small>{a.symbol}</small></div><div className="assetValue"><b>—</b><small>A aguardar dados</small></div></div>)}{filtered.length===0&&<p className="empty">Nenhum ativo encontrado.</p>}</div><button className="viewAll" onClick={()=>setActive("Criptomoedas")}>Ver todos os ativos →</button></article>
        </div>
        <div className="sectionTitle lower"><div><h2>O que queres acompanhar?</h2><p>Escolhe uma área para a próxima fase.</p></div></div>
        <div className="quick">{[["⇄","Taxas de câmbio","Euro, dólar e real","Câmbio"],["₿","Criptomoedas","BTC, ETH, SOL e mais","Criptomoedas"],["▥","Mercados globais","Índices, ações e notícias","Mercados"]].map(x=><button key={x[1]} onClick={()=>setActive(x[3])}><span>{x[0]}</span><div><b>{x[1]}</b><small>{x[2]}</small></div>↗</button>)}</div>
        <footer>DE OLHO NO MUNDO · Informação para acompanhar, não aconselhamento financeiro.</footer>
      </div>
    </section>
  </main>;
}
