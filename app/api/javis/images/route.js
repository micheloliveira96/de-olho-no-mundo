export const runtime = "nodejs";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return Response.json({ error: "Indica o que queres ver." }, { status: 400 });
  if (query.length > 150) return Response.json({ error: "A pesquisa é demasiado longa." }, { status: 400 });

  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", "8");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|extmetadata");
    url.searchParams.set("iiurlwidth", "600");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url, {
      headers: { "User-Agent": "JARVISBrowserAssistant/1.0 (image search)" },
      next: { revalidate: 300 }
    });
    if (!response.ok) return Response.json({ error: "A pesquisa de imagens não está disponível neste momento." }, { status: 502 });
    const data = await response.json();
    const items = Object.values(data?.query?.pages || {}).map((page) => {
      const info = page.imageinfo?.[0];
      return {
        title: page.title?.replace(/^File:/, "") || "Imagem",
        url: info?.thumburl || info?.url || "",
        pageUrl: info?.descriptionurl || "",
        license: info?.extmetadata?.LicenseShortName?.value || "Licença a confirmar"
      };
    }).filter((item) => item.url);
    return Response.json({ items });
  } catch (error) {
    console.error("JARVIS image search error:", error?.message || "unknown");
    return Response.json({ error: "Não foi possível pesquisar imagens neste momento." }, { status: 500 });
  }
}
