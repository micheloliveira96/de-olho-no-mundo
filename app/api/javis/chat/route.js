export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Prefer the free-tier Groq API when configured; keep OpenAI as a fallback.
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const useGroq = Boolean(groqKey);
    const apiKey = useGroq ? groqKey : openaiKey;

    if (!apiKey) {
      return Response.json(
        { error: "A IA ainda não está ligada. Cria uma chave no Groq Console e adiciona GROQ_API_KEY nas variáveis de ambiente da Vercel." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const safeMessages = messages
      .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
      .slice(-16)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 5000) }));

    if (!safeMessages.length || !safeMessages.some((message) => message.role === "user")) {
      return Response.json({ error: "Escreve ou diz uma pergunta primeiro." }, { status: 400 });
    }

    const endpoint = useGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = useGroq
      ? (process.env.GROQ_MODEL || "openai/gpt-oss-120b")
      : (process.env.OPENAI_MODEL || "gpt-4o-mini");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "És o JARVIS, um assistente pessoal prestável, claro e natural. Responde sempre em português europeu, salvo pedido contrário. Sê honesto sobre as tuas capacidades. Não afirmes que controlaste o navegador, abriste sites ou reproduziste música a menos que a aplicação confirme essa ação. Se o utilizador pedir música, pesquisa ou imagens, explica que a aplicação pode mostrar resultados no painel integrado."
          },
          ...safeMessages
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`${useGroq ? "Groq" : "OpenAI"} API error:`, response.status, data?.error?.type || data?.error?.code || "unknown");
      return Response.json(
        { error: response.status === 429
          ? (useGroq
            ? "O limite gratuito da IA foi atingido. Aguarda a reposição da quota ou tenta novamente mais tarde."
            : "A quota da OpenAI está esgotada. Configura GROQ_API_KEY na Vercel para usar a alternativa gratuita.")
          : "Não foi possível obter resposta da IA. Verifica a chave e a configuração do serviço." },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) return Response.json({ error: "A IA devolveu uma resposta vazia. Tenta novamente." }, { status: 502 });
    return Response.json({ answer });
  } catch (error) {
    console.error("JARVIS chat error:", error?.message || "unknown");
    return Response.json({ error: "Ocorreu um erro ao processar a mensagem." }, { status: 500 });
  }
}
