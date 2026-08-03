"use client";

import { Download } from "@/components/Icon";

/**
 * The two ways to take the CV away.
 *
 * **Print, not a generated PDF.** The print stylesheet already produces the document, and
 * a server-rendered PDF would be a third thing to keep in step with the live data. The
 * browser's own output is selectable, searchable text — which is the whole requirement,
 * because an applicant-tracking system cannot read a PDF made of pictures.
 *
 * **Word as well, because some application forms will not take a PDF at all.** That one
 * is a real .docx built from the same projection this page renders, so the two cannot say
 * different things.
 */
export function ResumeActions({ docxUrl }: { docxUrl: string }) {
  return (
    <div className="resume-actions rm-hide-print">
      <button type="button" onClick={() => window.print()} className="resume-action is-primary">
        Print or save as PDF
      </button>

      {/* A plain link, not a fetch: the browser's own download handling gets the filename
          from Content-Disposition and shows progress without any of this being our problem. */}
      <a href={docxUrl} className="resume-action" download>
        <Download />
        Word (.docx)
      </a>
    </div>
  );
}
