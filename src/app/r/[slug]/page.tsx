import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { MarketPulse } from "@/components/realtor/market-pulse";
import { ContentFeed } from "@/components/realtor/content-feed";
import { ChatWidget } from "@/components/chat/chat-widget";
import { PageViewTracker } from "./page-view-tracker";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: realtor } = await supabase
    .from("realtors")
    .select("name, city, tagline")
    .eq("slug", slug)
    .single();

  if (!realtor) return { title: "Not Found" };

  return {
    title: `${realtor.name} — Real Estate in ${realtor.city}`,
    description: realtor.tagline || `${realtor.name} is your trusted realtor in ${realtor.city}`,
  };
}

export default async function RealtorPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: realtor } = await supabase
    .from("realtors")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!realtor) notFound();

  // Get published content
  const { data: articles } = await supabase
    .from("content")
    .select("*")
    .eq("realtor_id", realtor.id)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get latest market pulse content for the hero
  const { data: latestPulse } = await supabase
    .from("content")
    .select("body")
    .eq("realtor_id", realtor.id)
    .eq("type", "market_pulse")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-white">
      <PageViewTracker realtorId={realtor.id} />

      {/* Header */}
      <header className="max-w-2xl mx-auto px-6 pt-16 pb-12">
        <div className="flex items-start justify-between">
          <div>
            {realtor.photo_url && (
              <img
                src={realtor.photo_url}
                alt={realtor.name}
                className="w-16 h-16 rounded-full object-cover mb-4"
              />
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              {realtor.name}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {realtor.city}
              {realtor.state && `, ${realtor.state}`}
            </p>
            {realtor.tagline && (
              <p className="text-sm text-neutral-600 mt-3 max-w-md leading-relaxed">
                {realtor.tagline}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 pb-24">
        <div className="border-t border-neutral-100">
          <MarketPulse
            content={latestPulse?.body || null}
            city={realtor.city}
          />
        </div>

        {articles && articles.length > 0 && (
          <ContentFeed articles={articles} />
        )}

        {/* Bio section */}
        {realtor.bio && (
          <section className="py-12 border-t border-neutral-100">
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
              About {realtor.name}
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {realtor.bio}
            </p>
          </section>
        )}
      </main>

      {/* Powered by footer */}
      <footer className="border-t border-neutral-100 py-6">
        <p className="text-center text-[10px] text-neutral-400 uppercase tracking-widest">
          Powered by Real Estate Autopilot
        </p>
      </footer>

      {/* AI Chat Widget */}
      <ChatWidget
        realtorId={realtor.id}
        realtorName={realtor.name}
        city={realtor.city}
      />
    </div>
  );
}
