export const runtime = "nodejs";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return Response.json({ error: "Indica o nome da música ou artista." }, { status: 400 });
  if (query.length > 180) return Response.json({ error: "A pesquisa é demasiado longa." }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({
      error: "A pesquisa automática do YouTube ainda não está ligada. Adiciona YOUTUBE_API_KEY na Vercel. Entretanto, podes colar um link de vídeo no leitor.",
      searchUrl: "https://www.youtube.com/results?search_query=" + encodeURIComponent(query)
    }, { status: 503 });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("maxResults", "8");
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url, { next: { revalidate: 60 } });
    const data = await response.json();
    if (!response.ok) {
      console.error("YouTube API error:", response.status, data?.error?.errors?.[0]?.reason || "unknown");
      return Response.json({ error: "A pesquisa do YouTube falhou. Verifica a chave, a API YouTube Data API v3 e os limites do projeto Google Cloud." }, { status: 502 });
    }

    const items = (data.items || []).map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title || "Vídeo do YouTube",
      channel: item.snippet?.channelTitle || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      publishedAt: item.snippet?.publishedAt || ""
    })).filter((item) => item.id);

    return Response.json({ items });
  } catch (error) {
    console.error("JARVIS YouTube search error:", error?.message || "unknown");
    return Response.json({ error: "Não foi possível pesquisar no YouTube neste momento." }, { status: 500 });
  }
}
