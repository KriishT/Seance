function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((res) => setTimeout(() => res(null), ms))]);
}

async function fetchSerpImage(query: string): Promise<string | null> {
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&num=3&api_key=${process.env.SERPAPI_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[images] SerpAPI ${res.status} for "${query}"`);
      return null;
    }
    const data = await res.json();
    const results: { original?: string; thumbnail?: string }[] = data.images_results ?? [];
    if (!results.length) {
      console.log(`[images] SerpAPI: no results for "${query}"`);
      return null;
    }
    const img = results[0];
    const url2 = img.original ?? img.thumbnail ?? null;
    console.log(`[images] SerpAPI: found image for "${query}"`);
    return url2;
  } catch (err) {
    console.error(`[images] SerpAPI error for "${query}":`, err);
    return null;
  }
}

export async function fetchMirrorImage(query: string): Promise<string | null> {
  return withTimeout(fetchSerpImage(query), 15000);
}

export async function fetchRoadImage(query: string): Promise<string | null> {
  return withTimeout(fetchSerpImage(query), 15000);
}
