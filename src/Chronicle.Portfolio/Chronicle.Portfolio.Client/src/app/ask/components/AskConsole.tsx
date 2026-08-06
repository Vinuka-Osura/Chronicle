"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { AskAnswer } from "@/lib/types";
import { ask } from "../api";

interface Turn {
  id: number;
  question: string;
  answer: AskAnswer | null;
}

const OPENERS = [
  "What has he built?",
  "Where has he worked?",
  "What is he strongest at?",
  "Does he know PostgreSQL?",
  "How do I get in touch?",
];

/**
 * The console.
 *
 * ── What this is, and what it is not ──────────────────────────────────────────────
 *
 * It reads as a chat and it is not a chatbot. Every answer is assembled from rows in this
 * site's database and arrives with the pages it was built from, so it cannot invent a job
 * or a credential — which is the entire reason it is not a language model. The page says
 * so plainly rather than implying a model is behind it, because a portfolio that
 * misrepresents its own machinery has undermined the one thing it exists to establish.
 *
 * ── Why the transcript is kept ────────────────────────────────────────────────────
 *
 * Answers append rather than replace. A reader comparing "what did he build" against
 * "what is he strongest at" should be able to see both, and a box that clears itself on
 * every question makes them ask twice.
 *
 * ── Why there is no typing simulation ─────────────────────────────────────────────
 *
 * The answer is ready in one round trip. Revealing it character by character to look like
 * a model thinking would be spending the reader's time to imitate a limitation this does
 * not have. The pending state is a real pending state, and it is usually brief.
 */
export function AskConsole() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const inputId = useId();
  const nextId = useRef(0);
  const inFlight = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Cancel anything outstanding when the page goes away, so an answer cannot arrive into
  // an unmounted component.
  useEffect(() => () => inFlight.current?.abort(), []);

  const submit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    const id = nextId.current++;
    setTurns((previous) => [...previous, { id, question: trimmed, answer: null }]);
    setQuestion("");
    setPending(true);

    try {
      const answer = await ask(trimmed, controller.signal);
      setTurns((previous) => previous.map((t) => (t.id === id ? { ...t, answer } : t)));
    } catch {
      // Aborted: the reader asked something else. Drop the turn rather than leaving a
      // question hanging with no answer under it.
      setTurns((previous) => previous.filter((t) => t.id !== id));
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setPending(false);
      }
    }
  };

  // Keep the newest turn in view, but never steal the page from someone scrolled up
  // reading an earlier answer.
  useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns]);

  const latest = turns.at(-1)?.answer;
  const prompts = latest?.suggestions?.length ? latest.suggestions : OPENERS;

  return (
    <div className="ask">
      <ol className="ask-thread">
        {turns.map((turn) => (
          <li key={turn.id} className="ask-turn">
            <p className="ask-question">{turn.question}</p>

            {turn.answer ? (
              <div className="ask-answer">
                {/* Split on blank lines rather than rendering markdown: the answer is
                    plain text by design, and a renderer here would be a way for content
                    to become markup. */}
                {turn.answer.answer.split("\n").map((line, i) =>
                  line.trim() ? <p key={i}>{line}</p> : null,
                )}

                {turn.answer.sources.length > 0 && (
                  <ul className="ask-sources" aria-label="Where this came from">
                    {turn.answer.sources.map((source) => (
                      <li key={source.path + source.label}>
                        <Link href={source.path} className="ask-source">
                          {source.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="ask-pending" aria-live="polite">
                Looking&hellip;
              </p>
            )}
          </li>
        ))}
        <div ref={endRef} />
      </ol>

      <div className="ask-prompts" role="group" aria-label="Suggested questions">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="ask-prompt"
            onClick={() => submit(prompt)}
            disabled={pending}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="ask-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(question);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask a question about this work
        </label>
        <input
          id={inputId}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about the work, the stack, or how to get in touch"
          className="ask-input"
          autoComplete="off"
          maxLength={300}
        />
        <button type="submit" className="ask-send" disabled={pending || !question.trim()}>
          Ask
        </button>
      </form>
    </div>
  );
}
