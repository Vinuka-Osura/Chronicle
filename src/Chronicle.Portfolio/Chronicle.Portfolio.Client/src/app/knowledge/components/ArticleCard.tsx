import Link from "next/link";
import type { PostCard } from "@/lib/types";

/**
 * A publication date, formatted identically on the server and in the browser.
 *
 * **`timeZone` is not optional.** This renders inside a client component, so the string is
 * produced twice — once during server rendering and once during hydration — and without a
 * fixed zone each side uses its own. An article published at 23:30 UTC then renders as the
 * 4th on a server running UTC and the 5th in a browser east of it, which React reports as
 * a hydration mismatch and the reader sees as the wrong date.
 *
 * UTC rather than the visitor's zone because a publication date is a fact about when
 * something was written, not about where it is being read.
 */
function published(iso: string | null): string {
  if (!iso) return "Unpublished";

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * One article, as a card.
 *
 * Built on the same `.card` skeleton as a project so the two grids read as one site, but
 * without a plate: an article has no picture and a generated one would be decoration
 * standing where a screenshot goes. What takes its place is the reading time, promoted to
 * the top-left where the plate's index numeral sits — because for a write-up that is the
 * number a reader actually wants before committing.
 */
export function ArticleCard({ post }: { post: PostCard }) {
  return (
    <article className="card article-card group">
      <div className="card-body">
        <p className="article-meta">
          <span className="article-minutes">{post.readingTimeMinutes} min</span>
          <span aria-hidden className="article-meta-dot">
            ·
          </span>
          <span>{published(post.publishedAt)}</span>
        </p>

        <h3 className="card-title">
          {/*
            The whole card is clickable via the ::after overlay, but the anchor wraps only
            the title so screen readers announce a sensibly named link rather than the
            card's entire contents.
          */}
          <Link
            href={`/knowledge/${post.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </h3>

        <p className="card-pitch">{post.excerpt}</p>

        <div className="card-foot">
          {post.tags.length > 0 && (
            <ul className="card-stack">
              {post.tags.slice(0, 4).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
              {post.tags.length > 4 && (
                <li className="card-stack-more">+{post.tags.length - 4}</li>
              )}
            </ul>
          )}

          <span className="card-arrow" aria-hidden>
            →
          </span>
        </div>
      </div>
    </article>
  );
}
