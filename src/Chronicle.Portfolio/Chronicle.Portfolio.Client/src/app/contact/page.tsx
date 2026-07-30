import type { Metadata } from "next";
import { ContactForm } from "./components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send a message directly, or use GitHub. Nothing is stored — the form sends an email and forgets it.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10">
        <p className="mb-2 font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
          Contact
        </p>
        <h1 className="text-title font-semibold">Say hello</h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          Roles, collaborations, or a question about something on this site — all
          welcome. Messages reach my inbox directly; nothing is stored here.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ContactForm />

        <aside className="rm-hide space-y-6 text-sm lg:border-l lg:border-rule lg:pl-8">
          <div>
            <h2 className="mb-1.5 font-mono text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">
              Elsewhere
            </h2>
            <ul className="space-y-1 text-ink-soft">
              <li>
                <a
                  href="https://github.com/Vinuka-Osura"
                  className="hover:text-signal"
                  rel="me noreferrer"
                  target="_blank"
                >
                  github.com/Vinuka-Osura
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-1.5 font-mono text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">
              What happens next
            </h2>
            <p className="text-ink-soft">
              The message is emailed straight on and never written to the database — a
              contact form is a notification, not content. Expect a reply within a few
              days.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
