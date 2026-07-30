/**
 * Structured data, for the machines rather than the reader.
 *
 * Search engines and LinkedIn read this to work out that the site is a person, that an
 * article has an author and a date, and that a case study is a piece of work. Without
 * it they guess from the markup, and guess badly on a JavaScript-rendered page.
 *
 * `dangerouslySetInnerHTML` is the documented way to emit a JSON-LD block - React would
 * otherwise escape the JSON into unusable text. The content is ours and serialised by
 * `JSON.stringify`, so there is no untrusted string being interpolated here; the one
 * genuine risk is a `</script>` sequence inside a value, which the replace below
 * neutralises.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
