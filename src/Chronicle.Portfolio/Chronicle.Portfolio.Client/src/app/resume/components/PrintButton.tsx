"use client";

/**
 * Opens the browser's print dialogue, which is also its save-as-PDF.
 *
 * No PDF generation on the server: the print stylesheet already produces the document,
 * and a generated PDF would be a second thing to keep in step with the live data. The
 * browser's own output is selectable, searchable text — which matters, because an
 * applicant-tracking system cannot read a PDF made of images.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rm-hide-print rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-signal"
    >
      Print or save as PDF
    </button>
  );
}
