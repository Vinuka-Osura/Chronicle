import type { LanguageShare as Language } from "@/lib/types";

/**
 * Language mix as horizontal bars in a single hue.
 *
 * Every bar wears the same accent, not a ramp and not eight categorical hues. Languages
 * are nominal — reordering them changes nothing — so colouring each bar by its own value
 * would spend the identity channel re-encoding what the bar length already says, and
 * eight hues would claim a distinction between C# and SQL that the reader has no use
 * for. The name beside each bar is the identity channel; length is the measurement.
 *
 * Horizontal rather than a stacked bar because the names are long and a stack of eight
 * segments is unlabellable at any width a phone has.
 */
export function LanguageShare({ languages }: { languages: Language[] }) {
  if (languages.length === 0) {
    return null;
  }

  // Scaled against the largest share, not against 100, so a spread of 34/22/15 uses the
  // full width instead of huddling in the left third.
  const widest = languages[0].percent;

  return (
    <section aria-labelledby="languages-heading">
      <h2 id="languages-heading" className="text-section font-display font-semibold">
        Languages by volume
      </h2>
      <p className="mb-4 text-sm text-ink-soft">
        Bytes of code across the most recently active repositories, not a count of
        files or repositories.
      </p>

      <ul className="space-y-2.5">
        {languages.map((language) => (
          <li key={language.name} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3">
            <span className="truncate text-sm text-ink" title={language.name}>
              {language.name}
            </span>

            {/*
              No track behind the bar. A full-width track reads as a 100% reference,
              and these bars are scaled against the largest share rather than against
              100 - so the track would be quietly lying about what "full" means.
            */}
            <span className="block h-2.5 w-full">
              {/* Square at the baseline, 4px rounded at the data end. */}
              <span
                className="block h-full rounded-r-[4px] bg-signal"
                style={{ width: `${Math.max(2, (language.percent / widest) * 100)}%` }}
              />
            </span>

            {/* Direct-labelled at the tip: eight rows is few enough that every value can
                carry its number without the chart becoming a wall of digits. */}
            <span className="text-right font-mono text-xs text-ink-soft tabular-nums">
              {language.percent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
