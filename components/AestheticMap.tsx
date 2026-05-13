"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DiagnosisResult } from "@/app/api/diagnose/route";
import type { MapData, MapRelationship } from "@/app/api/map/route";

interface Props {
  result: DiagnosisResult;
  description: string;
}

interface SimNode {
  id: string;
  label: string;
  fullLabel: string;
  kind: "creator" | "node" | "road";
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
  proximityWeight: number;
  isBriefPull: boolean;
  accent: string;
  accentDim: string;
}

const W = 1100;
const H = 620;
const MIN_DIST = 90;

const NODE_ACCENTS = [
  { fill: "#8A7FA0", dim: "rgba(138,127,160,0.15)" },
  { fill: "#9A7575", dim: "rgba(154,117,117,0.15)" },
  { fill: "#6A8A72", dim: "rgba(106,138,114,0.15)" },
  { fill: "#9A8050", dim: "rgba(154,128,80,0.15)" },
  { fill: "#8A7FA0", dim: "rgba(138,127,160,0.15)" },
];

const TYPE_COLORS: Record<string, string> = {
  influenced_by:    "#8A7FA0",
  in_tension_with:  "#9A7575",
  ancestor_of:      "#6A8A72",
  resolved_by:      "#9A8050",
  adjacent_to:      "#6B6560",
};

function runSimulation(nodes: SimNode[], edges: MapRelationship[]): SimNode[] {
  const ns = nodes.map((n) => ({ ...n }));
  const k = Math.sqrt((W * H) / (ns.length * 0.6));

  for (let iter = 0; iter < 400; iter++) {
    const cool = Math.pow(1 - iter / 400, 1.4);

    for (let i = 0; i < ns.length; i++) {
      ns[i].vx = 0;
      ns[i].vy = 0;
      for (let j = 0; j < ns.length; j++) {
        if (i === j) continue;
        const dx = ns[i].x - ns[j].x;
        const dy = ns[i].y - ns[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        // Extra push if too close
        const effective = dist < MIN_DIST ? MIN_DIST * 2 : dist;
        const force = (k * k) / effective;
        ns[i].vx += (dx / dist) * force;
        ns[i].vy += (dy / dist) * force;
      }
    }

    for (const edge of edges) {
      const src = ns.find((n) => n.id === edge.fromId);
      const tgt = ns.find((n) => n.id === edge.toId);
      if (!src || !tgt) continue;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
      const ideal = k * (1.4 - edge.weight * 0.9);
      const force = ((dist - ideal) / dist) * 0.14;
      const fx = dx * force;
      const fy = dy * force;
      if (!src.fixed) { src.x += fx; src.y += fy; }
      if (!tgt.fixed) { tgt.x -= fx; tgt.y -= fy; }
    }

    for (const n of ns) {
      if (n.fixed) continue;
      n.vx += (W / 2 - n.x) * 0.006;
      n.vy += (H / 2 - n.y) * 0.006;
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy) || 0.001;
      const capped = Math.min(speed, 14 * cool);
      n.x += (n.vx / speed) * capped;
      n.y += (n.vy / speed) * capped;
      n.x = Math.max(120, Math.min(W - 120, n.x));
      n.y = Math.max(80, Math.min(H - 80, n.y));
    }
  }
  return ns;
}

export default function AestheticMap({ result, description }: Props) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, string | null>>({});
  const fetchedRef = useRef(false);
  const imagesFetchedRef = useRef(false);

  const fetchMap = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, description }),
      });
      const data: MapData = await res.json();
      setMapData(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [result, description]);

  useEffect(() => { fetchMap(); }, [fetchMap]);

  useEffect(() => {
    if (imagesFetchedRef.current) return;
    imagesFetchedRef.current = true;
    const queries = [
      ...result.mirror.nodes.map((n) => ({ id: n.id, query: n.imageQuery, kind: "mirror" as const })),
      ...result.roadsTaken.map((r) => ({ id: r.id, query: r.imageQuery, kind: "road" as const })),
    ];
    fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries }),
    })
      .then((r) => r.json())
      .then(({ images }: { images: { id: string; imageUrl: string | null }[] }) => {
        const map: Record<string, string | null> = {};
        images.forEach(({ id, imageUrl }) => { map[id] = imageUrl; });
        setImageMap(map);
      })
      .catch(() => {});
  }, [result]);

  useEffect(() => {
    if (!mapData) return;
    const raw: SimNode[] = [
      {
        id: "creator", label: "Your work", fullLabel: "Your work",
        kind: "creator",
        x: W / 2, y: H / 2, vx: 0, vy: 0, fixed: true,
        proximityWeight: 1, isBriefPull: false,
        accent: "#F0EDE8", accentDim: "rgba(240,237,232,0.1)",
      },
    ];

    result.mirror.nodes.forEach((n, i) => {
      const angle = (i / result.mirror.nodes.length) * Math.PI * 2 - Math.PI / 2;
      const prox = mapData.creatorProximity.find((p) => p.nodeId === n.id)?.weight ?? 0.5;
      const r = 100 + (1 - prox) * 180;
      const ac = NODE_ACCENTS[i % NODE_ACCENTS.length];
      raw.push({
        id: n.id,
        label: n.name.length > 22 ? n.name.slice(0, 20) + "…" : n.name,
        fullLabel: n.name,
        kind: "node",
        x: W / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 60,
        y: H / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 60,
        vx: 0, vy: 0, fixed: false,
        proximityWeight: prox,
        isBriefPull: mapData.briefPull.includes(n.id),
        accent: ac.fill, accentDim: ac.dim,
      });
    });

    result.roadsTaken.forEach((r, i) => {
      const angle = (i / result.roadsTaken.length) * Math.PI * 2 + Math.PI / 6;
      const prox = mapData.creatorProximity.find((p) => p.nodeId === r.id)?.weight ?? 0.25;
      const radius = 200 + (1 - prox) * 140;
      raw.push({
        id: r.id,
        label: r.title.length > 18 ? r.title.slice(0, 16) + "…" : r.title,
        fullLabel: r.title,
        kind: "road",
        x: W / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 70,
        y: H / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 70,
        vx: 0, vy: 0, fixed: false,
        proximityWeight: prox,
        isBriefPull: mapData.briefPull.includes(r.id),
        accent: "#5A5550", accentDim: "rgba(90,85,80,0.2)",
      });
    });

    const settled = runSimulation(raw, mapData.relationships);
    setNodes(settled);
    setTimeout(() => setReady(true), 80);
  }, [mapData, result]);

  const selectedNode = nodes.find((n) => n.id === selectedId);
  const mirrorNode = selectedId ? result.mirror.nodes.find((n) => n.id === selectedId) : null;
  const roadEntry = selectedId ? result.roadsTaken.find((r) => r.id === selectedId) : null;

  // Related items from relationship data
  const relatedIds = mapData?.relationships
    .filter((r) => r.fromId === selectedId || r.toId === selectedId)
    .map((r) => (r.fromId === selectedId ? r.toId : r.fromId)) ?? [];
  const relatedNodes = nodes.filter((n) => relatedIds.includes(n.id) && n.id !== "creator");

  // Study references for a node: roads that are related to it
  const studyRefs = mirrorNode
    ? result.roadsTaken.filter((r) => relatedIds.includes(r.id)).slice(0, 3)
    : [];

  const r = (n: SimNode) => n.kind === "creator" ? 20 : n.kind === "node" ? 13 : 8;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <motion.p
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="font-serif text-2xl italic text-charcoal/60"
        >
          Mapping your aesthetic field
        </motion.p>
        <p className="text-[9px] font-sans uppercase tracking-[0.25em] text-muted">
          plotting {result.mirror.nodes.length + result.roadsTaken.length} cultural references
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="font-sans text-xs uppercase tracking-widest text-muted/50">Could not generate map</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/60">The Map</p>
          <p className="text-charcoal/70 font-serif text-base">
            Your work positioned in aesthetic space. Click any node to explore.
          </p>
        </div>
        {selectedId && selectedId !== "creator" && (
          <button
            onClick={() => setSelectedId(null)}
            className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50 hover:text-muted transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 items-center">
        {[
          { color: "#F0EDE8", label: "Your work", size: 10 },
          { color: "#8A7FA0", label: "Cultural node", size: 9 },
          { color: "#5A5550", label: "Precedent work", size: 7 },
          { color: "#6A8A72", label: "Brief direction", size: 9, ring: true },
        ].map(({ color, label, size, ring }) => (
          <div key={label} className="flex items-center gap-2">
            <svg width={18} height={18} viewBox="0 0 18 18">
              {ring && <circle cx={9} cy={9} r={8} fill="none" stroke="#6A8A72" strokeWidth={1.2} strokeDasharray="2.5 2" />}
              <circle cx={9} cy={9} r={size / 2} fill={color} />
            </svg>
            <span className="text-[11px] font-sans text-muted/70 uppercase tracking-[0.15em]">{label}</span>
          </div>
        ))}
        <div className="flex flex-wrap gap-5 ml-auto">
          {Object.entries(TYPE_COLORS).filter(([, c]) => c !== "#3D3A35").map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-6 h-px" style={{ background: color, display: "inline-block" }} />
              <span className="text-[10px] font-sans text-muted/80 tracking-wide">{type.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Canvas — full width */}
      <div
        className="border border-wire overflow-hidden cursor-crosshair"
        onClick={() => setSelectedId(null)}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block", background: "#0F0D0B" }}
        >
          {/* Grid */}
          <defs>
            <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(240,237,232,0.03)" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="center-glow" cx="50%" cy="50%" r="30%">
              <stop offset="0%" stopColor="rgba(240,237,232,0.04)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#map-grid)" />
          <ellipse cx={W / 2} cy={H / 2} rx={W * 0.35} ry={H * 0.35} fill="url(#center-glow)" />

          {/* Edges */}
          {ready && mapData && mapData.relationships.map((rel, i) => {
            const src = nodes.find((n) => n.id === rel.fromId);
            const tgt = nodes.find((n) => n.id === rel.toId);
            if (!src || !tgt) return null;
            const isActive = selectedId && (rel.fromId === selectedId || rel.toId === selectedId);
            const color = TYPE_COLORS[rel.type] ?? "#3D3A35";
            return (
              <motion.line
                key={i}
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={color}
                strokeWidth={isActive ? 1.5 : 0.6 + rel.weight * 0.6}
                strokeOpacity={isActive ? 0.8 : selectedId ? 0.12 : 0.2 + rel.weight * 0.3}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.2 + i * 0.03 }}
                style={{ transition: "stroke-opacity 0.3s, stroke-width 0.3s" }}
              />
            );
          })}

          {/* Brief pull dashed direction vector */}
          {ready && (() => {
            const pulls = nodes.filter((n) => n.isBriefPull && n.kind !== "creator");
            const creator = nodes.find((n) => n.id === "creator");
            if (!pulls.length || !creator) return null;
            const cx = pulls.reduce((s, n) => s + n.x, 0) / pulls.length;
            const cy = pulls.reduce((s, n) => s + n.y, 0) / pulls.length;
            const dx = cx - creator.x;
            const dy = cy - creator.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const endX = creator.x + (dx / len) * (len - 28);
            const endY = creator.y + (dy / len) * (len - 28);
            return (
              <motion.line
                x1={creator.x} y1={creator.y} x2={endX} y2={endY}
                stroke="rgba(106,138,114,0.6)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
              />
            );
          })()}

          {/* Brief pull halos */}
          {ready && nodes.filter((n) => n.isBriefPull && n.kind !== "creator").map((n) => (
            <motion.circle
              key={`halo-${n.id}`}
              cx={n.x} cy={n.y}
              r={r(n) + 12}
              fill="none"
              stroke="rgba(106,138,114,0.3)"
              strokeWidth={1}
              strokeDasharray="3 2"
              animate={{ r: [r(n) + 10, r(n) + 16, r(n) + 10] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          {/* Nodes */}
          {ready && nodes.map((node, i) => {
            const radius = r(node);
            const isSelected = selectedId === node.id;
            const isDimmed = selectedId && !isSelected && !relatedIds.includes(node.id) && node.id !== "creator";
            const showLabel = node.kind === "creator" || node.kind === "node" || node.kind === "road";

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: isDimmed ? 0.2 : 1,
                  scale: 1,
                }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: `${node.x}px ${node.y}px`, cursor: node.kind !== "creator" ? "pointer" : "default" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.kind !== "creator") setSelectedId(isSelected ? null : node.id);
                }}
              >
                {/* Glow behind selected */}
                {isSelected && (
                  <circle
                    cx={node.x} cy={node.y}
                    r={radius + 16}
                    fill={node.accentDim}
                  />
                )}

                {/* Node fill */}
                <circle
                  cx={node.x} cy={node.y}
                  r={isSelected ? radius + 3 : radius}
                  fill={node.accent}
                  stroke={node.kind === "road" ? "rgba(240,237,232,0.12)" : "transparent"}
                  strokeWidth={1}
                  style={{ transition: "r 0.2s ease, fill 0.2s ease" }}
                />

                {/* Label with background */}
                {showLabel && (
                  <>
                    <rect
                      x={node.x - (node.label.length * 3.5)}
                      y={node.y + radius + 6}
                      width={node.label.length * 7}
                      height={14}
                      fill="rgba(10,9,8,0.75)"
                      rx={2}
                    />
                    <text
                      x={node.x}
                      y={node.y + radius + 16}
                      textAnchor="middle"
                      fontSize={node.kind === "creator" ? 11 : 10}
                      fill={isSelected ? "#F0EDE8" : node.kind === "creator" ? "rgba(240,237,232,0.9)" : "rgba(240,237,232,0.65)"}
                      fontStyle={node.kind === "creator" ? "italic" : "normal"}
                      fontFamily="'EB Garamond', Georgia, serif"
                    >
                      {node.label}
                    </text>
                  </>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Node detail panel */}
      <AnimatePresence mode="wait">
        {selectedNode && selectedNode.kind !== "creator" && (
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border border-wire bg-surface grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden"
          >
            {/* Image column */}
            {(imageMap[selectedId!] || (!Object.keys(imageMap).length && (mirrorNode?.imageUrl || roadEntry?.imageUrl))) && (
              <div className="md:col-span-1 bg-void">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageMap[selectedId!] ?? mirrorNode?.imageUrl ?? roadEntry?.imageUrl ?? ""}
                  alt={selectedNode.fullLabel}
                  className="w-full h-full object-cover opacity-70"
                  style={{ minHeight: "200px", maxHeight: "320px" }}
                />
              </div>
            )}

            {/* Content column */}
            <div className={`${(mirrorNode?.imageUrl || roadEntry?.imageUrl) ? "md:col-span-2" : "md:col-span-3"} p-8 space-y-6`}>
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/60 mb-1">
                      {mirrorNode ? `Cultural node · ${mirrorNode.era}` : roadEntry ? `${roadEntry.medium} · ${roadEntry.year}` : ""}
                    </p>
                    <p className="font-serif text-xl text-charcoal leading-tight">
                      {selectedNode.fullLabel}
                    </p>
                    {roadEntry && (
                      <p className="font-sans text-xs text-muted mt-1">{roadEntry.creator}</p>
                    )}
                  </div>
                  {selectedNode.isBriefPull && (
                    <span className="text-[8px] font-sans uppercase tracking-[0.15em] text-sage border border-sage px-2 py-1 flex-shrink-0">
                      Brief direction
                    </span>
                  )}
                </div>
              </div>

              {/* Main description */}
              {mirrorNode && (
                <p className="font-serif text-sm text-charcoal/80 leading-relaxed">
                  {mirrorNode.paragraph}
                </p>
              )}
              {roadEntry && (
                <div className="space-y-3">
                  <p className="font-serif text-sm text-charcoal/70 leading-relaxed">
                    {roadEntry.whatTheyMade}
                  </p>
                  <div className="border-l-2 border-gold/40 pl-4">
                    <p className="font-serif text-sm text-charcoal leading-relaxed italic">
                      {roadEntry.theyChose}
                    </p>
                  </div>
                </div>
              )}

              {/* Study references for this direction */}
              {studyRefs.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-wire">
                  <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/60">
                    To go in this direction, study
                  </p>
                  <div className="space-y-2">
                    {studyRefs.map((ref) => (
                      <div key={ref.id} className="flex items-start gap-3">
                        {imageMap[ref.id] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageMap[ref.id]!}
                            alt={ref.title}
                            className="w-10 h-10 object-cover flex-shrink-0 opacity-70"
                          />
                        )}
                        <div>
                          <p className="font-serif text-sm text-charcoal leading-tight">
                            {ref.title}
                            <span className="text-muted font-sans text-xs ml-2">{ref.creator}, {ref.year}</span>
                          </p>
                          <p className="font-sans text-xs text-muted/70 mt-0.5">{ref.medium}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related nodes */}
              {relatedNodes.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-wire">
                  <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/60">Connected to</p>
                  <div className="flex flex-wrap gap-2">
                    {relatedNodes.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(n.id); }}
                        className="text-[9px] font-sans uppercase tracking-[0.1em] border border-wire px-2 py-1 text-muted/70 hover:text-charcoal hover:border-muted/30 transition-colors duration-200"
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active connections list */}
      {mapData && mapData.relationships.length > 0 && !selectedId && (
        <div className="space-y-2">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">Strongest connections</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {mapData.relationships
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 6)
              .map((rel, i) => {
                const src = nodes.find((n) => n.id === rel.fromId);
                const tgt = nodes.find((n) => n.id === rel.toId);
                if (!src || !tgt) return null;
                return (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="w-3 h-px flex-shrink-0" style={{ background: TYPE_COLORS[rel.type] ?? "#3D3A35", display: "inline-block" }} />
                    <p className="font-sans text-xs text-muted/60">
                      <span className="text-charcoal/60">{src.label}</span>
                      {" "}{rel.type.replace(/_/g, " ")}{" "}
                      <span className="text-charcoal/60">{tgt.label}</span>
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
