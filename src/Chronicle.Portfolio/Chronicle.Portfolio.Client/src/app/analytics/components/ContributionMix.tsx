import { Counter } from "@/components/Figure";
import type { ContributionBreakdown } from "@/lib/types";

const PARTS = [
  { key: "commits", label: "Commits", note: "Code written and pushed" },
  { key: "pullRequests", label: "Pull requests", note: "Changes proposed" },
  { key: "reviews", label: "Reviews", note: "Other people's work read" },
  { key: "issues", label: "Issues", note: "Problems raised and tracked" },
] as const;

/**
 * What the headline number is actually made of.
 *
 * A single "1,247 contributions" figure cannot distinguish a year of commits from a year
 * of code review, and those describe very different engineers. These four are the parts
 * GitHub counts, and — unusually for this page — **they sum to the total**, so a
 * proportional bar is honest here. Everywhere else on this site a bar over a bare count
 * would be inventing a scale.
 *
 * The bar and the number are both present. The share is the shape; the count is the fact.
 */
export function ContributionMix({ breakdown }: { breakdown: ContributionBreakdown }) {
  const total =
    breakdown.commits + breakdown.pullRequests + breakdown.reviews + breakdown.issues;

  if (total === 0) return null;

  return (
    <div className="mix" data-stagger>
      {PARTS.map((part) => {
        const value = breakdown[part.key];
        const share = value / total;

        return (
          <div key={part.key} className="mix-row">
            <div className="mix-head">
              <span className="mix-label">{part.label}</span>
              <span className="mix-value">
                <Counter value={value} />
                <span className="mix-share">{(share * 100).toFixed(1)}%</span>
              </span>
            </div>

            <span
              className="mix-track"
              aria-hidden
              style={{ "--fill": `${share}` } as React.CSSProperties}
            >
              <span className="mix-fill" />
            </span>

            <p className="mix-note">{part.note}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The private half of the work, acknowledged without disclosing any of it.
 *
 * Most professional output is in repositories nobody outside the company can open, so a
 * portfolio built only on public activity understates the person by design. GitHub's
 * `restrictedContributionsCount` is the honest fix: a count, published by the account
 * owner's own choice of setting, with no repository name, commit message or employer
 * attached to it.
 *
 * **This renders nothing at all when the count is zero.** That is the case both for
 * someone with no private work and for someone who has not enabled the profile setting,
 * and an empty "0 private contributions" panel would read as the former when it is
 * usually the latter.
 */
export function PrivateWork({ breakdown }: { breakdown: ContributionBreakdown }) {
  if (!breakdown.hasPrivateContributions || breakdown.privateContributions === 0) {
    return null;
  }

  const repos = breakdown.privateRepositoriesCommittedTo;

  return (
    <aside className="private-work" data-pop>
      <p className="private-work-label">Also, not shown</p>

      <p className="private-work-figure">
        <Counter value={breakdown.privateContributions} />
        <span className="private-work-unit">
          private contribution{breakdown.privateContributions === 1 ? "" : "s"}
        </span>
      </p>

      <p className="private-work-note">
        Work in repositories you cannot open{repos > 0 && `, across ${repos} of them`}.
        GitHub publishes the count because I have chosen to share it; it carries no
        repository name, no commit message and no employer — and it is the reason the
        public figures above are a floor rather than a total.
      </p>
    </aside>
  );
}
