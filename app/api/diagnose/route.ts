import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { DIAGNOSIS_SYSTEM_PROMPT } from "@/lib/prompt";
import { fetchMirrorImage, fetchRoadImage } from "@/lib/images";
import { saveShare } from "@/lib/store";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface MirrorNode {
  id: string;
  name: string;
  era: string;
  paragraph: string;
  imageQuery: string;
  imageUrl: string | null;
}

export interface RoadEntry {
  id: string;
  title: string;
  creator: string;
  year: string;
  medium: "visual art" | "music" | "film" | "fashion" | "writing/zine";
  whatTheyMade: string;
  theyChose: string;
  imageQuery: string;
  imageUrl: string | null;
}

export interface BriefRefusal {
  what: string;
  because: string;
}

export interface ForkOption {
  id: string;
  name: string;
  description: string;
  signal: string;
}

export interface DiagnosisResult {
  isVague: boolean;
  vaguenessQuestion: string | null;
  isFork?: boolean;
  forkOptions?: ForkOption[] | null;
  mirror: {
    nodes: MirrorNode[];
  };
  roadsTaken: RoadEntry[];
  brief: {
    thingThatDoesntExist: string;
    includes: string[];
    refusals: BriefRefusal[];
    whyYou: string;
    provenanceNote: string;
  };
  shareId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const description = formData.get("description") as string;
    const friction = (formData.get("friction") as string | null) ?? "";

    const imageFiles: File[] = [];
    for (let i = 0; i < 4; i++) {
      const file = formData.get(`image_${i}`) as File | null;
      if (file && file.size > 0) imageFiles.push(file);
    }

    if (!description || imageFiles.length === 0) {
      return NextResponse.json(
        { error: "A description and at least one image are required." },
        { status: 400 }
      );
    }

    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 30) {
      return NextResponse.json(
        { error: "Description must be 30 words or fewer." },
        { status: 400 }
      );
    }

    const imageBlocks = await Promise.all(
      imageFiles.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buf = Buffer.from(bytes);
        // Detect actual format from magic bytes, ignore file.type
        let media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
        if (buf[0] === 0x89 && buf[1] === 0x50) media_type = "image/png";
        else if (buf[0] === 0x47 && buf[1] === 0x49) media_type = "image/gif";
        else if (buf[0] === 0x52 && buf[1] === 0x49) media_type = "image/webp";
        return {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type,
            data: buf.toString("base64"),
          },
        };
      })
    );

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 8000,
      system: DIAGNOSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: [
                `What they are making: ${description}`,
                imageFiles.length > 1 ? `(${imageFiles.length} images — read them as a single body of work)` : "",
                friction ? `What bothers them about it: ${friction}` : "",
              ].filter(Boolean).join("\n\n"),
            },
          ],
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: DiagnosisResult;
    try {
      const clean = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse diagnosis. Please try again." },
        { status: 500 }
      );
    }

    if (parsed.isVague) {
      return NextResponse.json(parsed);
    }

    if (parsed.isFork && parsed.forkOptions?.length) {
      return NextResponse.json(parsed);
    }

    // Fetch archival images for mirror nodes and roads in parallel
    // Mirror nodes: Met API first (art-historical), falls back to SerpAPI
    // Roads: SerpAPI only (spans music/film/fashion)
    const [nodesWithImages, roadsWithImages] = await Promise.all([
      Promise.all(
        parsed.mirror.nodes.map(async (node) => ({
          ...node,
          imageUrl: await fetchMirrorImage(node.imageQuery),
        }))
      ),
      Promise.all(
        parsed.roadsTaken.map(async (entry) => ({
          ...entry,
          imageUrl: await fetchRoadImage(entry.imageQuery),
        }))
      ),
    ]);

    const shareId = crypto.randomUUID();
    saveShare(shareId, { brief: parsed.brief });

    return NextResponse.json({
      ...parsed,
      mirror: { nodes: nodesWithImages },
      roadsTaken: roadsWithImages,
      shareId,
    });
  } catch (err) {
    console.error("[diagnose]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
