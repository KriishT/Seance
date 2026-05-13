import type { DiagnosisResult } from "@/app/api/diagnose/route";

export interface DriftSession {
  id: string;
  timestamp: number;
  nodeNames: string[];
  refusals: string[];
  mandate: string;
}

export interface DriftAnalysis {
  persistentNodes: string[];    // appear in 2+ sessions
  droppedNodes: string[];       // appeared before, absent from last session
  recurringRefusals: string[];  // appear in 2+ sessions
  positionRefusal: string | null; // most recurring refusal
  sessions: DriftSession[];
}

const KEY = "seance_sessions";

export function saveDriftSession(result: DiagnosisResult): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const sessions: DriftSession[] = raw ? JSON.parse(raw) : [];
    sessions.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      nodeNames: result.mirror.nodes.map((n) => n.name),
      refusals: result.brief.refusals.map((r) => r.what),
      mandate: result.brief.thingThatDoesntExist,
    });
    // Keep last 20 sessions
    localStorage.setItem(KEY, JSON.stringify(sessions.slice(-20)));
  } catch {
    // localStorage unavailable
  }
}

export function loadDriftSessions(): DriftSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function analyzeDrift(sessions: DriftSession[]): DriftAnalysis {
  if (sessions.length < 2) {
    return { persistentNodes: [], droppedNodes: [], recurringRefusals: [], positionRefusal: null, sessions };
  }

  const lastSession = sessions[sessions.length - 1];
  const priorSessions = sessions.slice(0, -1);

  // Count node appearances across all sessions
  const nodeCount: Record<string, number> = {};
  for (const s of sessions) {
    for (const n of s.nodeNames) {
      nodeCount[n] = (nodeCount[n] ?? 0) + 1;
    }
  }

  // Count refusal appearances
  const refusalCount: Record<string, number> = {};
  for (const s of sessions) {
    for (const r of s.refusals) {
      refusalCount[r] = (refusalCount[r] ?? 0) + 1;
    }
  }

  const persistentNodes = Object.entries(nodeCount)
    .filter(([, count]) => count >= 2)
    .map(([name]) => name);

  const allPriorNodes = new Set(priorSessions.flatMap((s) => s.nodeNames));
  const droppedNodes = [...allPriorNodes].filter(
    (n) => !lastSession.nodeNames.includes(n) && (nodeCount[n] ?? 0) >= 2
  );

  const recurringRefusals = Object.entries(refusalCount)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([r]) => r);

  const positionRefusal = recurringRefusals[0] ?? null;

  return { persistentNodes, droppedNodes, recurringRefusals, positionRefusal, sessions };
}
