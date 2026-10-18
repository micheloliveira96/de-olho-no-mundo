export const metadata = {
  title: "Anúncios | De Olho no Mundo",
  description: "Espaço independente para gerir anúncios."
};

const features = [
  { number: "01", title: "Criar anúncio", text: "Prepara o texto, imagem ou vídeo e a chamada para ação." },
  { number: "02", title: "Definir público", text: "Organiza localização, público e objetivo da campanha." },
  { number: "03", title: "Orçamento e duração", text: "Define quanto queres investir e durante quanto tempo." },
  { number: "04", title: "Rever e publicar", text: "Confere os detalhes antes de enviar a campanha para a Meta." }
];

export default function AnunciosPage() {
  return (
    <main className="adsStandalone">
      <header className="adsStandaloneHeader">
        <a className="adsStandaloneLogo" href="/" aria-label="De Olho no Mundo">
          <span className="adsLogoMark">◉</span>
          <span>DE OLHO <small>NO MUNDO</small></span>
        </a>
        <span className="adsPrivateLabel"><i /> ESPAÇO INDEPENDENTE</span>
      </header>

      <section className="adsStandaloneHero">
        <div className="adsHeroCopy">
          <p className="adsEyebrow"><span /> PUBLICIDADE SIMPLIFICADA</p>
          <h1>Os teus anúncios.<br /><em>Sem complicação.</em></h1>
          <p className="adsHeroText">Um espaço próprio para preparar, organizar e acompanhar campanhas publicitárias, com uma experiência mais simples e direta.</p>
          <div className="adsHeroActions">
            <button type="button" className="adsStartButton" disabled title="A integração será ativada numa próxima etapa">Começar a criar anúncios <span>↗</span></button>
            <span className="adsComingSoon">Área em preparação</span>
          </div>
          <div className="adsMetaNote"><span className="adsMetaMark">f</span><span><strong>Integração planeada com a Meta</strong><small>As campanhas serão ligadas à tua própria conta de anúncios, após configuração e autorização oficiais.</small></span></div>
        </div>
        <div className="adsPreview" aria-label="Pré-visualização ilustrativa da área de anúncios">
          <div className="adsPreviewTop"><span>PAINEL DE CAMPANHAS</span><span className="adsPreviewDots">•••</span></div>
          <div className="adsPreviewMetric"><span>Campanhas</span><strong>— —</strong><small>Os teus anúncios aparecerão aqui</small></div>
          <div className="adsPreviewBars"><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="adsPreviewFooter"><span><i /> Conta Meta não ligada</span><b>Configuração pendente</b></div>
        </div>
      </section>

      <section className="adsFeatures">
        <div className="adsSectionHeading"><p className="adsEyebrow">COMO VAI FUNCIONAR</p><h2>Da ideia à campanha.</h2><p>Quatro passos, num só espaço.</p></div>
        <div className="adsFeatureGrid">
          {features.map(feature => <article className="adsFeature" key={feature.number}><span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}
        </div>
      </section>
      <footer className="adsStandaloneFooter">DE OLHO NO MUNDO <span>·</span> MÓDULO DE PUBLICIDADE INDEPENDENTE</footer>
    </main>
  );
}
