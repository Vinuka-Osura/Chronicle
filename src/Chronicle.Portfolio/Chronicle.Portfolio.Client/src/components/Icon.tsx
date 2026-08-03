/**
 * The handful of icons this site uses, as inline SVG.
 *
 * **No icon package**, deliberately. The whole set here is four glyphs; the smallest
 * library that supplies them arrives with a few hundred more, a build step to shake them
 * out again, and a dependency to keep current — for four paths that will never change.
 *
 * Not text glyphs either, which is what prompted this file. The back link on a case
 * study was a literal left-arrow character, and somewhere in its history the file went
 * through a decode-as-Latin-1 round trip that turned those three bytes into three
 * mojibake characters. A glyph in source is
 * a glyph that depends on every tool that ever touches the file agreeing about
 * encoding; `<path d="…">` is ASCII and cannot be corrupted that way. It also scales
 * with the type and takes `currentColor`, which a character in a fallback font does not
 * reliably do.
 *
 * `aria-hidden` throughout: every one of these sits beside a real text label, and an
 * icon that announces itself next to the word it illustrates is just a stutter.
 */

type IconProps = {
  /** Sized in `em` so it tracks the type it sits beside rather than a fixed pixel size. */
  className?: string;
};

function Svg({ children, className = "" }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
    >
      {children}
    </svg>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function Search(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function Close(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function External(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Svg>
  );
}
