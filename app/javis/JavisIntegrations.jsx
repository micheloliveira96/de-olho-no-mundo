"use client";

import { useRef, useState } from "react";

export default function JavisIntegrations() {
  const [alarmTime, setAlarmTime] = useState("");
  const [alarmLabel, setAlarmLabel] = useState("Lembrete do K.E.T.U.R.A.");
  const [alarmStatus, setAlarmStatus] = useState("");
  const alarmTimerRef = useRef(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("");

  async function scheduleAlarm() {
    if (!alarmTime || new Date(alarmTime).getTime() <= Date.now()) {
      setAlarmStatus("Escolhe uma data e hora futuras.");
      return;
    }
    if (typeof window !== "undefined" && window.AndroidAlarm?.setAlarm) {
      try {
        window.AndroidAlarm.setAlarm(alarmLabel || "Lembrete do K.E.T.U.R.A.", new Date(alarmTime).getTime());
        setAlarmStatus("Pedido enviado ao relógio Android.");
      } catch {
        setAlarmStatus("Não foi possível pedir o alarme Android.");
      }
      return;
    }
    if (alarmTimerRef.current) window.clearTimeout(alarmTimerRef.current);
    if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    const delay = new Date(alarmTime).getTime() - Date.now();
    alarmTimerRef.current = window.setTimeout(() => {
      const title = alarmLabel || "Lembrete do K.E.T.U.R.A.";
      if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body: "Está na hora do teu lembrete.", tag: "ketura-alarm" });
      else window.alert(title + "\nEstá na hora do teu lembrete.");
      setAlarmStatus("Lembrete acionado.");
    }, delay);
    setAlarmStatus("Lembrete programado neste separador. Mantém a página aberta; o navegador pode suspender o temporizador.");
  }

  function openWhatsApp() {
    const phone = whatsappPhone.replace(/\\D/g, "");
    const url = "https://wa.me/" + phone + "?text=" + encodeURIComponent(whatsappMessage.trim());
    window.open(url, "_blank", "noopener,noreferrer");
    setWhatsappStatus("O WhatsApp foi aberto para reveres e enviares a mensagem.");
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,320px),1fr))",gap:18,marginTop:18}}>
      <section className="javis-panel">
        <div className="javis-panel-head"><h2>⏰ ALARMES E LEMBRETES</h2><span className="javis-muted">WEB / ANDROID</span></div>
        <div style={{padding:18,display:"grid",gap:11}}>
          <p className="javis-hint">Define uma hora e o K.E.T.U.R.A. tentará avisar-te enquanto esta página estiver aberta. A estrutura já reconhece uma futura ponte Android chamada AndroidAlarm.</p>
          <label className="javis-muted" htmlFor="ji-alarm-label">Nome do alarme</label>
          <input id="ji-alarm-label" className="javis-input" value={alarmLabel} onChange={e => setAlarmLabel(e.target.value)} placeholder="Ex.: Tomar café" />
          <label className="javis-muted" htmlFor="ji-alarm-time">Data e hora</label>
          <input id="ji-alarm-time" className="javis-input" type="datetime-local" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} />
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
            <button type="button" className="javis-btn" onClick={scheduleAlarm}>Programar alarme</button>
            <button type="button" className="javis-secondary" onClick={() => { if (alarmTimerRef.current) window.clearTimeout(alarmTimerRef.current); alarmTimerRef.current = null; setAlarmStatus("Alarme cancelado."); }}>Cancelar</button>
          </div>
          {alarmStatus && <p className="javis-hint" role="status">{alarmStatus}</p>}
          <p className="javis-hint"><strong>Limitação:</strong> no navegador, o alarme não é fiável com o separador fechado ou o dispositivo suspenso. O relógio Android só será acionado depois de criarmos a aplicação nativa e implementarmos essa ponte; este código, por si só, ainda não cria um alarme nativo.</p>
        </div>
      </section>
      <section className="javis-panel">
        <div className="javis-panel-head"><h2>☏ WHATSAPP · CONTA PESSOAL</h2><span className="javis-muted">MENSAGENS</span></div>
        <div style={{padding:18,display:"grid",gap:11}}>
          <p className="javis-hint">Prepara uma mensagem e abre o WhatsApp para a reveres e enviares. Não envia mensagens automaticamente.</p>
          <label className="javis-muted" htmlFor="ji-wa-phone">Número de destino (opcional, com indicativo)</label>
          <input id="ji-wa-phone" className="javis-input" inputMode="tel" value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} placeholder="Ex.: 351912345678" />
          <label className="javis-muted" htmlFor="ji-wa-message">Mensagem</label>
          <textarea id="ji-wa-message" className="javis-input" rows={4} value={whatsappMessage} onChange={e => setWhatsappMessage(e.target.value)} placeholder="Escreve a mensagem que o K.E.T.U.R.A. deve preparar…" />
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
            <button type="button" className="javis-btn" disabled={!whatsappMessage.trim()} onClick={openWhatsApp}>Abrir WhatsApp</button>
            <button type="button" className="javis-secondary" disabled={!whatsappMessage} onClick={async () => { try { await navigator.clipboard.writeText(whatsappMessage); setWhatsappStatus("Mensagem copiada."); } catch { setWhatsappStatus("Não foi possível copiar; seleciona o texto manualmente."); } }}>Copiar mensagem</button>
          </div>
          {whatsappStatus && <p className="javis-hint" role="status">{whatsappStatus}</p>}
          <p className="javis-hint"><strong>Ler conversas:</strong> um site não pode ler diretamente as conversas da tua conta pessoal. Alternativas autorizadas: copiar/partilhar mensagens manualmente para o Javis; numa futura aplicação Android, avaliar acesso a notificações com permissão explícita, que só permite ler o conteúdo que as notificações expõem. A API oficial Business não dá acesso retroativo a todas as conversas pessoais.</p>
        </div>
      </section>
    </div>
  );
}
