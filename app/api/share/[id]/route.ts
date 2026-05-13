import { NextRequest, NextResponse } from "next/server";
import { getShare } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = getShare(id);
  if (!data) {
    return NextResponse.json({ error: "Reading not found." }, { status: 404 });
  }
  return NextResponse.json(data);
}
