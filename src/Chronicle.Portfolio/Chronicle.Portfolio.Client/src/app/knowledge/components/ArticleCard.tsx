import Link from "next/link";
import { External } from "@/components/Icon";
import type { ArticleLink, PostCard } from "@/lib/types";

/**
 * A publication date, formatted identically on the server and in the browser.
 *
 * **`timeZone` is not optional.** This renders inside a client component, so the string is
 * produced twice — once during server rendering and once during hydration — and without a
 * fixed zone each side uses its own. An article published at 23:30 UTC then renders as the
 * 4th on a server running UTC and the 5th in a browser east of it, which React reports as
 * a hydration mismatch and the reader sees as the wrong date.
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

/** The publisher, from the URL. "medium.com" beats a generic "external" label. */
function publisher(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "elsewhere";
  }
}

/**
 * One article, hosted here or published somewhere else.
 *
 * The two are deliberately the same card rather than two lists. A reader wants everything
 * written, not a tour of where each piece is hosted — so the difference shows as a chip
 * naming the publisher and an outward arrow, not as a separate section they have to find.
 *
 * **An external card shows the article's own picture.** A card that sends someone off the
 * site has to earn that click, and a title alone does not; a hosted card needs no picture
 * because the whole article is one tap away and the excerpt is doing the work.
 */
export function ArticleCard({ article }: { article: Article }) {
  const external = article.kind === "external";

  return (
    <article className={`card article-card group${external ? " is-external" : ""}`}>
      {external && article.imageUrl && (
        <span className="article-plate">
          {/* A plain <img>: the URL comes from a feed or the CMS at request time, so there
              is no build-time knowledge to optimise against, and configuring a remote
              loader for an unknown host is a bigger surface than the saving is worth.
              Same reasoning as ProjectCard's plate. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="article-plate-image"
          />
        </span>
      )}

      <div className="card-body">
        <p className="article-meta">
          {external ? (
            <span className="article-publisher">{publisher(article.url)}</span>
          ) : (
            <span className="article-minutes">{article.readingTimeMinutes} min</span>
          )}
          <span aria-hidden className="article-meta-dot">
            ·
          </span>
          <span>{published(article.publishedAt)}</span>
        </p>

        <h3 className="card-title">
          {/*
            The whole card is clickable via the ::after overlay, but the anchor wraps only
            the title so screen readers announce a sensibly named link rather than the
            card's entire contents.
          */}
          {external ? (
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="after:absolute after:inset-0 after:content-['']"
            >
              {article.title}
            </a>
          ) : (
            <Link
              href={`/knowledge/${article.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {article.title}
            </Link>
          )}
        </h3>

        {article.summary && <p className="card-pitch">{article.summary}</p>}

        <div className="card-foot">
          {article.tags.length > 0 && (
            <ul className="card-stack">
              {article.tags.slice(0, 4).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
              {article.tags.length > 4 && (
                <li className="card-stack-more">+{article.tags.length - 4}</li>
              )}
            </ul>
          )}

          {external ? (
            <External className="card-arrow" />
          ) : (
            <span className="card-arrow" aria-hidden>
              →
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * One shape for both sources, so the list, the filter and the card each handle one type
 * rather than branching on two at every step.
 */
export type Article =
  | {
      kind: "hosted";
      key: string;
      slug: string;
      title: string;
      summary: string;
      publishedAt: string | null;
      readingTimeMinutes: number;
      tags: string[];
    }
  | {
      kind: "external";
      key: string;
      url: string;
      title: string;
      summary: string;
      publishedAt: string;
      imageUrl: string | null;
      tags: string[];
    };

export function fromPost(post: PostCard): Article {
  // A post carrying an external URL is a pointer, not an article: it is entered in the CMS
  // because its publisher has no feed to read. It renders exactly like one that was fetched.
  return post.externalUrl
    ? {
        kind: "external",
        key: post.slug,
        url: post.externalUrl,
        title: post.title,
        summary: post.excerpt,
        publishedAt: post.publishedAt ?? "",
        imageUrl: post.coverImageUrl,
        tags: post.tags,
      }
    : {
        kind: "hosted",
        key: post.slug,
        slug: post.slug,
        title: post.title,
        summary: post.excerpt,
        publishedAt: post.publishedAt,
        readingTimeMinutes: post.readingTimeMinutes,
        tags: post.tags,
      };
}

export function fromLink(link: ArticleLink): Article {
  return {
    kind: "external",
    key: link.url,
    url: link.url,
    title: link.title,
    summary: link.summary ?? "",
    publishedAt: link.publishedAt,
    imageUrl: link.imageUrl,
    tags: link.tags,
  };
}
