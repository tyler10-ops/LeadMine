"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import type { Content } from "@/types";

const CONTENT_TYPES = [
  { value: "market_pulse", label: "Market Pulse" },
  { value: "buyer_tip", label: "Buyer Tip" },
  { value: "seller_warning", label: "Seller Alert" },
] as const;

export default function ContentPage() {
  const [articles, setArticles] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchContent = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return;

    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("realtor_id", realtor.id)
      .order("created_at", { ascending: false });

    setArticles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleGenerate = async (type: string) => {
    setGenerating(type);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        await fetchContent();
      }
    } catch {
      // Silent fail
    } finally {
      setGenerating(null);
    }
  };

  const togglePublish = async (article: Content) => {
    setToggling(article.id);
    const supabase = createClient();

    await supabase
      .from("content")
      .update({ published: !article.published })
      .eq("id", article.id);

    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id ? { ...a, published: !a.published } : a
      )
    );
    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Content Engine</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Generate and publish AI-powered market content
        </p>
      </div>

      {/* Generate buttons */}
      <div className="flex gap-3">
        {CONTENT_TYPES.map((ct) => (
          <Button
            key={ct.value}
            variant="outline"
            size="sm"
            onClick={() => handleGenerate(ct.value)}
            disabled={generating !== null}
          >
            {generating === ct.value ? (
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-3 h-3 mr-2" />
            )}
            Generate {ct.label}
          </Button>
        ))}
      </div>

      {/* Content list */}
      {articles.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-400 text-center py-8">
            No content generated yet. Click a button above to create your first
            piece.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} padding="md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                      {article.type.replace("_", " ")}
                    </span>
                    {article.published ? (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Published
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    {article.title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePublish(article)}
                  disabled={toggling === article.id}
                >
                  {toggling === article.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : article.published ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" /> Publish
                    </>
                  )}
                </Button>
              </div>
              <div
                className="prose prose-neutral prose-sm max-w-none [&_p]:text-neutral-600 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
              <p className="text-xs text-neutral-400 mt-4">
                {new Date(article.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
