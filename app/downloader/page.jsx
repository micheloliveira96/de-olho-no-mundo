"use client";

import { useMemo, useRef, useState } from "react";

const youtubePattern = /^https?:\/\/(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?[^#]*v=|shorts\/|live\/)|youtu\.be\/)[A-Za-z0-9_-]{11}(?:[&#?\/].*)?$/i;\nconst instagramPattern = /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)\/?(?:\?.*)?$/i;

export default function DownloaderPage() {
  const [url, setUrl] = useState("");
  const [checked, setChecked] = useState(false);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const platform = useMemo(() => instagramPattern.test(url.trim()) ? "Instagram" : youtubePattern.test(url.trim()) ? "YouTube" : null, [url]);\n  const valid = Boolean(platform);
  const preview = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);

  function analyze(event) {
    event.preventDefault();
    setChecked(true);
    setMessage(valid
      ? platform === "YouTube" ? "Link do YouTube reconhecido. Para descarregar o teu vídeo, utiliza a opção de download do YouTube Studio quando disponível e importa o MP4 aqui. Links de terceiros não permitem download direto por este site." : "Link do Instagram reconhecido. A API oficial não disponibiliza download público universal. Importa o ficheiro original ou uma cópia obtida com autorização."
      : "Insere um link válido do YouTube ou de uma publicação ou Reel do Instagram.");
  }
  function chooseFile(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("video/") || selected.size > 500 * 1024 * 1024) {
      setMessage("Seleciona um vídeo de até 500 MB.");
      return;
    }
    setFile(selected);
    setMessage("Vídeo importado localmente. Podes reproduzir ou guardar uma cópia.");
  }
  function download() {
    if (!file || !preview) return;
    const anchor = document.createElement("a");
    anchor.href = preview;
    anchor.download = file.name;
    anchor.click();
  }
  return (
    <main className="download-page">
      <header className="dl-topbar">
        <a className="dl-brand" href="/">◉ <span>DE OLHO NO MUNDO</span></a>
        <a className="dl-back" href="/">← Voltar ao painel</a>
      </header>
      <section className="dl-hero">
        <div className="dl-eyebrow">FERRAMENTAS · VÍDEO</div>
        <h1>Vídeo <em>Downloader</em></h1>
        <p>Importa, pré-visualiza e guarda vídeos autorizados do YouTube e Instagram, num espaço simples e seguro.</p>
        <form className="dl-link-form" onSubmit={analyze}>
          <label htmlFor="video-url">Link da publicação</label>
          <div className="dl-field-row">
            <input id="video-url" value={url} onChange={e => {setUrl(e.target.value);setChecked(false);}} placeholder="Cole um link do YouTube ou Instagram..." autoComplete="off" />
            <button type="submit">Analisar link</button>
          </div>
          {checked && <p className={valid ? "dl-notice" : "dl-error"} role="status">{message}</p>}
        </form>
        <div className="dl-divider"><span>OU</span></div>
        <div className="dl-upload">
          <div className="dl-upload-icon">↥</div>
          <h2>Importar vídeo autorizado</h2>
          <p>Seleciona o ficheiro original ou uma cópia que tens direito de utilizar. O ficheiro permanece no teu navegador.</p>
          <input ref={inputRef} type="file" accept="video/*" onChange={chooseFile} className="dl-hidden" aria-label="Selecionar vídeo" />
          <button type="button" className="dl-secondary" onClick={() => inputRef.current?.click()}>Escolher vídeo</button>
        </div>
        {file && preview && <div className="dl-result">
          <h2>O teu vídeo está pronto</h2>
          <video controls playsInline src={preview} />
          <div className="dl-result-bottom"><span>{file.name} · {(file.size / 1048576).toFixed(1)} MB</span><button type="button" onClick={download}>Descarregar cópia</button></div>
        </div>}
        {!checked && message && <p className="dl-notice" role="status">{message}</p>}
      </section>
      <section className="dl-features">
        <article><strong>01</strong><h3>YouTube e Instagram</h3><p>Validação de links das duas plataformas e importação de ficheiros de vídeo.</p></article>
        <article><strong>02</strong><h3>Privacidade</h3><p>A pré-visualização local não envia os teus ficheiros para um servidor.</p></article>
        <article><strong>03</strong><h3>Sem atalhos inseguros</h3><p>Sem solicitar passwords ou contornar restrições de contas privadas.</p></article>
      </section>
      <footer>Utiliza apenas conteúdo próprio ou devidamente autorizado. Este serviço não é afiliado ao YouTube, Google, Instagram ou Meta.</footer>
      <style jsx>{`
        *{box-sizing:border-box} .download-page{min-height:100vh;background:radial-gradient(ellipse at 50% -10%,#34221a 0%,#111318 45%,#0c0e12 100%);color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;padding:0 24px} .topbar{max-width:1100px;margin:auto;display:flex;align-items:center;justify-content:space-between;padding:25px 0;border-bottom:1px solid #ffffff16}.brand{font-weight:800;letter-spacing:1px;color:#f97316;text-decoration:none}.brand span{color:white}.back{color:#c5c7ce;text-decoration:none;font-size:14px}.back:hover{color:#fff}.hero{max-width:730px;margin:75px auto 50px;text-align:center}.eyebrow{font-size:12px;font-weight:800;letter-spacing:3px;color:#fb923c}h1{font-size:clamp(35px,6vw,62px);letter-spacing:-2px;margin:15px 0;font-weight:850}h1 em{color:#fb923c;font-style:normal}.hero>p{color:#aeb0bb;font-size:17px;line-height:1.6;margin:0 auto 36px;max-width:580px}.link-form,.upload,.result{background:#191b21;border:1px solid #34353d;border-radius:18px;padding:26px;text-align:left;box-shadow:0 20px 55px #0003}.link-form label{display:block;font-size:13px;font-weight:700;margin-bottom:12px}.field-row{display:flex;gap:10px}input:not([type=file]){flex:1;min-width:0;background:#101116;color:#fff;border:1px solid #45454e;border-radius:10px;padding:16px;font-size:15px}input:focus{outline:2px solid #f97316;outline-offset:1px}button{border:0;border-radius:10px;background:#f97316;color:#fff;font-weight:800;padding:15px 22px;cursor:pointer}button:hover{background:#ea580c}.divider{display:flex;align-items:center;gap:18px;color:#737783;font-size:12px;letter-spacing:2px;margin:27px 0}.divider:before,.divider:after{content:"";height:1px;flex:1;background:#34353d}.upload{text-align:center;border-style:dashed}.upload-icon{font-size:36px;color:#fb923c}.upload h2,.result h2{font-size:21px;margin:10px 0}.upload p{color:#aeb0bb;line-height:1.6;max-width:460px;margin:10px auto 22px;font-size:14px}.secondary{background:#2c303a;border:1px solid #51535c}.secondary:hover{background:#3b404c}.hidden{display:none}.notice,.error{font-size:14px;line-height:1.5;margin:14px 0 0;padding:12px;border-radius:9px;background:#332619;color:#ffd4ad}.error{background:#3c1d24;color:#ffb7c0}.result{margin-top:24px}.result video{width:100%;max-height:420px;border-radius:10px;background:#000;margin:14px 0}.result-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;color:#bfc1c8;font-size:13px}.features{max-width:1100px;margin:0 auto 65px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.features article{background:#16181d;border:1px solid #303139;padding:24px;border-radius:15px}.features strong{color:#fb923c}.features h3{font-size:17px}.features p{font-size:14px;color:#aeb0bb;line-height:1.6}footer{text-align:center;color:#7e818d;font-size:12px;padding:26px 0 35px;border-top:1px solid #ffffff14}@media(max-width:650px){.hero{margin-top:45px}.field-row{flex-direction:column}.features{grid-template-columns:1fr}.topbar{gap:15px}.brand{font-size:12px}.back{font-size:12px}}
      `}</style>
    </main>
  );
}
