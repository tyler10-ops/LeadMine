interface MarketPulseProps {
  content: string | null;
  city: string;
}

export function MarketPulse({ content, city }: MarketPulseProps) {
  if (!content) {
    return (
      <section className="py-12">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">
          Local Market Pulse
        </h2>
        <p className="text-neutral-500 text-sm">
          Market intelligence for {city} is being prepared.
        </p>
      </section>
    );
  }

  return (
    <section className="py-12">
      <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">
        Local Market Pulse
      </h2>
      <div
        className="prose prose-neutral prose-sm max-w-none [&_p]:text-neutral-600 [&_p]:leading-relaxed [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
