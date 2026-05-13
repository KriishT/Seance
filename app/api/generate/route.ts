import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { DiagnosisResult } from "@/app/api/diagnose/route";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type GenerateType = "statement" | "collaborator" | "scaledown";

const SYSTEM_PROMPTS: Record<GenerateType, string> = {
  statement: `You write artist statements. Given a creative diagnosis, write a 150-word first-person artist statement. Rules: name the aesthetic territory without using trend language; cite the cultural lineage honestly; reference what the work refuses and why that refusal matters; end with what the work is reaching toward. Write as if the artist wrote it themselves. No clichés. No phrases like "exploring", "investigating", "in dialogue with", "unpacking", or "interrogating". Sound like a person, not a press release. Never use em dashes. Return only the statement text, no headers, no quotes around it.`,

  collaborator: `You reformat creative briefs for professional collaboration. Given a creative diagnosis, write a third-person document for a specific collaborator — printer, gallerist, photographer, or creative director. Keep all the specific details from the brief. Structure: what the project is (one sentence), what it includes (bullet list), what it refuses to do (bullet list), and a one-paragraph note on the aesthetic territory and lineage. Professional but not corporate. No flattery. No jargon. Never use em dashes. Return only the document text, no headers wrapping it.`,

  scaledown: `You generate adjacent micro-projects. Given a creative brief that feels too large to start, generate a weekend project — completable in 2 to 3 days by one person working alone — that lives in the same aesthetic territory and practices the same refusals. Same direction, smaller scope. Be specific about the medium, the format, and the exact output. One paragraph. This is a gateway into the larger project, not a replacement for it. Never use em dashes. Return only the project description, no headers.`,
};

function buildContext(result: DiagnosisResult): string {
  const nodes = result.mirror.nodes
    .map((n) => `${n.name} (${n.era})`)
    .join(", ");

  const refusals = result.brief.refusals
    .map((r) => `- ${r.what}: ${r.because}`)
    .join("\n");

  const includes = result.brief.includes.map((s) => `- ${s}`).join("\n");

  return [
    `THE MANDATE: ${result.brief.thingThatDoesntExist}`,
    ``,
    `CULTURAL NODES: ${nodes}`,
    ``,
    `IT INCLUDES:\n${includes}`,
    ``,
    `IT REFUSES:\n${refusals}`,
    ``,
    `WHY THIS CREATOR: ${result.brief.whyYou}`,
    ``,
    `LINEAGE: ${result.brief.provenanceNote}`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { type, result } = (await req.json()) as {
      type: GenerateType;
      result: DiagnosisResult;
    };

    if (!type || !result) {
      return NextResponse.json({ error: "Missing type or result." }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    if (!systemPrompt) {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: buildContext(result) }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[generate]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
