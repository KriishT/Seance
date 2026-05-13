function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([promise, new Promise<null>((res) => setTimeout(() => res(null), ms))]);
}

async function fetchGoogleImage(query: string): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_CSE_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    // thumbnailLink is Google-proxied — no hotlink blocking
    return item?.image?.thumbnailLink ?? item?.link ?? null;
  } catch {
    return null;
  }
}

export async function fetchMirrorImage(query: string): Promise<string | null> {
  return withTimeout(fetchGoogleImage(query), 5000);
}

export async function fetchRoadImage(query: string): Promise<string | null> {
  return withTimeout(fetchGoogleImage(query), 5000);
}
