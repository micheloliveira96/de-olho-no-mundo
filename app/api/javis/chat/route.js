export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const safeMessages = messages
      .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
      .slice(-16)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 5000) }));

    if (!safeMessages.length || !safeMessages.some((message) => message.role === "user")) {
      return Response.json({ error: "Escreve ou diz uma pergunta primeiro." }, { status: 400 });
    }

    // Prefer Groq for speed, then Gemini, then OpenAI as a final configured fallback.
    // Supports the existing Vercel variable name and the conventional uppercase name.
    const providers = [
      {
        name: "Groq",
        key: process.env.GROQ_API_KEY,
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b"
      },
      {
        name: "Gemini",
        key: process.env.GEMINI_API_KEY || process.env.Gemini_API_Key,
        endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
      },
      {
        name: "OpenAI",
        key: process.env.OPENAI_API_KEY,
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: process.env.OPENAI_MODEL || "gpt-4o-mini"
      }
    ].filter((provider) => Boolean(provider.key));

    if (!providers.length) {
      return Response.json(
        { error: "A IA não está configurada. Adiciona GROQ_API_KEY ou GEMINI_API_KEY nas variáveis de ambiente da Vercel." },
        { status: 503 }
      );
    }

    const messagesForAI = [
      {
        role: "system",
        content: "És o JARVIS, um assistente pessoal prestável, claro e natural. Responde sempre em português europeu, salvo pedido contrário. Sê honesto sobre as tuas capacidades. Não afirmes que controlaste o navegador, abriste sites ou reproduziste música a menos que a aplicação confirme essa ação. Se o utilizador pedir música, pesquisa ou imagens, explica que a aplicação pode mostrar resultados no painel integrado."
      },
      ...safeMessages
    ];

    let lastStatus = 502;
    for (const provider of providers) {
      try {
        const response = await fetch(provider.endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: provider.model,
            messages: messagesForAI,
            temperature: 0.7,
            max_tokens: 700
          })
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          const answer = data?.choices?.[0]?.message?.content?.trim();
          if (answer) return Response.json({ answer, provider: provider.name });
          console.error(`${provider.name} returned an empty answer`);
        } else {
          lastStatus = response.status;
          console.error(`${provider.name} API error:`, response.status, data?.error?.type || data?.error?.code || "unknown");
        }
      } catch (error) {
        console.error(`${provider.name} request failed:`, error?.message || "unknown");
      }
      // If one provider is unavailable or out of quota, try the next configured provider.
    }

    return Response.json(
      { error: "Não consegui obter resposta das IAs configuradas. Pode ser um limite temporário ou uma chave inválida; tenta novamente dentro de instantes." },
      { status: lastStatus === 429 ? 429 : 502 }
    );
  } catch (error) {
    console.error("JARVIS chat error:", error?.message || "unknown");
    return Response.json({ error: "Ocorreu um erro ao processar a mensagem." }, { status: 500 });
  }
}
