const SERPAPI_KEY = process.env.SERPAPI_KEY!;

export async function fetchNodeImage(query: string): Promise<string | null> {
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("tbm", "isch");
    url.searchParams.set("num", "5");
    url.searchParams.set("api_key", SERPAPI_KEY);
    url.searchParams.set("safe", "off");

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const results: { original?: string; thumbnail?: string }[] =
      data.images_results ?? [];

    // Prefer a result with an original high-res image, skip tiny thumbnails
    for (const img of results.slice(0, 5)) {
      if (img.original && img.original.startsWith("http")) {
        return img.original;
      }
    }
    // Fallback to thumbnail
    for (const img of results.slice(0, 5)) {
      if (img.thumbnail && img.thumbnail.startsWith("http")) {
        return img.thumbnail;
      }
    }
    return null;
  } catch {
    return null;
  }
}
