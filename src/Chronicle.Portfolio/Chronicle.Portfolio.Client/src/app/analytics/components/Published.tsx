import { Counter } from "@/components/Figure";
import { External } from "@/components/Icon";
import type { ArticleLink, DockerHubStats } from "@/lib/types";

function monthYear(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function compact(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
    : String(value);
}

/**
 * Published container images and their pull counts.
 *
 * **Counters, never bars.** A pull count has no ceiling and no denominator — one image at
 * 40 and another at 4,000 says one is pulled more, not that either is 4% or 40% of
 * anything. Drawing a bar would assert a scale that does not exist, so the numbers carry
 * themselves and the ordering does the comparing.
 */
export function DockerImages({ docker }: { docker: DockerHubStats }) {
  if (docker.images.length === 0) return null;

  return (
    <div className="published" data-stagger data-slide>
      <p className="published-summary">
        <Counter value={docker.repositories} />{" "}
        {docker.repositories === 1 ? "image" : "images"} published, pulled{" "}
        <Counter value={docker.totalPulls} /> times in total.
      </p>

      <ul className="published-list">
        {docker.images.map((image) => (
          <li key={image.name} className="published-item">
            <a href={image.url} target="_blank" rel="noreferrer" className="published-name">
              {image.name}
              <External className="published-icon" />
            </a>

            {image.description && (
              <p className="published-description">{image.description}</p>
            )}

            <p className="published-meta">
              <span className="published-figure">{compact(image.pulls)} pulls</span>
              {image.stars > 0 && <span>{image.stars} stars</span>}
              <span>Updated {monthYear(image.lastUpdated)}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Articles published somewhere that is not this site.
 *
 * Titles, dates and tags only. Claps, views and reads are not available through anything
 * public, and inventing an engagement number — or quietly implying one by leaving space
 * for it — would be worse than not having it.
 */
export function ExternalArticles({ articles }: { articles: ArticleLink[] }) {
  if (articles.length === 0) return null;

  return (
    <ul className="published-list" data-stagger data-slide>
      {articles.map((article) => (
        <li key={article.url} className="published-item">
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="published-name"
          >
            {article.title}
            <External className="published-icon" />
          </a>

          {article.summary && <p className="published-description">{article.summary}</p>}

          <p className="published-meta">
            <span>{monthYear(article.publishedAt)}</span>
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="published-tag">
                {tag}
              </span>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
}
