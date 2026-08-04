import { Counter, Ring } from "@/components/Figure";
import { External } from "@/components/Icon";
import type { StackOverflowStats } from "@/lib/types";

/**
 * Stack Overflow, which is the one place on this page where being useful to strangers is
 * the thing being measured.
 *
 * **Only the accepted rate gets a ring.** Reputation is a bare count with no ceiling — a
 * ring over it would invent a denominator, and "312 out of what?" has no answer.
 * Accepted-over-answered is a real proportion of a real whole, so it is drawn as one.
 *
 * Badge counts are shown as three numbers rather than one total, because gold, silver and
 * bronze are not interchangeable and summing them says something untrue.
 */
export function StackOverflow({ stats }: { stats: StackOverflowStats }) {
  const since = new Date(`${stats.memberSince}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="so" data-stagger data-pop>
      <div className="so-figures">
        <div className="so-headline">
          <p className="so-value">
            <Counter value={stats.reputation} />
          </p>
          <p className="so-label">Reputation</p>
          <p className="so-note">Answering since {since}</p>
        </div>

        {/* Only drawn when it could actually be counted. A rate with no denominator is
            worse than no rate. */}
        {stats.acceptedRate !== null && (
          <div className="so-rate">
            <Ring percent={stats.acceptedRate * 100} label="Answers accepted" />
            <p className="so-note">
              <Counter value={stats.answers} /> answers posted, and the asker marked this
              share of them as the one that solved it.
            </p>
          </div>
        )}
      </div>

      <dl className="so-badges">
        {(
          [
            ["Gold", stats.goldBadges, "is-gold"],
            ["Silver", stats.silverBadges, "is-silver"],
            ["Bronze", stats.bronzeBadges, "is-bronze"],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className={`so-badge ${tone}`}>
            <dt>{label}</dt>
            <dd>
              <Counter value={value} />
            </dd>
          </div>
        ))}
      </dl>

      {stats.topTags.length > 0 && (
        <div className="so-tags">
          <p className="so-tags-label">Most-scored tags</p>
          <ul>
            {stats.topTags.slice(0, 8).map((tag) => (
              <li key={tag.name} className="so-tag">
                {tag.name}
                <span className="so-tag-score">
                  {tag.posts} post{tag.posts === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={stats.profileUrl}
        target="_blank"
        rel="noreferrer"
        className="so-link"
      >
        {stats.displayName} on Stack Overflow
        <External />
      </a>
    </div>
  );
}
