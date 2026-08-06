"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ask } from "@/lib/ask";
import type { AskAnswer } from "@/lib/types";
import { AskBotFigure } from "./AskBotFigure";

interface Turn {
  id: number;
  question: string;
  answer: AskAnswer | null;
}

const OPENERS = [
  "What has he built?",
  "Where has he worked?",
  "What is he strongest at?",
  "How do I get in touch?",
];

/**
 * A bot in the corner of every page, and the chat it opens.
 *
 * ── Why a corner button rather than a page ────────────────────────────────────────
 *
 * A page has to be navigated to, which means being wanted before it is seen. This asks
 * nothing of the reader until they want it, and it is available from wherever the
 * question occurred to them — halfway down a case study is exactly where somebody thinks
 * "has he actually used this".
 *
 * ── What it is honest about ──────────────────────────────────────────────────────
 *
 * It reads as a chat and it is not a chatbot. Every answer is assembled from rows in this
 * site's database and arrives with the pages it came from, so it cannot invent a job or a
 * credential — which is why it is not a language model. The panel says so in a line under
 * the title rather than implying a model is behind it.
 *
 * ── Why there is no typing simulation ─────────────────────────────────────────────
 *
 * The answer is ready in one round trip. Revealing it a character at a time to look like
 * a model thinking would spend the reader's time imitating a limitation this does not
 * have. The pending state is real, and usually brief.
 */
export function AskBot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);

  const panelId = useId();
  const inputId = useId();
  const nextId = useRef(0);
  /** What the last answer was about, so the next question can say "it". */
  const subject = useRef<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Abort anything outstanding on unmount, so an answer cannot arrive into a gone panel.
  useEffect(() => () => inFlight.current?.abort(), []);

  /*
    Escape closes and returns focus to the button that opened it.

    Bound on the document rather than the panel: the reader may have focus in the input,
    on a source link, or nowhere in particular after clicking the backdrop, and Escape
    should mean the same thing in all of them.
  */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the field on open. Without it the reader has to click twice to type once.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /*
    The wheel, anywhere over the panel, scrolls the TRANSCRIPT and never the page.

    `data-lenis-prevent` alone was not enough, and the reason is worth writing down: it
    does not stop the scroll, it hands the event back to the browser. Over the transcript
    that is the right outcome, because the transcript can consume it. Over the input or
    the prompt chips nothing underneath is scrollable, so the browser walks up and scrolls
    the document — the page moved out from under an open panel, which is the bug the
    attribute was supposed to fix.

    So the panel claims the gesture outright: cancel it, and apply the delta to the one
    element in here that scrolls. Wheeling over the input now moves the conversation,
    which is what a reader means by it.

    A native listener with `passive: false` rather than React's `onWheel`, because React
    registers wheel handlers passively — `preventDefault` inside one is ignored, with a
    console warning and no effect.
  */
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;

    const onWheel = (event: WheelEvent) => {
      const thread = threadRef.current;
      if (!thread) return;

      event.preventDefault();
      thread.scrollTop += event.deltaY;
    };

    panel.addEventListener("wheel", onWheel, { passive: false });
    return () => panel.removeEventListener("wheel", onWheel);
  }, [open]);

  useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns]);

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
      /*
        The thread's antecedent travels with the question rather than living on the server.

        `subject` is whatever the last answer was about — a skill name, a project title —
        and sending it back is what gives "what projects used it?" an "it". Holding it here
        rather than in a session keeps the endpoint a pure function of its query string, so
        it stays cacheable and a restart mid-conversation costs nothing.

        Read from the ref, not from state: two questions asked in quick succession would
        otherwise both send the subject from before either of them.
      */
      const answer = await ask(trimmed, subject.current, controller.signal);
      subject.current = answer.subject ?? null;
      setTurns((previous) => previous.map((t) => (t.id === id ? { ...t, answer } : t)));
    } catch {
      // Aborted: the reader asked something else. Drop the turn rather than leaving a
      // question sitting there with nothing under it.
      setTurns((previous) => previous.filter((t) => t.id !== id));
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setPending(false);
      }
    }
  };

  const latest = turns.at(-1)?.answer;
  const prompts = latest?.suggestions?.length ? latest.suggestions : OPENERS;

  return (
    /*
      `data-lenis-prevent` keeps the inertial-scroll layer out of this subtree entirely, so
      the wheel handler above is the only thing acting on the gesture. Both running at once
      is how the page kept drifting while the panel was open.
    */
    <div className="ask-bot" data-open={open || undefined} data-lenis-prevent>
      {open && (
        <div
          id={panelId}
          ref={panelRef}
          className="ask-bot-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Ask about this work"
        >
          <header className="ask-bot-head">
            <div>
              <p className="ask-bot-title">Ask about this work</p>
              <p className="ask-bot-sub">Answers built from this site&rsquo;s own content</p>
            </div>
            <button
              type="button"
              className="ask-bot-close"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div ref={threadRef} className="ask-bot-thread">
            {turns.length === 0 && (
              <div className="ask-bot-intro">
                <p>
                  Hello. Ask me about the roles, the projects, any technology by name, or
                  how to get in touch.
                </p>
                <p className="ask-bot-caveat">
                  I answer only from what is published here — if I do not have something,
                  I will say so rather than guess.
                </p>
              </div>
            )}

            <ol className="ask-bot-turns">
              {turns.map((turn) => (
                <li key={turn.id} className="ask-bot-turn">
                  <p className="ask-bot-question">{turn.question}</p>

                  {turn.answer ? (
                    <div className="ask-bot-answer">
                      {/* Split on newlines rather than rendering markdown: the answer is
                          plain text by design, and a renderer here would be a route for
                          content to become markup. */}
                      {turn.answer.answer.split("\n").map((line, i) =>
                        line.trim() ? <p key={i}>{line}</p> : null,
                      )}

                      {turn.answer.sources.length > 0 && (
                        <ul className="ask-bot-sources" aria-label="Where this came from">
                          {turn.answer.sources.map((source) => (
                            <li key={source.path + source.label}>
                              <Link
                                href={source.path}
                                className="ask-bot-source"
                                onClick={() => setOpen(false)}
                              >
                                {source.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="ask-bot-pending" aria-live="polite">
                      <span />
                      <span />
                      <span />
                      <span className="sr-only">Looking</span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <div ref={endRef} />
          </div>

          <div className="ask-bot-prompts" role="group" aria-label="Suggested questions">
            {prompts.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ask-bot-prompt"
                onClick={() => submit(prompt)}
                disabled={pending}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="ask-bot-form"
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
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask me something…"
              className="ask-bot-input"
              autoComplete="off"
              maxLength={300}
            />
            <button
              type="submit"
              className="ask-bot-send"
              disabled={pending || !question.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        className="ask-bot-launch"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <AskBotFigure className="ask-bot-figure" />
        <span className="ask-bot-label">{open ? "Close" : "Ask me"}</span>
      </button>
    </div>
  );
}
