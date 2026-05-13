import { getShare } from "@/lib/store";
import { notFound } from "next/navigation";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getShare(id);
  if (!data) notFound();

  const { brief } = data;

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-12">

        {/* Header */}
        <div className="flex justify-between items-start">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
            A Séance reading
          </p>
          <a
            href="/"
            className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50 hover:text-gold transition-colors duration-300"
          >
            Séance
          </a>
        </div>

        {/* Thin rule */}
        <div className="w-full h-px bg-border" />

        {/* Mandate */}
        <div className="space-y-3">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
            The next work
          </p>
          <p className="font-serif text-2xl text-charcoal leading-snug">
            {brief.thingThatDoesntExist}
          </p>
        </div>

        {/* Refusals */}
        <div className="space-y-4">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
            It refuses
          </p>
          <div className="space-y-3">
            {brief.refusals.map((r, i) => (
              <div
                key={i}
                className="border border-wire px-5 py-4 space-y-1"
              >
                <p className="font-serif text-sm text-charcoal leading-snug">
                  {r.what}
                </p>
                <p className="font-sans text-xs text-muted leading-relaxed">
                  Because: {r.because}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why this creator */}
        <div className="space-y-3">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
            Why this creator
          </p>
          <p className="font-serif text-sm text-charcoal/80 leading-relaxed">
            {brief.whyYou}
          </p>
        </div>

        {/* Provenance */}
        <div className="space-y-2 pt-4 border-t border-wire">
          <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-muted/50">
            Lineage
          </p>
          <p className="font-sans text-xs text-muted/60 italic leading-relaxed">
            {brief.provenanceNote}
          </p>
        </div>

      </div>
    </main>
  );
}
