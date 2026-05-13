import { NextRequest, NextResponse } from "next/server";
import { fetchMirrorImage, fetchRoadImage } from "@/lib/images";

export const maxDuration = 60;

interface ImageQuery {
  id: string;
  query: string;
  kind: "mirror" | "road";
}

export async function POST(req: NextRequest) {
  try {
    const { queries }: { queries: ImageQuery[] } = await req.json();

    const results = await Promise.all(
      queries.map(async ({ id, query, kind }) => ({
        id,
        imageUrl: kind === "mirror"
          ? await fetchMirrorImage(query)
          : await fetchRoadImage(query),
      }))
    );

    return NextResponse.json({ images: results });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
