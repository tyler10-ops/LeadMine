import type { Content } from "@/types";

interface ContentFeedProps {
  articles: Content[];
}

export function ContentFeed({ articles }: ContentFeedProps) {
  if (articles.length === 0) return null;

  return (
    <section className="py-12 border-t border-neutral-100">
      <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-8">
        Latest Insights
      </h2>
      <div className="space-y-8">
        {articles.map((article) => (
          <article key={article.id}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                {article.type.replace("_", " ")}
              </span>
              <span className="text-neutral-300">·</span>
              <time className="text-[10px] text-neutral-400">
                {new Date(article.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {article.title}
            </h3>
            <div
              className="prose prose-neutral prose-sm max-w-none [&_p]:text-neutral-600 [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
