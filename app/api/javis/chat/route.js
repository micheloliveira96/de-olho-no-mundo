export const runtime = "nodejs";

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "A inteligência artificial ainda não está ligada. Adiciona OPENAI_API_KEY nas variáveis de ambiente da Vercel." },
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
      console.error("OpenAI API error:", response.status, data?.error?.type || data?.error?.code || "unknown");
      return Response.json(
        { error: response.status === 429 ? "O serviço de IA atingiu um limite de utilização. Tenta novamente mais tarde." : "Não foi possível obter resposta da IA. Verifica a chave e a configuração do serviço." },
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
