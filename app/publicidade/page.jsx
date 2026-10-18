import Link from "next/link";

export const metadata = {
  title: "Publicidade Meta | De Olho no Mundo",
  description: "Área de preparação para integrar a Meta Marketing API."
};

export default function PublicidadePage() {
  const checks = [
    { title: "Criar a aplicação Meta", detail: "No Meta for Developers, cria uma aplicação para a tua empresa/uso próprio e adiciona o produto Marketing API.", state: "A fazer" },
    { title: "Guardar as credenciais no Vercel", detail: "Depois de criar a aplicação, guardar META_APP_ID, META_APP_SECRET e META_REDIRECT_URI nas variáveis de ambiente do projeto. Nunca no código nem no navegador.", state: "A seguir" },
    { title: "Configurar o OAuth e permissões", detail: "Implementar o início de sessão oficial e pedir apenas as permissões necessárias, começando por ads_read e ads_management para a tua própria conta.", state: "Pendente" },
    { title: "Ler a conta de anúncios", detail: "Testar a ligação e listar as contas acessíveis antes de ativar qualquer criação de campanha.", state: "Pendente" }
  ];

  return (
    <main className="metaSetupPage">
      <header className="metaSetupTop">
        <Link href="/" className="metaBack">← Voltar ao painel</Link>
        <span className="metaSetupBrand">DE OLHO NO MUNDO <i> / PUBLICIDADE</i></span>
      </header>
      <section className="metaSetupContent">
        <p className="metaEyebrow"><span /> INTEGRAÇÃO OFICIAL</p>
        <h1>Os teus anúncios.<br /><em>Num só lugar.</em></h1>
        <p className="metaLead">Vamos preparar a ligação segura ao Gestor de Anúncios da Meta. Esta área é o início da integração; ainda não publica anúncios nem acede à tua conta.</p>
        <div className="metaStatus"><span className="metaStatusDot" /><div><strong>Ligação ainda não configurada</strong><small>Primeiro precisamos de registar a aplicação no portal oficial da Meta.</small></div></div>
        <a className="metaPrimary" href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Abrir Meta for Developers <span>↗</span></a>
        <section className="metaChecklist">
          <div className="metaSectionTitle"><div><h2>Preparação da integração</h2><p>Faremos um passo de cada vez e testaremos antes de publicar.</p></div><span>PASSO 1 / 4</span></div>
          {checks.map((item, index) => (
            <article className="metaCheck" key={item.title}>
              <span className={index === 0 ? "metaCheckNum active" : "metaCheckNum"}>{index + 1}</span>
              <div><h3>{item.title}</h3><p>{item.detail}</p></div>
              <small>{item.state}</small>
            </article>
          ))}
        </section>
        <aside className="metaSafety"><strong>Segurança</strong><p>Não coloques aqui tokens, palavras-passe ou o App Secret. As credenciais serão guardadas apenas nas variáveis privadas do Vercel, e nunca enviadas para o navegador.</p></aside>
        <p className="metaFooter">A publicação de campanhas só será ativada depois de a autorização oficial funcionar e a conta de anúncios ser confirmada. O orçamento e a faturação permanecem na Meta.</p>
      </section>
    </main>
  );
}
