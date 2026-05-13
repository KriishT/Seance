const SERPAPI_KEY = process.env.SERPAPI_KEY!;

async function fetchMetImage(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`;
    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const ids: number[] = searchData.objectIDs ?? [];
    if (ids.length === 0) return null;

    // Try the first few results until we find one with a public-domain primary image
    for (const id of ids.slice(0, 2)) {
      const objRes = await fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
        { next: { revalidate: 86400 } }
      );
      if (!objRes.ok) continue;
      const obj = await objRes.json();
      if (obj.primaryImage && obj.primaryImage.startsWith("https://")) {
        return obj.primaryImage;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchSerpImage(query: string): Promise<string | null> {
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

    for (const img of results.slice(0, 5)) {
      if (img.original && img.original.startsWith("http")) return img.original;
    }
    for (const img of results.slice(0, 5)) {
      if (img.thumbnail && img.thumbnail.startsWith("http")) return img.thumbnail;
    }
    return null;
  } catch {
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((res) => setTimeout(() => res(null), ms))]);
}

// Mirror nodes are art-historical — try Met first, fall back to Serp
export async function fetchMirrorImage(query: string): Promise<string | null> {
  const met = await withTimeout(fetchMetImage(query), 8000);
  if (met) return met;
  return withTimeout(fetchSerpImage(query), 8000);
}

// Roads entries span music/film/fashion — SerpAPI only
export async function fetchRoadImage(query: string): Promise<string | null> {
  return withTimeout(fetchSerpImage(query), 8000);
}
