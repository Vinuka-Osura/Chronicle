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

/*
  The social marks below are filled shapes, not strokes, so each one overrides the
  shared `stroke`/`fill` defaults. They are simplified glyphs rather than the platforms'
  own trademarked logos — close enough to be recognised at 18px, and not a redistribution
  of somebody's brand asset.
*/
function Mark({ children, className = "" }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={`icon ${className}`}
    >
      {children}
    </svg>
  );
}

export function GitHub(props: IconProps) {
  return (
    <Mark {...props}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </Mark>
  );
}

export function LinkedIn(props: IconProps) {
  return (
    <Mark {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.65h.05A4.17 4.17 0 0 1 17.6 8.7c4 0 4.74 2.5 4.74 5.76V21h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.47-2.2 3v5.8h-4V9Z" />
    </Mark>
  );
}

export function Facebook(props: IconProps) {
  return (
    <Mark {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
    </Mark>
  );
}

export function Instagram(props: IconProps) {
  return (
    <Mark {...props}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.64.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.8c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.18.4-.54.22-.93.47-1.34.88-.4.4-.66.8-.87 1.34-.16.42-.36 1.04-.41 2.19-.06 1.23-.07 1.6-.07 4.74s.01 3.5.07 4.74c.05 1.14.25 1.76.41 2.18.21.55.47.94.87 1.34.41.41.8.66 1.34.88.42.16 1.04.35 2.18.4 1.24.06 1.6.08 4.74.08s3.5-.02 4.74-.08c1.14-.05 1.76-.24 2.18-.4.55-.22.94-.47 1.34-.88.41-.4.66-.79.88-1.34.16-.42.35-1.04.4-2.18.06-1.24.08-1.6.08-4.74s-.02-3.5-.08-4.74c-.05-1.15-.24-1.77-.4-2.19a3.6 3.6 0 0 0-.88-1.34c-.4-.4-.79-.66-1.34-.88-.42-.16-1.04-.35-2.18-.4-1.24-.06-1.6-.07-4.74-.07Zm0 3.06a5 5 0 1 1 0 9.99 5 5 0 0 1 0-10Zm0 8.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.36-8.4a1.17 1.17 0 1 1-2.33 0 1.17 1.17 0 0 1 2.33 0Z" />
    </Mark>
  );
}

/** X, formerly Twitter. */
export function XMark(props: IconProps) {
  return (
    <Mark {...props}>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.5 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.2h1.67L7.6 4.72H5.81l10.66 14.48Z" />
    </Mark>
  );
}

export function Download(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 19h16" />
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
