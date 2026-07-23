"use client";

import type { RetirementProfile } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { LoaderCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_SUGGESTIONS_US = [
  "Can I retire one year earlier?",
  "What if I buy a vacation home?",
  "Should I convert more to Roth?",
  "Can I gift $30k?",
  "What if the market drops 25%?",
  "Should I delay Social Security?",
];

const DEFAULT_SUGGESTIONS_CA = [
  "Can I retire one year earlier?",
  "Should I withdraw from my TFSA first?",
  "When should I convert my RRSP to a RRIF?",
  "Can I gift $30k?",
  "What if the market drops 25%?",
  "Should I delay CPP until 70?",
];

type Msg = { role: "user" | "assistant"; content: string };

export function PlanChat({ profile }: { profile: RetirementProfile }) {
  const suggestions =
    profile.country === "CA"
      ? DEFAULT_SUGGESTIONS_CA
      : DEFAULT_SUGGESTIONS_US;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Ask anything about your plan. I’ll answer using your real accounts, taxes, and timeline.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    const history = messages.filter(
      (m, i) => i > 0 && (m.role === "user" || m.role === "assistant"),
    );

    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          profile,
          history,
        }),
      });
      const data = (await res.json()) as {
        answer?: string;
        error?: string;
      };

      const answer =
        data.answer ??
        data.error ??
        "I couldn’t answer that just now. Try again in a moment.";

      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Something went wrong reaching the assistant. Check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[420px] flex-col rounded-[1.5rem] border border-line bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={cn(
              "max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base leading-relaxed",
              m.role === "user"
                ? "ml-auto bg-ink text-white"
                : "bg-mist text-ink",
            )}
          >
            {m.content}
          </div>
        ))}
        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-mist px-4 py-3 text-base text-ink-soft">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Thinking about your plan…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => ask(s)}
            className="rounded-full border border-line bg-paper px-3 py-2 text-sm font-medium text-ink-soft transition hover:border-accent/40 hover:text-ink disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          disabled={loading}
          className="min-h-12 flex-1 rounded-2xl border border-line bg-white px-4 text-base outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={loading || !input.trim()}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white hover:bg-accent-deep disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
