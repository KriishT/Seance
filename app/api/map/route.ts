import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { DiagnosisResult } from "@/app/api/diagnose/route";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface MapRelationship {
  fromId: string;
  toId: string;
  weight: number;
  type: "influenced_by" | "in_tension_with" | "ancestor_of" | "resolved_by" | "adjacent_to";
}

export interface MapProximity {
  nodeId: string;
  weight: number;
}

export interface MapData {
  relationships: MapRelationship[];
  creatorProximity: MapProximity[];
  briefPull: string[];
}

const SYSTEM = `You are an aesthetic relationship analyst. Given the cultural nodes and precedent works from a creative diagnosis, return a JSON relationship matrix describing how they relate to each other and to the creator's work.

Be precise. Every relationship must be grounded in actual art historical or cultural connections — not guesses.

Return ONLY valid JSON in this exact structure:
{
  "relationships": [
    { "fromId": string, "toId": string, "weight": number (0–1), "type": "influenced_by" | "in_tension_with" | "ancestor_of" | "resolved_by" | "adjacent_to" }
  ],
  "creatorProximity": [
    { "nodeId": string, "weight": number (0–1) }
  ],
  "briefPull": [string]
}

Rules:
- Only include relationships with weight >= 0.35. Omit weak or speculative connections.
- "relationships" should cover node-to-node AND node-to-road connections where real historical links exist.
- "creatorProximity" scores how close the creator's work currently sits to each node/road (1 = very close, 0 = distant).
- "briefPull" is a list of node/road IDs that the Brief mandate is pulling the creator toward — the under-occupied zone.
- Never use em dashes. No markdown. JSON only.`;

function buildContext(result: DiagnosisResult, description: string): string {
  const nodes = result.mirror.nodes
    .map((n) => `  { "id": "${n.id}", "type": "node", "name": "${n.name}", "era": "${n.era}" }`)
    .join(",\n");

  const roads = result.roadsTaken
    .map((r) => `  { "id": "${r.id}", "type": "road", "name": "${r.title} by ${r.creator}", "medium": "${r.medium}" }`)
    .join(",\n");

  return [
    `CREATOR'S WORK: ${description}`,
    ``,
    `THE MANDATE: ${result.brief.thingThatDoesntExist}`,
    ``,
    `ALL NODES AND WORKS:`,
    `[\n${nodes},\n${roads}\n]`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { result, description } = (await req.json()) as {
      result: DiagnosisResult;
      description: string;
    };

    if (!result) {
      return NextResponse.json({ error: "Missing result." }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: buildContext(result, description) }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const mapData: MapData = JSON.parse(clean);

    return NextResponse.json(mapData);
  } catch (err) {
    console.error("[map]", err);
    return NextResponse.json({ error: "Failed to generate map." }, { status: 500 });
  }
}
