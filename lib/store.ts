import type { DiagnosisResult } from "@/app/api/diagnose/route";

export interface SharePayload {
  brief: DiagnosisResult["brief"];
}

// Module-level store — persists for the lifetime of the process
const store = new Map<string, SharePayload>();

export function saveShare(id: string, data: SharePayload): void {
  store.set(id, data);
}

export function getShare(id: string): SharePayload | null {
  return store.get(id) ?? null;
}
