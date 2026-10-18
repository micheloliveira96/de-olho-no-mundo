"use client";

import { useMemo, useState } from "react";

function getYouTubeId(value) {
  const input = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch {}
  return null;
}

const starterMessages = [
  { role: "assistant", text: "Olá, Michel. Sou o JARVIS. Ainda estou na minha primeira versão, mas já posso ajudar com comandos simples e abrir vídeos do YouTube aqui na página." }
];

export default function JavisPage() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [videoId, setVideoId] = useState("");
  const [playerOpen, setPlayerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const videoUrl = useMemo(() => videoId ? "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0" : "", [videoId]);

  function addMessage(role, text) {
    setMessages((old) => [...old, { role, text }]);
  }

  function playVideo(value) {
    const id = getYouTubeId(value);
    if (!id) {
      addMessage("assistant", "Para já, cola um link de vídeo do YouTube ou o ID do vídeo no campo do leitor. A pesquisa automática por título será uma das próximas melhorias.");
      return;
    }
    setVideoId(id);
    setPlayerOpen(true);
    addMessage("assistant", "Abri o leitor do YouTube nesta página. Carrega em reproduzir se o navegador pedir autorização.");
  }

  function sendMessage(event) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    addMessage("user", text);
    setInput("");
    setBusy(true);
    window.setTimeout(() => {
      const lower = text.toLowerCase();
      let reply;
      const urlMatch = text.match(/https?:\/\/\S+/i);
      if (urlMatch && (lower.includes("toca") || lower.includes("youtube") || lower.includes("música") || lower.includes("musica") || lower.includes("reproduz"))) {
        playVideo(urlMatch[0].replace(/[),.]+$/, ""));
        reply = null;
      } else if (lower.includes("hora")) {
        reply = "A hora local do teu navegador é " + new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(new Date()) + ".";
      } else if (lower.includes("youtube") || lower.includes("música") || lower.includes("musica") || lower.startsWith("toca ")) {
        reply = "Posso mostrar um vídeo do YouTube no leitor desta página. Cola o link do vídeo no campo “Leitor do YouTube” e carrega em Reproduzir. A pesquisa automática e a ligação a uma IA ainda não estão configuradas.";
      } else if (lower.includes("quem és") || lower.includes("quem es") || lower.includes("jarvis")) {
        reply = "Sou o JARVIS, o teu assistente experimental no navegador. Esta primeira versão tem uma interface funcional, comandos básicos e um leitor incorporado; ainda não estou ligado a um serviço de inteligência artificial.";
      } else if (lower.includes("ajuda") || lower.includes("o que podes fazer") || lower.includes("comandos")) {
        reply = "Nesta versão podes conversar comigo com comandos básicos, ver a hora local e reproduzir um vídeo através de um link do YouTube. A seguir podemos adicionar uma API de IA, voz e pesquisa de músicas.";
      } else {
        reply = "Recebi a tua mensagem. Para responder a perguntas abertas com inteligência artificial, precisamos de ligar um serviço de IA através de uma API protegida no servidor. Esta versão ainda não está ligada a esse serviço.";
      }
      if (reply) addMessage("assistant", reply);
      setBusy(false);
    }, 250);
  }

  return (
    <main className="javis-shell">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #030712; color: #eaf3ff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .javis-shell { min-height: 100vh; padding: 28px; background: radial-gradient(ellipse at 50% -10%, #0d3860 0%, transparent 45%), #030712; color: #eaf3ff; }
        .javis-wrap { max-width: 1180px; margin: 0 auto; }
        .javis-top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:26px; }
        .javis-brand { display:flex; align-items:center; gap:13px; }
        .javis-orb { width:48px; height:48px; display:grid; place-items:center; border-radius:50%; border:1px solid #37d9ff; color:#76e8ff; background:radial-gradient(circle,#164d79,#071529 68%); box-shadow:0 0 28px #0ea5e955,inset 0 0 16px #0ea5e933; font-size:22px; }
        .javis-brand h1 { margin:0; font-size:22px; letter-spacing:4px; }
        .javis-brand p { margin:4px 0 0; color:#80a6c8; font-size:12px; letter-spacing:1.5px; }
        .javis-status { color:#6ee7b7; border:1px solid #145b4a; background:#06261f; padding:8px 12px; border-radius:999px; font-size:12px; white-space:nowrap; }
        .javis-grid { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(300px,.85fr); gap:18px; }
        .javis-panel { border:1px solid #17334b; border-radius:20px; background:linear-gradient(150deg,#081827ee,#06111fee); box-shadow:0 18px 55px #0005; overflow:hidden; }
        .javis-panel-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid #17334b; }
        .javis-panel-head h2 { margin:0; font-size:14px; font-weight:650; letter-spacing:.7px; }
        .javis-muted { color:#7f9bb6; font-size:12px; }
        .javis-chat { min-height:410px; max-height:54vh; overflow:auto; padding:20px; display:flex; flex-direction:column; gap:14px; }
        .javis-msg { max-width:88%; padding:13px 15px; border-radius:15px; font-size:14px; line-height:1.6; white-space:pre-wrap; }
        .javis-msg.assistant { align-self:flex-start; background:#0b2032; border:1px solid #173b55; color:#d9eaff; border-top-left-radius:5px; }
        .javis-msg.user { align-self:flex-end; background:linear-gradient(135deg,#075985,#155e75); border:1px solid #0e7490; color:#effcff; border-top-right-radius:5px; }
        .javis-chat-form { display:flex; gap:9px; padding:16px; border-top:1px solid #17334b; }
        .javis-input { width:100%; min-width:0; color:#edf7ff; background:#030c17; border:1px solid #23445e; border-radius:12px; padding:13px 14px; outline:none; }
        .javis-input:focus { border-color:#22d3ee; box-shadow:0 0 0 3px #22d3ee1a; }
        .javis-btn { border:1px solid #1ca7c9; background:linear-gradient(135deg,#087ea4,#075985); color:white; border-radius:12px; padding:12px 16px; font-weight:650; }
        .javis-btn:hover { filter:brightness(1.12); }
        .javis-player-body { padding:18px; }
        .javis-video { width:100%; aspect-ratio:16/9; border:1px solid #24465f; border-radius:13px; background:#020711; overflow:hidden; }
        .javis-video iframe { width:100%; height:100%; border:0; }
        .javis-placeholder { width:100%; aspect-ratio:16/9; border:1px dashed #24465f; border-radius:13px; display:grid; place-items:center; text-align:center; padding:20px; background:radial-gradient(circle at center,#0b2a42,#030914 70%); color:#80a6c8; }
        .javis-player-form { display:flex; gap:8px; margin-top:14px; }
        .javis-hint { margin:11px 0 0; color:#7894ad; font-size:11px; line-height:1.55; }
        .javis-shortcuts { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
        .javis-chip { color:#a9c8e4; background:#081827; border:1px solid #1c3a53; border-radius:999px; padding:8px 11px; font-size:12px; cursor:pointer; }
        .javis-footer { color:#5f7c97; font-size:11px; text-align:center; padding:22px 0 4px; }
        @media(max-width:800px) { .javis-shell { padding:16px; } .javis-grid { grid-template-columns:1fr; } .javis-chat { min-height:300px; max-height:48vh; } .javis-top { align-items:flex-start; } .javis-brand h1 { font-size:18px; } .javis-status { font-size:10px; padding:7px 9px; } }
        @media(max-width:420px) { .javis-player-form { flex-direction:column; } .javis-chat-form { padding:12px; } .javis-msg { max-width:96%; } }
      `}</style>
      <div className="javis-wrap">
        <header className="javis-top">
          <div className="javis-brand">
            <div className="javis-orb" aria-hidden="true">✦</div>
            <div><h1>J.A.R.V.I.S.</h1><p>ASSISTENTE PESSOAL EXPERIMENTAL</p></div>
          </div>
          <div className="javis-status">● SISTEMA ONLINE</div>
        </header>
        <div className="javis-grid">
          <section className="javis-panel">
            <div className="javis-panel-head"><h2>CONVERSA</h2><span className="javis-muted">PORTUGUÊS · BETA</span></div>
            <div className="javis-chat" aria-live="polite">
              {messages.map((message, index) => <div key={index} className={"javis-msg " + message.role}>{message.text}</div>)}
              {busy && <div className="javis-msg assistant">A processar o comando…</div>}
            </div>
            <form className="javis-chat-form" onSubmit={sendMessage}>
              <input className="javis-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escreve um comando para o JARVIS…" aria-label="Mensagem para o JARVIS" />
              <button className="javis-btn" type="submit">Enviar</button>
            </form>
          </section>
          <aside className="javis-panel">
            <div className="javis-panel-head"><h2>LEITOR DO YOUTUBE</h2><button type="button" className="javis-chip" onClick={() => setPlayerOpen((v) => !v)}>{playerOpen ? "Ocultar" : "Mostrar"}</button></div>
            {playerOpen && videoId ? <div className="javis-player-body"><div className="javis-video"><iframe src={videoUrl} title="Leitor de vídeo do YouTube" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowFullScreen /></div><button type="button" className="javis-chip" style={{marginTop:12}} onClick={() => { setVideoId(""); setPlayerOpen(false); }}>Fechar leitor</button></div> : <div className="javis-player-body"><div className="javis-placeholder"><div><div style={{fontSize:34,marginBottom:10}}>♫</div><strong>O teu leitor flutuante</strong><p style={{fontSize:12,lineHeight:1.6}}>Cola um link do YouTube e reproduz o vídeo sem sair desta página.</p></div></div></div>}
            <div className="javis-player-body" style={{paddingTop:0}}>
              <form className="javis-player-form" onSubmit={(e) => { e.preventDefault(); playVideo(youtubeInput); }}>
                <input className="javis-input" value={youtubeInput} onChange={(e) => setYoutubeInput(e.target.value)} placeholder="Link ou ID do vídeo…" aria-label="Link ou ID do vídeo do YouTube" />
                <button className="javis-btn" type="submit">Reproduzir</button>
              </form>
              <p className="javis-hint">Nota: alguns vídeos não permitem reprodução incorporada. O navegador ou o YouTube pode pedir que carregues em reproduzir.</p>
              <div className="javis-shortcuts">
                <button className="javis-chip" type="button" onClick={() => { setInput("Que horas são?"); }}>Que horas são?</button>
                <button className="javis-chip" type="button" onClick={() => { setInput("Ajuda: o que podes fazer?"); }}>Ajuda</button>
                <button className="javis-chip" type="button" onClick={() => { setInput("Quem és, JARVIS?"); }}>Quem és?</button>
              </div>
            </div>
          </aside>
        </div>
        <div className="javis-footer">JARVIS · VERSÃO INICIAL · A IA e a pesquisa automática do YouTube ainda não estão ligadas.</div>
      </div>
    </main>
  );
}
