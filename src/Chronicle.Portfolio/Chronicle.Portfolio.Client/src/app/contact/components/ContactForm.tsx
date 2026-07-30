"use client";

import { useId, useState } from "react";
import { sendContactMessage } from "../api";

/**
 * Every outcome the visitor can end up in. Modelled as a union rather than three
 * booleans so "sending and also failed" cannot be represented.
 */
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "invalid"; errors: Record<string, string[]> }
  | { kind: "throttled" }
  | { kind: "unavailable"; detail: string }
  | { kind: "offline" };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const id = useId();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus({ kind: "sending" });

    const result = await sendContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
    });

    if (result.ok) {
      form.reset();
      setStatus({ kind: "sent" });
      return;
    }

    // Each failure gets its own message. "Something went wrong" tells someone who has
    // just written three paragraphs nothing about whether to try again or give up.
    switch (result.status) {
      case 400:
        setStatus({ kind: "invalid", errors: result.errors ?? {} });
        break;
      case 429:
        setStatus({ kind: "throttled" });
        break;
      case 503:
        setStatus({
          kind: "unavailable",
          detail: result.detail ?? "The form is not accepting messages right now.",
        });
        break;
      default:
        setStatus({ kind: "offline" });
    }
  }

  if (status.kind === "sent") {
    return (
      <div
        role="status"
        className="rounded-lg border border-signal bg-signal-soft px-5 py-4"
      >
        <p className="font-display font-semibold text-ink">Message sent.</p>
        <p className="mt-1 text-sm text-ink-soft">
          It is on its way to my inbox. I read everything and reply to anything that
          needs one.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-3 text-sm text-signal underline underline-offset-2"
        >
          Send another
        </button>
      </div>
    );
  }

  // Keys come back PascalCase from FluentValidation; the inputs are lowercase.
  const errors = status.kind === "invalid" ? status.errors : {};
  const errorFor = (field: string) =>
    Object.entries(errors).find(([key]) => key.toLowerCase() === field)?.[1]?.[0];

  const sending = status.kind === "sending";

  return (
    <form onSubmit={submit} noValidate className="relative max-w-xl space-y-5">
      {status.kind === "throttled" && (
        <Notice>
          That is several messages in quick succession. Give it five minutes and try
          again — or email me directly, the address is in the footer.
        </Notice>
      )}
      {status.kind === "unavailable" && <Notice>{status.detail}</Notice>}
      {status.kind === "offline" && (
        <Notice>
          The message could not be sent. Check your connection and try again, or email me
          directly.
        </Notice>
      )}

      <Field id={`${id}-name`} name="name" label="Your name" error={errorFor("name")}>
        {(props) => <input {...props} type="text" autoComplete="name" maxLength={100} />}
      </Field>

      <Field id={`${id}-email`} name="email" label="Email" error={errorFor("email")}>
        {(props) => (
          <input {...props} type="email" autoComplete="email" maxLength={200} />
        )}
      </Field>

      <Field id={`${id}-message`} name="message" label="Message" error={errorFor("message")}>
        {(props) => <textarea {...props} rows={7} maxLength={4000} />}
      </Field>

      {/*
        Honeypot. Off-screen rather than display:none, and kept out of both the tab order
        and the accessibility tree — a keyboard or screen-reader visitor must never be
        able to land in it and get silently rejected for filling in a field they were
        shown. Autofill is off for the same reason.
      */}
      <div aria-hidden className="contact-honeypot">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-signal disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

/**
 * Label, control and error message wired together. The control is a render prop so each
 * field can be an input or a textarea while the id/name/aria plumbing stays in one
 * place — three fields is exactly where copying that plumbing starts to drift.
 */
function Field({
  id,
  name,
  label,
  error,
  children,
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  children: (props: {
    id: string;
    name: string;
    required: true;
    className: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[0.7rem] tracking-[0.12em] text-ink-soft uppercase"
      >
        {label}
      </label>

      {children({
        id,
        name,
        required: true,
        className: "field-input",
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A whole-form failure, as opposed to one field being wrong. */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="border-l-2 border-alert bg-alert-soft px-3.5 py-2.5 text-sm text-ink-soft"
    >
      {children}
    </p>
  );
}
