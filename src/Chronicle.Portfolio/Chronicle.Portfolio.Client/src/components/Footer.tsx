import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          Built with .NET&nbsp;10 and Next.js. The content is served by an API and edited
          in a CMS - no deploy required.{" "}
          <Link href="/city" className="text-signal hover:underline">
            Software City
          </Link>{" "}
          is in progress.
        </p>

        <ul className="flex gap-4">
          <li>
            <a
              href="https://github.com/Vinuka-Osura"
              className="hover:text-ink"
              rel="me noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </li>
          <li>
            <Link href="/contact" className="hover:text-ink">
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
