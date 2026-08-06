import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { AskConsole } from "./components/AskConsole";
import "./ask.css";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask a question about this work and get an answer built from the site's own content, with the page it came from. No language model, and nothing invented.",
};

export default function AskPage() {
  return (
    <>
      <section className="ask-open" data-scene="Ask" aria-labelledby="ask-heading">
        <div className="hero-channel">
          <Acquire text="ASK" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire text="NO MODEL" className="hero-channel-label" delay={220} />
        </div>

        <SetLines as="h1" className="ask-heading" delay={320} id="ask-heading">
          Ask, and it answers from the record.
        </SetLines>

        {/*
          The mechanism is stated up front rather than buried. Every other assistant on a
          portfolio implies a model; saying that this one is not, and why, is both the
          honest thing and the more interesting engineering claim.
        */}
        <p className="ask-lede reveal-mask rm-compact">
          Every answer here is assembled from the same database the rest of the site reads
          — the roles, projects, skills, education, credentials, writing and goals you can
          browse yourself — and arrives with a link to the page it came from.
        </p>

        <p className="ask-note rm-hide">
          There is no language model behind it, deliberately. One would cost money per
          question and would answer even when it did not know, and a confident wrong
          answer about somebody&rsquo;s career is worse than no feature at all. Ask
          something outside the record and it will say so.
        </p>
      </section>

      <section className="scene" data-scene="Console" aria-label="Ask a question">
        <AskConsole />
      </section>
    </>
  );
}
