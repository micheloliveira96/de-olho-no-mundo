"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const starterMessages = [
  {
    role: "assistant",
    content: "Olá, Michel. Sou o JARVIS. Podes escrever ou usar o microfone para falar comigo. Posso responder com IA quando a chave estiver configurada, pesquisar músicas e mostrar imagens nesta página."
  }
];

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

function isMusicRequest(text) {
  return /\b(toca|toque|reproduz|procura|pesquisa|encontra|quero ouvir|mete)\b/i.test(text) &&
    /\b(m[uú]sica|musicas|can[cç][aã]o|can[cç][oõ]es|youtube|som|playlist|artista|[a-z0-9]+\s+(ao vivo|remix))\b/i.test(text);
}

function extractMusicQuery(text) {
  return text
    .replace(/^(jarvis[,: ]*)?/i, "")
    .replace(/\b(toca|toque|reproduz|procura|pesquisa|encontra|quero ouvir|mete)\b/ig, "")
    .replace(/\b(m[uú]sica|musicas|can[cç][aã]o|can[cç][oõ]es|no youtube|youtube|por favor)\b/ig, "")
    .replace(/[“”"]/g, "")
    .trim() || text.trim();
}

function isImageRequest(text) {
  return /\b(mostra|mostrar|procura|pesquisa|encontra|quero ver|exibe|exibir)\b/i.test(text) &&
    /\b(imagem|imagens|fotografia|fotografias|fotos|foto|fotografias|imagem de|fotos de)\b/i.test(text);
}

function extractImageQuery(text) {
  return text
    .replace(/^(jarvis[,: ]*)?/i, "")
    .replace(/\b(mostra|mostrar|procura|pesquisa|encontra|quero ver|exibe|exibir)\b/ig, "")
    .replace(/\b(imagem|imagens|fotografia|fotografias|fotos|foto)\b/ig, "")
    .replace(/\b(por favor|para mim)\b/ig, "")
    .trim() || text.trim();
}

export default function JavisPage() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [musicResults, setMusicResults] = useState([]);
  const [imageResults, setImageResults] = useState([]);
  const [panel, setPanel] = useState("music");
  const [playerOpen, setPlayerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [status, setStatus] = useState("Pronto");
  const [errorMessage, setErrorMessage] = useState("");
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const speak = useCallback((text) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-PT";
    utterance.rate = 1;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const portugueseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-pt")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
    if (portugueseVoice) utterance.voice = portugueseVoice;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const addMessage = useCallback((role, content) => {
    setMessages((old) => [...old, { role, content }]);
  }, []);

  const playVideo = useCallback((value, title = "Vídeo do YouTube") => {
    const id = getYouTubeId(value);
    if (!id) {
      addMessage("assistant", "Não consegui identificar esse vídeo. Cola um link válido do YouTube ou pesquisa uma música pelo campo de pesquisa.");
      return false;
    }
    setVideoId(id);
    setVideoTitle(title);
    setPlayerOpen(true);
    setPanel("music");
    addMessage("assistant", "Abri " + title + " no leitor desta página. Se a reprodução não começar automaticamente, carrega no botão de reproduzir.");
    return true;
  }, [addMessage]);

  const searchMusic = useCallback(async (query) => {
    setPanel("music");
    setStatus("A pesquisar música…");
    setErrorMessage("");
    try {
      const response = await fetch("/api/javis/youtube?q=" + encodeURIComponent(query));
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Não foi possível pesquisar músicas.");
        if (data.searchUrl) setErrorMessage((data.error || "") + " Podes abrir a pesquisa no YouTube.");
        addMessage("assistant", data.error || "Não consegui pesquisar essa música.");
        if (data.searchUrl) window.open(data.searchUrl, "_blank", "noopener,noreferrer");
        return;
      }
      setMusicResults(data.items || []);
      if (data.items?.length) {
        addMessage("assistant", "Encontrei " + data.items.length + " resultados para “" + query + "”. Escolhe um para o reproduzir aqui.");
      } else {
        addMessage("assistant", "Não encontrei resultados para “" + query + "”. Experimenta outro nome ou artista.");
      }
    } catch {
      setErrorMessage("Não foi possível ligar à pesquisa do YouTube.");
      addMessage("assistant", "A pesquisa do YouTube não está disponível neste momento.");
    } finally {
      setStatus("Pronto");
    }
  }, [addMessage]);

  const searchImages = useCallback(async (query) => {
    setPanel("images");
    setStatus("A procurar imagens…");
    setErrorMessage("");
    try {
      const response = await fetch("/api/javis/images?q=" + encodeURIComponent(query));
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Não foi possível pesquisar imagens.");
        addMessage("assistant", data.error || "Não consegui pesquisar essas imagens.");
        return;
      }
      setImageResults(data.items || []);
      addMessage("assistant", data.items?.length
        ? "Encontrei imagens relacionadas com “" + query + "”. Abre qualquer resultado para consultar a página e a licença."
        : "Não encontrei imagens para “" + query + "”. Experimenta outro termo.");
    } catch {
      setErrorMessage("Não foi possível ligar ao serviço de imagens.");
      addMessage("assistant", "A pesquisa de imagens não está disponível neste momento.");
    } finally {
      setStatus("Pronto");
    }
  }, [addMessage]);

  const processMessage = useCallback(async (rawText) => {
    const text = rawText.trim();
    if (!text || busy) return;
    setInput("");
    setErrorMessage("");
    const current = [...messagesRef.current, { role: "user", content: text }];
    setMessages(current);
    setBusy(true);
    setStatus("A pensar…");

    const youtubeId = getYouTubeId(text);
    const lower = text.toLowerCase();
    if (youtubeId && /youtube|youtu\.be|toca|reproduz|abre|vídeo|video|m[uú]sica/i.test(text)) {
      setBusy(false);
      setStatus("Pronto");
      playVideo(youtubeId, "Vídeo do YouTube");
      return;
    }

    try {
      if (isMusicRequest(text)) {
        const query = extractMusicQuery(text);
        await searchMusic(query);
      } else if (isImageRequest(text)) {
        const query = extractImageQuery(text);
        await searchImages(query);
      }

      const response = await fetch("/api/javis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: current.slice(-16).map(({ role, content }) => ({ role, content }))
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "A inteligência artificial ainda não está configurada.";
        setErrorMessage(message);
        addMessage("assistant", message);
        speak(message);
      } else {
        addMessage("assistant", data.answer);
        speak(data.answer);
      }
    } catch {
      const message = "Não consegui ligar ao serviço de inteligência artificial. Tenta novamente.";
      setErrorMessage(message);
      addMessage("assistant", message);
      speak(message);
    } finally {
      setBusy(false);
      setStatus("Pronto");
    }
  }, [addMessage, busy, playVideo, searchImages, searchMusic, speak]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const message = "Este navegador não disponibiliza reconhecimento de voz compatível. Experimenta a versão mais recente do Chrome ou Edge.";
      setErrorMessage(message);
      addMessage("assistant", message);
      return;
    }
    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-PT";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = () => { setIsListening(true); setStatus("Estou a ouvir…"); setErrorMessage(""); };
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) processMessage(transcript);
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        setStatus("Pronto");
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setErrorMessage(event.error === "not-allowed" ? "Permite o acesso ao microfone nas definições do navegador." : "Não consegui reconhecer a voz. Tenta novamente.");
        }
      };
      recognition.onend = () => { setIsListening(false); setStatus("Pronto"); };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setStatus("Pronto");
      setErrorMessage("Não consegui iniciar o microfone. Verifica as permissões do navegador.");
    }
  }, [addMessage, processMessage]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function submitMessage(event) {
    event.preventDefault();
    processMessage(input);
  }

  async function submitMusicSearch(event) {
    event.preventDefault();
    const value = youtubeInput.trim();
    if (!value) return;
    const id = getYouTubeId(value);
    if (id) {
      playVideo(value);
      return;
    }
    setYoutubeInput("");
    await searchMusic(value);
  }

  const videoUrl = videoId ? "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0" : "";

  return (
    <main className="javis-shell">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #030712; color: #eaf3ff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button,input { font:inherit; }
        button { cursor:pointer; }
        .javis-shell { min-height:100vh; padding:28px; background:radial-gradient(ellipse at 50% -10%,#0d3860 0%,transparent 45%),#030712; color:#eaf3ff; }
        .javis-wrap { max-width:1240px; margin:0 auto; }
        .javis-top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:22px; }
        .javis-brand { display:flex; align-items:center; gap:13px; }
        .javis-orb { width:50px; height:50px; display:grid; place-items:center; border-radius:50%; border:1px solid #37d9ff; color:#76e8ff; background:radial-gradient(circle,#164d79,#071529 68%); box-shadow:0 0 28px #0ea5e955,inset 0 0 16px #0ea5e933; font-size:23px; }
        .javis-brand h1 { margin:0; font-size:22px; letter-spacing:4px; }
        .javis-brand p { margin:4px 0 0; color:#80a6c8; font-size:12px; letter-spacing:1.4px; }
        .javis-status { color:#6ee7b7; border:1px solid #145b4a; background:#06261f; padding:8px 12px; border-radius:999px; font-size:12px; white-space:nowrap; }
        .javis-grid { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr); gap:18px; align-items:start; }
        .javis-panel { border:1px solid #17334b; border-radius:20px; background:linear-gradient(150deg,#081827ee,#06111fee); box-shadow:0 18px 55px #0005; overflow:hidden; min-width:0; }
        .javis-panel-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:17px 19px; border-bottom:1px solid #17334b; }
        .javis-panel-head h2 { margin:0; font-size:13px; font-weight:700; letter-spacing:1px; }
        .javis-muted { color:#7f9bb6; font-size:11px; }
        .javis-chat { min-height:390px; max-height:55vh; overflow:auto; padding:20px; display:flex; flex-direction:column; gap:13px; }
        .javis-msg { max-width:92%; padding:12px 14px; border-radius:15px; font-size:14px; line-height:1.65; white-space:pre-wrap; overflow-wrap:anywhere; }
        .javis-msg.assistant { align-self:flex-start; background:#0b2032; border:1px solid #173b55; color:#d9eaff; border-top-left-radius:5px; }
        .javis-msg.user { align-self:flex-end; background:linear-gradient(135deg,#075985,#155e75); border:1px solid #0e7490; color:#effcff; border-top-right-radius:5px; }
        .javis-chat-form { display:flex; gap:9px; padding:15px; border-top:1px solid #17334b; }
        .javis-input { width:100%; min-width:0; color:#edf7ff; background:#030c17; border:1px solid #23445e; border-radius:12px; padding:12px 13px; outline:none; }
        .javis-input:focus { border-color:#22d3ee; box-shadow:0 0 0 3px #22d3ee1a; }
        .javis-btn { border:1px solid #1ca7c9; background:linear-gradient(135deg,#087ea4,#075985); color:white; border-radius:12px; padding:11px 14px; font-weight:650; white-space:nowrap; }
        .javis-btn:disabled { opacity:.55; cursor:not-allowed; }
        .javis-secondary { border:1px solid #23445e; background:#0a1a2a; color:#b8d4ed; border-radius:12px; padding:10px 12px; }
        .javis-mic { display:flex; align-items:center; gap:8px; padding:12px 15px; border:0; border-top:1px solid #17334b; background:#071827; color:#bfefff; width:100%; justify-content:center; font-weight:650; }
        .javis-mic.listening { background:#3b1020; color:#ffc3d0; }
        .javis-player-body { padding:17px; }
        .javis-video { width:100%; aspect-ratio:16/9; border:1px solid #24465f; border-radius:13px; background:#020711; overflow:hidden; }
        .javis-video iframe { width:100%; height:100%; border:0; }
        .javis-placeholder { width:100%; aspect-ratio:16/9; border:1px dashed #24465f; border-radius:13px; display:grid; place-items:center; text-align:center; padding:20px; background:radial-gradient(circle at center,#0b2a42,#030914 70%); color:#80a6c8; }
        .javis-player-form { display:flex; gap:8px; margin-top:13px; }
        .javis-hint { margin:10px 0 0; color:#7894ad; font-size:11px; line-height:1.55; }
        .javis-tabs { display:flex; gap:7px; padding:12px 16px 0; }
        .javis-tab { flex:1; border:1px solid #1c3a53; background:#071321; color:#91afc9; border-radius:10px; padding:9px; font-size:12px; }
        .javis-tab.active { border-color:#168dff; background:#0b2b46; color:#e2f4ff; }
        .javis-results { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:14px 16px 18px; }
        .javis-result { border:1px solid #1a3b53; border-radius:12px; background:#061321; overflow:hidden; min-width:0; }
        .javis-result img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#020711; }
        .javis-result-info { padding:10px; }
        .javis-result-title { color:#dceeff; font-size:12px; line-height:1.45; margin:0 0 6px; overflow-wrap:anywhere; }
        .javis-result-sub { color:#7695b1; font-size:10px; margin:0 0 9px; }
        .javis-result button { width:100%; }
        .javis-empty { padding:18px; color:#7894ad; font-size:12px; line-height:1.6; }
        .javis-error { border:1px solid #7f1d1d; background:#2b1118; color:#fecaca; padding:11px 13px; margin:12px 16px 0; border-radius:10px; font-size:12px; line-height:1.5; }
        .javis-footer { color:#5f7c97; font-size:11px; text-align:center; padding:22px 0 4px; line-height:1.6; }
        .javis-actions { display:flex; align-items:center; gap:9px; flex-wrap:wrap; padding:12px 16px; border-top:1px solid #17334b; }
        .javis-actions label { color:#93b0ca; font-size:12px; display:flex; align-items:center; gap:7px; }
        .javis-actions input { accent-color:#22d3ee; }
        @media(max-width:850px) { .javis-shell { padding:16px; } .javis-grid { grid-template-columns:1fr; } .javis-chat { min-height:280px; max-height:48vh; } .javis-top { align-items:flex-start; } .javis-brand h1 { font-size:18px; } .javis-status { font-size:10px; padding:7px 9px; } }
        @media(max-width:430px) { .javis-player-form { flex-direction:column; } .javis-chat-form { padding:12px; } .javis-msg { max-width:98%; } .javis-results { grid-template-columns:1fr 1fr; padding:10px; gap:8px; } .javis-result-info { padding:8px; } }
      `}</style>
      <div className="javis-wrap">
        <header className="javis-top">
          <div className="javis-brand">
            <div className="javis-orb" aria-hidden="true">✦</div>
            <div><h1>J.A.R.V.I.S.</h1><p>ASSISTENTE PESSOAL · VOZ E IA</p></div>
          </div>
          <div className="javis-status">● {status.toUpperCase()}</div>
        </header>

        <div className="javis-grid">
          <section className="javis-panel">
            <div className="javis-panel-head"><h2>CONVERSA COM O JARVIS</h2><span className="javis-muted">PT-PT</span></div>
            <div className="javis-chat" aria-live="polite">
              {messages.map((message, index) => <div key={index} className={"javis-msg " + message.role}>{message.content}</div>)}
              {busy && <div className="javis-msg assistant">A processar o teu pedido…</div>}
              <div ref={chatEndRef} />
            </div>
            {errorMessage && <div className="javis-error">{errorMessage}</div>}
            <form className="javis-chat-form" onSubmit={submitMessage}>
              <input className="javis-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Fala ou escreve ao JARVIS…" aria-label="Mensagem para o JARVIS" />
              <button className="javis-btn" type="submit" disabled={busy || !input.trim()}>Enviar</button>
            </form>
            <button type="button" className={"javis-mic " + (isListening ? "listening" : "")} onClick={isListening ? () => recognitionRef.current?.stop() : startListening}>
              {isListening ? "■ Parar de ouvir" : "🎙 Falar com o JARVIS"}
            </button>
            <div className="javis-actions">
              <label><input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} /> Ler respostas em voz alta</label>
              <button type="button" className="javis-secondary" onClick={() => { window.speechSynthesis?.cancel(); }}>Parar voz</button>
              <button type="button" className="javis-secondary" onClick={() => { setMessages(starterMessages); setErrorMessage(""); }}>Limpar conversa</button>
            </div>
          </section>

          <aside className="javis-panel">
            <div className="javis-panel-head"><h2>JANELA DE CONTEÚDOS</h2><span className="javis-muted">DENTRO DO JARVIS</span></div>
            <div className="javis-tabs">
              <button type="button" className={"javis-tab " + (panel === "music" ? "active" : "")} onClick={() => setPanel("music")}>♫ Música</button>
              <button type="button" className={"javis-tab " + (panel === "images" ? "active" : "")} onClick={() => setPanel("images")}>▧ Imagens</button>
            </div>
            {panel === "music" && <>
              <div className="javis-player-body">
                {playerOpen && videoId ? <div className="javis-video"><iframe src={videoUrl} title={videoTitle} allow="autoplay; encrypted-media; picture-in-picture; web-share" allowFullScreen /></div> :
                  <div className="javis-placeholder"><div><div style={{fontSize:34,marginBottom:10}}>♫</div><strong>O teu leitor de música</strong><p style={{fontSize:12,lineHeight:1.6}}>Pede uma música por voz ou pesquisa pelo nome e escolhe um resultado para reproduzir aqui.</p></div></div>}
                <form className="javis-player-form" onSubmit={submitMusicSearch}>
                  <input className="javis-input" value={youtubeInput} onChange={(event) => setYoutubeInput(event.target.value)} placeholder="Música, artista ou link do YouTube…" aria-label="Pesquisar música ou colar link do YouTube" />
                  <button className="javis-btn" type="submit">Pesquisar</button>
                </form>
                {playerOpen && videoId && <button type="button" className="javis-secondary" style={{marginTop:10}} onClick={() => { setVideoId(""); setPlayerOpen(false); setVideoTitle(""); }}>Fechar leitor</button>}
                <p className="javis-hint">Alguns vídeos podem bloquear a reprodução incorporada. A pesquisa automática exige uma chave da YouTube Data API.</p>
              </div>
              {musicResults.length > 0 ? <div className="javis-results">{musicResults.map((item) => <article className="javis-result" key={item.id}>
                <img src={item.thumbnail} alt="" loading="lazy" />
                <div className="javis-result-info"><p className="javis-result-title">{item.title}</p><p className="javis-result-sub">{item.channel}</p><button type="button" className="javis-btn" onClick={() => playVideo(item.id, item.title)}>▶ Tocar</button></div>
              </article>)}</div> : <div className="javis-empty">Os resultados de música aparecerão aqui. Experimenta dizer: “JARVIS, toca música relaxante” depois de configurar a API do YouTube.</div>}
            </>}

            {panel === "images" && <>
              <div className="javis-player-body">
                <div className="javis-placeholder" style={{aspectRatio:"16/7"}}><div><div style={{fontSize:30,marginBottom:7}}>▧</div><strong>Pesquisa de imagens</strong><p style={{fontSize:12,lineHeight:1.6}}>Pede ao JARVIS para mostrar imagens de um tema.</p></div></div>
              </div>
              {imageResults.length > 0 ? <div className="javis-results">{imageResults.map((item, index) => <article className="javis-result" key={item.pageUrl || item.url || index}>
                <a href={item.pageUrl || item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.title} loading="lazy" /></a>
                <div className="javis-result-info"><p className="javis-result-title">{item.title}</p><p className="javis-result-sub">Licença: {item.license}</p><a className="javis-secondary" style={{display:"block",textAlign:"center",textDecoration:"none"}} href={item.pageUrl || item.url} target="_blank" rel="noreferrer">Ver origem</a></div>
              </article>)}</div> : <div className="javis-empty">As imagens encontradas aparecerão aqui. Os resultados vêm do Wikimedia Commons e podem ter licenças diferentes.</div>}
            </>}
          </aside>
        </div>
        <footer className="javis-footer">JARVIS · A voz usa as capacidades disponíveis no navegador. A IA e a pesquisa de música precisam de chaves configuradas no servidor. O assistente só navega e executa ações dentro das funcionalidades autorizadas desta página.</footer>
      </div>
    </main>
  );
}
