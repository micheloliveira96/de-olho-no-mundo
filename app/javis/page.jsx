"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const starterMessages = [
  {
    role: "assistant",
    content: "Olá. Sou K.E.T.U.R.A., a tua assistente pessoal. Podes conversar comigo por texto ou voz, enviar ficheiros e pesquisar conteúdos."
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
  const hasAction = /\b(toca|tocar|toque|reproduz|reproduzir|procura|pesquisa|encontra|quero ouvir|mete|p[oõ]e)\b/i.test(text);
  const hasMusicTarget = /\b(m[uú]sica|musicas|can[cç][aã]o|can[cç][oõ]es|youtube|som|playlist|artista|ouvir|tocar|remix|instrumental|relaxante|rock|pop|rap|fado|jazz)\b/i.test(text);
  return hasAction && hasMusicTarget;
}

function extractMusicQuery(text) {
  const cleaned = text
    .replace(/^(?:k\.?e\.?t\.?u\.?r\.?a\.?[,: ]*)?/i, "")
    .replace(/\b(toca|tocar|toque|reproduz|reproduzir|procura|pesquisa|encontra|quero ouvir|quero|ouve|mete|p[oõ]e|por favor)\b/ig, " ")
    .replace(/\b(uma|a|o|as|os|m[uú]sica|musicas|can[cç][aã]o|can[cç][oõ]es|no youtube|youtube|para mim|a[ií]|agora)\b/ig, " ")
    .replace(/[“”"]/g, "")
    .replace(/[,.!?;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || text.trim();
}

function isImageRequest(text) {
  return /\b(mostra|mostrar|procura|pesquisa|encontra|quero ver|exibe|exibir)\b/i.test(text) &&
    /\b(imagem|imagens|fotografia|fotografias|fotos|foto|fotografias|imagem de|fotos de)\b/i.test(text);
}

function extractImageQuery(text) {
  return text
    .replace(/^(ketura[,: ]*)?/i, "")
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
  const processingVoiceRef = useRef(false);
  const [attachments, setAttachments] = useState([]);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [status, setStatus] = useState("Pronto");
  const [errorMessage, setErrorMessage] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const speak = useCallback((text, onEnd) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-PT";
    utterance.rate = 1;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const portugueseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-pt")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
    if (portugueseVoice) utterance.voice = portugueseVoice;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
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
    const term = query.trim();
    if (!term) return;
    setPanel("music");
    setStatus("A pesquisar no YouTube…");
    setErrorMessage("");
    try {
      const response = await fetch("/api/javis/youtube?q=" + encodeURIComponent(term));
      const data = await response.json();
      if (!response.ok) {
        setMusicResults([]);
        setErrorMessage(data.error || "Não foi possível pesquisar no YouTube.");
        return;
      }
      setMusicResults(data.items || []);
      if (!data.items?.length) setErrorMessage("Não encontrei vídeos para “" + term + "”. Experimenta outro termo.");
    } catch {
      setMusicResults([]);
      setErrorMessage("Não foi possível ligar à pesquisa do YouTube.");
    } finally {
      setStatus("Pronto");
    }
  }, []);

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

  const processMessage = useCallback(async (rawText, selectedAttachments = []) => {
    const text = rawText.trim();
    if ((!text && !selectedAttachments.length) || busy) return;
    const messageText = text || "Analisa os ficheiros que anexei e explica o que consegues identificar.";
    setInput("");
    setErrorMessage("");
    const attachmentLabels = selectedAttachments.map((file) => file.name).filter(Boolean);
    const userDisplayText = attachmentLabels.length ? messageText + "\\n\\nAnexos: " + attachmentLabels.join(", ") : messageText;
    const current = [...messagesRef.current, { role: "user", content: userDisplayText }];
    setMessages(current);
    setAttachments([]);
    setBusy(true);
    setStatus("A pensar…");

    const youtubeId = getYouTubeId(text);
    if (youtubeId && /youtube|youtu\.be|toca|reproduz|abre|vídeo|video|m[uú]sica/i.test(text)) {
      setBusy(false);
      setStatus("Pronto");
      playVideo(youtubeId, "Vídeo do YouTube");
      return;
    }

    try {
      if (isMusicRequest(text)) {
        await searchMusic(extractMusicQuery(text));
        setBusy(false);
        setStatus("Pronto");
          return;
      }
      if (isImageRequest(text)) {
        await searchImages(extractImageQuery(text));
        setBusy(false);
        setStatus("Pronto");
          return;
      }

      const response = await fetch("/api/javis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...current.slice(-16, -1).map(({ role, content }) => ({ role, content })),
            {
              role: "user",
              content: selectedAttachments.some((file) => file.dataUrl && file.type.startsWith("image/"))
                ? [
                    { type: "text", text: messageText + (selectedAttachments.length ? "\\nAnexos: " + selectedAttachments.map((file) => file.name).join(", ") : "") },
                    ...selectedAttachments.filter((file) => file.dataUrl && file.type.startsWith("image/")).map((file) => ({ type: "image_url", image_url: { url: file.dataUrl } })),
                    ...selectedAttachments.filter((file) => file.textContent).map((file) => ({ type: "text", text: "\\nConteúdo do ficheiro " + file.name + ":\\n" + file.textContent.slice(0, 12000) }))
                  ]
                : messageText + selectedAttachments.map((file) => file.textContent ? "\\n\\nConteúdo do ficheiro " + file.name + ":\\n" + file.textContent.slice(0, 12000) : "\\nFicheiro anexado: " + file.name + " (" + file.type + "). Este formato foi anexado, mas o conteúdo não está disponível para leitura nesta versão.").join("")
            }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data.error || "A inteligência artificial ainda não está configurada.";
        setErrorMessage(message);
        addMessage("assistant", message);
        speak(message, () => {
        });
      } else {
        addMessage("assistant", data.answer);
        speak(data.answer, () => {
        });
      }
    } catch {
      const message = "Não consegui ligar ao serviço de inteligência artificial. Tenta novamente.";
      setErrorMessage(message);
      addMessage("assistant", message);
      speak(message, () => {
      });
    } finally {
      setBusy(false);
      setStatus("Pronto");
    }
  }, [addMessage, busy, playVideo, searchImages, searchMusic, speak]);

  const addAttachments = useCallback(async (fileList) => {
    const selected = Array.from(fileList || []).slice(0, 5);
    const prepared = [];
    for (const file of selected) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMessage("Cada ficheiro deve ter no máximo 3 MB: " + file.name);
        continue;
      }
      const item = { name: file.name, type: file.type || "application/octet-stream", size: file.size };
      try {
        if (file.type.startsWith("image/")) {
          item.dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else if (file.type.startsWith("text/") || /\.(txt|md|csv|json|js|jsx|ts|tsx|html|css|xml|log)$/i.test(file.name)) {
          item.textContent = await file.text();
        }
      } catch {
        setErrorMessage("Não consegui ler o ficheiro " + file.name + ".");
      }
      prepared.push(item);
    }
    setAttachments((old) => [...old, ...prepared].slice(0, 5));
    if (prepared.length) setErrorMessage("");
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const message = "Este navegador não disponibiliza reconhecimento de voz compatível. Experimenta a versão mais recente do Chrome ou Edge.";
      setErrorMessage(message);
      addMessage("assistant", message);
      return;
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
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
    } catch (error) {
      setIsListening(false);
      setStatus("Pronto");
      setErrorMessage(error?.name === "NotAllowedError" ? "O acesso ao microfone foi recusado. Permite-o nas definições do site e tenta novamente." : "Não consegui iniciar o microfone. Verifica as permissões do navegador e tenta novamente.");
    }
  }, [addMessage, processMessage]);


  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function submitMessage(event) {
    event.preventDefault();
    processMessage(input, attachments);
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
    await searchMusic(value);
  }

  useEffect(() => {
    if (!videoId || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: videoTitle || "Vídeo do YouTube",
        artist: "YouTube",
        album: "K.E.T.U.R.A."
      });
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.setActionHandler("play", () => setPlayerOpen(true));
      navigator.mediaSession.setActionHandler("pause", () => navigator.mediaSession.playbackState = "paused");
    } catch {}
    return () => {
      try {
        navigator.mediaSession.playbackState = "none";
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {}
    };
  }, [videoId, videoTitle]);

  const videoUrl = videoId ? "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0" : "";

  return (
    <main className="javis-shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #02080d; color: #eafcff; font-family: "DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
        h1,h2,strong,.javis-btn,.javis-secondary,.javis-mic { font-family: "Manrope", "DM Sans", ui-sans-serif, system-ui, sans-serif; }
        button,input { font:inherit; }
        button { cursor:pointer; }
        .javis-shell { min-height:100vh; padding:24px; background:radial-gradient(ellipse at 50% 0%,#073b46 0%,transparent 42%),radial-gradient(ellipse at 100% 50%,#06242b 0%,transparent 40%),#02080d; color:#eafcff; }
        .javis-wrap { max-width:1440px; margin:0 auto; }
        .javis-top { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; }
        .javis-brand { display:flex; align-items:center; gap:13px; }
        .javis-orb { width:52px; height:52px; display:grid; place-items:center; border-radius:50%; border:1px solid #20f2ed; color:#6ffffa; background:radial-gradient(circle,#0c5b63,#06151b 68%); box-shadow:0 0 28px #00e5df44,inset 0 0 16px #00e5df33; font-size:23px; }
        .javis-brand h1 { margin:0; font-size:22px; letter-spacing:4px; text-shadow:0 0 18px #16e0dc55; }
        .javis-brand p { margin:4px 0 0; color:#62b9bd; font-size:12px; letter-spacing:1.4px; }
        .javis-status { color:#65fff1; border:1px solid #126d6a; background:#052321; padding:8px 12px; border-radius:999px; font-size:12px; white-space:nowrap; box-shadow:0 0 18px #00d5cb14; }
        .javis-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:18px; align-items:stretch; }
        .javis-panel { border:1px solid #14545a; border-radius:18px; background:linear-gradient(145deg,#071b20f5,#041015f5); box-shadow:0 18px 55px #0008,0 0 25px #00d9d014,inset 0 1px #8fffff0c; overflow:hidden; min-width:0; }
        .javis-panel-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:17px 19px; border-bottom:1px solid #12434a; background:linear-gradient(90deg,#0a282b88,transparent); }
        .javis-panel-head h2 { margin:0; font-size:13px; font-weight:700; letter-spacing:1px; color:#b9fffc; }
        .javis-muted { color:#5eaaa9; font-size:11px; }
        .javis-chat { min-height:300px; height:clamp(300px,48vh,560px); overflow:auto; padding:20px; display:flex; flex-direction:column; gap:13px; background-image:linear-gradient(#0c34351b 1px,transparent 1px),linear-gradient(90deg,#0c34351b 1px,transparent 1px); background-size:28px 28px; }
        .javis-msg { max-width:92%; padding:12px 15px; border-radius:15px; font-size:14px; line-height:1.72; letter-spacing:.04px; white-space:pre-wrap; overflow-wrap:anywhere; }
        .javis-msg.assistant { align-self:flex-start; background:#092328; border:1px solid #155158; color:#d9ffff; border-top-left-radius:4px; }
        .javis-msg.user { align-self:flex-end; background:linear-gradient(135deg,#075e64,#087f82); border:1px solid #0b9b9d; color:#efffff; border-top-right-radius:4px; }
        .javis-chat-form { display:flex; align-items:center; gap:8px; padding:15px; border-top:1px solid #12434a; }\n        .javis-icon-btn { flex:0 0 44px; height:44px; display:grid; place-items:center; border:1px solid #20565d; border-radius:13px; background:linear-gradient(145deg,#0b252b,#061519); color:#a9f6f0; box-shadow:inset 0 1px #ffffff0b,0 5px 14px #0002; transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease; }
        .javis-icon-btn svg { width:20px; height:20px; stroke:currentColor; }
        .javis-icon-btn:hover { transform:translateY(-1px); border-color:#36d9d1; background:linear-gradient(145deg,#10383e,#082126); box-shadow:0 0 18px #00e5df18; }
        .javis-icon-btn:focus-visible,.javis-btn:focus-visible,.javis-secondary:focus-visible { outline:2px solid #6ffffa; outline-offset:3px; }\n        .javis-attachments { display:flex; gap:8px; flex-wrap:wrap; padding:0 15px 12px; }\n        .javis-attachment { display:flex; align-items:center; gap:7px; max-width:220px; padding:5px 8px; border:1px solid #1b555b; border-radius:9px; background:#071a1f; color:#bce9e6; font-size:11px; }\n        .javis-attachment img { width:28px; height:28px; object-fit:cover; border-radius:5px; }\n        .javis-attachment span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n        .javis-attachment button { border:0; background:transparent; color:#ffaaaa; font-size:18px; }
        .javis-input { width:100%; min-width:0; color:#edffff; background:#020d11; border:1px solid #1b555b; border-radius:13px; padding:12px 14px; outline:none; font-size:14px; letter-spacing:.05px; }
        .javis-input:focus { border-color:#27f1e8; box-shadow:0 0 0 3px #22d3ee18; }
        .javis-btn { border:1px solid #12c9c4; background:linear-gradient(135deg,#087e80,#07565e); color:#efffff; border-radius:12px; padding:11px 14px; font-weight:700; white-space:nowrap; box-shadow:0 5px 16px #00c8c018,inset 0 1px #ffffff12; transition:filter .18s ease,transform .18s ease; }
        .javis-btn:hover { filter:brightness(1.16); }
        .javis-btn:disabled { opacity:.55; cursor:not-allowed; }
        .javis-secondary { border:1px solid #1b555b; background:linear-gradient(145deg,#0a2227,#061519); color:#b5eeeb; border-radius:12px; padding:10px 12px; transition:border-color .18s ease,background .18s ease; }
        .javis-modes { display:flex; gap:10px; padding:12px 15px; border-top:1px solid #12434a; background:#06171b; }
        .javis-modes button { flex:1; }
        .javis-mic { border:1px solid #12c9c4; background:linear-gradient(135deg,#087e80,#07565e); color:white; border-radius:12px; padding:12px 15px; font-weight:700; box-shadow:0 5px 16px #00c8c018; }
        .javis-mic.listening { background:#3b1020; color:#ffc3d0; border-color:#9f1239; }
        .javis-player-body { padding:16px; }
        .javis-video { width:100%; aspect-ratio:16/9; border:1px solid #1c686d; border-radius:12px; background:#020711; overflow:hidden; box-shadow:0 0 25px #00d9d00c; }
        .javis-video iframe { width:100%; height:100%; border:0; }
        .javis-placeholder { width:100%; aspect-ratio:16/9; border:1px dashed #1c686d; border-radius:12px; display:grid; place-items:center; text-align:center; padding:20px; background:radial-gradient(circle at center,#0a3438,#030c10 70%); color:#78bdbd; }
        .javis-player-form { display:flex; gap:8px; margin-top:13px; }
        .javis-hint { margin:10px 0 0; color:#609393; font-size:11px; line-height:1.55; }
        .javis-tabs { display:flex; gap:7px; padding:12px 16px 0; max-width:360px; }
        .javis-tab { flex:1; border:1px solid #17494f; background:#061519; color:#83b9b8; border-radius:9px; padding:9px; font-size:12px; }
        .javis-tab.active { border-color:#1ad9d2; background:#0b3337; color:#dffffd; box-shadow:0 0 15px #00d9d018; }
        .javis-results { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(175px,30%); gap:11px; padding:14px 16px 18px; overflow-x:auto; overscroll-behavior-x:contain; scrollbar-width:thin; scrollbar-color:#147c7c #061519; }
        .javis-result { border:1px solid #17494f; border-radius:11px; background:#041317; overflow:hidden; min-width:0; }
        .javis-result img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#020711; }
        .javis-result-info { padding:10px; }
        .javis-result-title { color:#dffffe; font-size:12px; line-height:1.45; margin:0 0 6px; overflow-wrap:anywhere; }
        .javis-result-sub { color:#70a5a5; font-size:10px; margin:0 0 9px; }
        .javis-result button { width:100%; }
        .javis-empty { padding:18px; color:#6fa3a4; font-size:12px; line-height:1.6; }
        .javis-error { border:1px solid #7f1d1d; background:#2b1118; color:#fecaca; padding:11px 13px; margin:12px 16px 0; border-radius:10px; font-size:12px; line-height:1.5; }
        .javis-footer { color:#4d8587; font-size:11px; text-align:center; padding:22px 0 4px; line-height:1.6; }
        .javis-actions { display:flex; align-items:center; gap:9px; flex-wrap:wrap; padding:12px 16px; border-top:1px solid #12434a; }
        .javis-actions label { color:#83b9b8; font-size:12px; display:flex; align-items:center; gap:7px; }
        .javis-actions input { accent-color:#22d3ee; }
        @media(max-width:900px) { .javis-shell { padding:16px; } .javis-grid { grid-template-columns:minmax(0,1fr); } .javis-chat { height:42vh; min-height:260px; } .javis-top { align-items:flex-start; } .javis-brand h1 { font-size:18px; } .javis-status { font-size:10px; padding:7px 9px; } .javis-results { grid-auto-columns:minmax(175px,42%); } }
        @media(max-width:430px) {
          .javis-shell { padding:10px; padding-bottom:20px; }
          .javis-top { align-items:center; gap:10px; margin-bottom:14px; }
          .javis-brand { gap:9px; min-width:0; }
          .javis-orb { width:40px; height:40px; flex:0 0 40px; font-size:19px; }
          .javis-brand h1 { font-size:16px; letter-spacing:2px; }
          .javis-brand p { font-size:9px; letter-spacing:.7px; line-height:1.4; }
          .javis-status { font-size:9px; padding:6px 8px; white-space:normal; text-align:center; }
          .javis-grid { gap:12px; }
          .javis-panel { border-radius:14px; }
          .javis-panel-head { padding:13px 12px; gap:7px; }
          .javis-panel-head h2 { font-size:11px; letter-spacing:.5px; line-height:1.4; }
          .javis-muted { font-size:9px; }
          .javis-chat { height:52svh; min-height:280px; max-height:520px; padding:12px; gap:10px; }
          .javis-msg { max-width:96%; padding:10px 11px; font-size:14px; line-height:1.55; }
          .javis-chat-form { display:grid; grid-template-columns:42px 42px minmax(0,1fr); gap:7px; padding:10px; }
          .javis-chat-form > .javis-input { grid-column:1 / -1; min-height:46px; }
          .javis-icon-btn { width:42px; flex-basis:42px; height:42px; }
          .javis-chat-form > .javis-btn { min-height:42px; }
          .javis-attachments { padding:0 10px 10px; gap:6px; }
          .javis-attachment { max-width:100%; }
          .javis-modes { flex-direction:column; padding:10px; gap:8px; }
          .javis-modes button { width:100%; min-height:44px; }
          .javis-actions { padding:10px; gap:8px; }
          .javis-actions label { width:100%; min-height:38px; }
          .javis-actions .javis-secondary { flex:1 1 auto; min-height:40px; }
          .javis-player-body { padding:10px; }
          .javis-player-form { flex-direction:column; gap:8px; }
          .javis-player-form .javis-input, .javis-player-form .javis-btn { min-height:44px; width:100%; }
          .javis-hint { font-size:11px; }
          .javis-tabs { padding:10px 10px 0; max-width:none; }
          .javis-tab { padding:10px 6px; font-size:11px; }
          .javis-results { grid-auto-columns:82%; padding:10px; gap:9px; }
          .javis-result-info { padding:9px; }
          .javis-result-title { font-size:13px; }
          .javis-result-sub { font-size:11px; }
          .javis-empty { padding:12px; line-height:1.55; }
          .javis-footer { padding:18px 4px 4px; font-size:10px; }
        }
        @media(max-width:360px) {
          .javis-shell { padding:7px; }
          .javis-brand h1 { font-size:14px; letter-spacing:1.5px; }
          .javis-brand p { font-size:8px; }
          .javis-status { max-width:82px; }
          .javis-panel-head h2 { font-size:10px; }
          .javis-results { grid-auto-columns:90%; }
        }
      `}</style>
      <div className="javis-wrap">
        <header className="javis-top">
          <div className="javis-brand">
            <div className="javis-orb" aria-hidden="true">✦</div>
            <div><h1>K.E.T.U.R.A.</h1><p>ASSISTENTE PESSOAL · VOZ E IA</p></div>
          </div>
          <div className="javis-status">● {status.toUpperCase()}</div>
        </header>

        <div className="javis-grid">
          <section className="javis-panel">
            <div className="javis-panel-head"><h2>CONVERSA COM O K.E.T.U.R.A.</h2><span className="javis-muted">PT-PT</span></div>
            <div className="javis-chat" aria-live="polite">
              {messages.map((message, index) => <div key={index} className={"javis-msg " + message.role}>{message.content}</div>)}
              {busy && <div className="javis-msg assistant">A processar o teu pedido…</div>}
              <div ref={chatEndRef} />
            </div>
            {errorMessage && <div className="javis-error">{errorMessage}</div>}
            <form className="javis-chat-form" onSubmit={submitMessage}>
              <input ref={inputRef} className="javis-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escreve a tua mensagem…" aria-label="Mensagem para o K.E.T.U.R.A." />
              <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => { addAttachments(event.target.files); event.target.value = ""; }} />
              <input ref={fileInputRef} type="file" multiple hidden onChange={(event) => { addAttachments(event.target.files); event.target.value = ""; }} />
              <button type="button" className="javis-icon-btn" title="Anexar fotografia" aria-label="Anexar fotografia" onClick={() => imageInputRef.current?.click()}><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg></button>
              <button type="button" className="javis-icon-btn" title="Anexar ficheiro" aria-label="Anexar ficheiro" onClick={() => fileInputRef.current?.click()}><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21.4 11.1-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg></button>
              <button className="javis-btn" type="submit" disabled={busy || (!input.trim() && !attachments.length)} aria-label="Enviar mensagem"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>
            </form>
            {attachments.length > 0 && <div className="javis-attachments">{attachments.map((file, index) => <div className="javis-attachment" key={file.name + index}>
              {file.dataUrl ? <img src={file.dataUrl} alt="" /> : <span>📄</span>}
              <span title={file.name}>{file.name}</span>
              <button type="button" aria-label={"Remover " + file.name} title="Remover anexo" onClick={() => setAttachments((old) => old.filter((_, i) => i !== index))}>×</button>
            </div>)}</div>}
            <div className="javis-modes">
              <button type="button" className="javis-secondary" onClick={() => inputRef.current?.focus()}>💬 Conversar por texto</button>
              <button type="button" className={"javis-mic " + (isListening ? "listening" : "")} onClick={isListening ? () => recognitionRef.current?.stop() : startListening}>
                {isListening ? "■ Parar de ouvir" : "🎙 Conversar por voz"}
              </button>
            </div>
            <div className="javis-actions">
              <label><input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} /> Ler respostas em voz alta</label>
              <button type="button" className="javis-secondary" onClick={() => { window.speechSynthesis?.cancel(); }}>Parar voz</button>
              <button type="button" className="javis-secondary" onClick={() => { setMessages(starterMessages); setErrorMessage(""); }}>Limpar conversa</button>
            </div>
          </section>

          <aside className="javis-panel">
            <div className="javis-panel-head"><h2>CONTEÚDOS E RESULTADOS</h2><span className="javis-muted">SCROLL HORIZONTAL</span></div>
            <div className="javis-tabs">
              <button type="button" className={"javis-tab " + (panel === "music" ? "active" : "")} onClick={() => setPanel("music")}>♫ Vídeos e música</button>
              <button type="button" className={"javis-tab " + (panel === "images" ? "active" : "")} onClick={() => setPanel("images")}>▧ Imagens</button>
            </div>
            {panel === "music" && <>
              <div className="javis-player-body">
                {playerOpen && videoId ? <div className="javis-video"><iframe src={videoUrl} title={videoTitle} allow="autoplay; encrypted-media; picture-in-picture; web-share" allowFullScreen /></div> :
                  <div className="javis-placeholder"><div><div style={{fontSize:34,marginBottom:10}}>♫</div><strong>O teu leitor de música</strong><p style={{fontSize:12,lineHeight:1.6}}>Pede uma música por voz ou pesquisa pelo nome e escolhe um resultado para reproduzir aqui.</p></div></div>}
                <form className="javis-player-form" onSubmit={submitMusicSearch}>
                  <input className="javis-input" value={youtubeInput} onChange={(event) => setYoutubeInput(event.target.value)} placeholder="Pesquisar diretamente no YouTube…" aria-label="Pesquisar diretamente no YouTube ou colar link" />
                  <button className="javis-btn" type="submit" disabled={!youtubeInput.trim() || status === "A pesquisar no YouTube…"}>Buscar no YouTube</button>
                </form>
                {playerOpen && videoId && <button type="button" className="javis-secondary" style={{marginTop:10}} onClick={() => { setVideoId(""); setPlayerOpen(false); setVideoTitle(""); }}>Fechar leitor</button>}
                <p className="javis-hint">A pesquisa é feita diretamente aqui, sem enviar a pesquisa para a conversa. Em alguns telemóveis, o navegador ou o próprio YouTube pode interromper o áudio quando o ecrã bloqueia; uma página web não consegue garantir reprodução em segundo plano em todos os dispositivos.</p>
              </div>
              {musicResults.length > 0 ? <div className="javis-results">{musicResults.map((item) => <article className="javis-result" key={item.id}>
                <img src={item.thumbnail} alt="" loading="lazy" />
                <div className="javis-result-info"><p className="javis-result-title">{item.title}</p><p className="javis-result-sub">{item.channel}</p><button type="button" className="javis-btn" onClick={() => playVideo(item.id, item.title)}>▶ Tocar</button></div>
              </article>)}</div> : <div className="javis-empty">Escreve um nome ou artista e carrega em “Buscar no YouTube”. Os resultados aparecem aqui, sem mensagens na conversa.</div>}
            </>}

            {panel === "images" && <>
              <div className="javis-player-body">
                <div className="javis-placeholder" style={{aspectRatio:"16/7"}}><div><div style={{fontSize:30,marginBottom:7}}>▧</div><strong>Pesquisa de imagens</strong><p style={{fontSize:12,lineHeight:1.6}}>Pede ao K.E.T.U.R.A. para mostrar imagens de um tema.</p></div></div>
              </div>
              {imageResults.length > 0 ? <div className="javis-results">{imageResults.map((item, index) => <article className="javis-result" key={item.pageUrl || item.url || index}>
                <a href={item.pageUrl || item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.title} loading="lazy" /></a>
                <div className="javis-result-info"><p className="javis-result-title">{item.title}</p><p className="javis-result-sub">Licença: {item.license}</p><a className="javis-secondary" style={{display:"block",textAlign:"center",textDecoration:"none"}} href={item.pageUrl || item.url} target="_blank" rel="noreferrer">Ver origem</a></div>
              </article>)}</div> : <div className="javis-empty">As imagens encontradas aparecerão aqui. Os resultados vêm do Wikimedia Commons e podem ter licenças diferentes.</div>}
            </>}
          </aside>
        </div>
        <footer className="javis-footer">K.E.T.U.R.A. · A voz usa as capacidades disponíveis no navegador. A IA e a pesquisa de música precisam de chaves configuradas no servidor. O assistente só navega e executa ações dentro das funcionalidades autorizadas desta página.</footer>
      </div>
    </main>
  );
}
