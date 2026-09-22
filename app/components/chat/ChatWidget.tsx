import {useEffect, useRef, useState} from 'react';
import {useFocusTrap} from '~/hooks/useFocusTrap';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatApiResponse {
  reply?: string;
  error?: string;
}

const MAX_HISTORY_SENT = 6;

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h13A2.5 2.5 0 0 1 20 4.5v8A2.5 2.5 0 0 1 17.5 15H8l-4.5 4v-4H4.5A2.5 2.5 0 0 1 2 12.5v-8Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M3.5 3.5l11 11M14.5 3.5l-11 11" />
    </svg>
  );
}

/**
 * Site-wide storefront Q&A chat widget. Answers product/sizing/policy
 * questions using /api/chat, which grounds every reply in a live Storefront
 * API search plus fixed store facts -- it never has access to orders,
 * checkout, or customer account data.
 *
 * Conversation state is in-memory only (resets on reload/navigation) --
 * acceptable for a v1 assist widget, not a persisted support inbox.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const {containerRef} = useFocusTrap(open, () => setOpen(false));

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const nextMessages: ChatMessage[] = [...messages, {role: 'user', content: trimmed}];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(0, -1).slice(-MAX_HISTORY_SENT),
        }),
      });

      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok || !data.reply) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setMessages((prev) => [...prev, {role: 'assistant', content: data.reply as string}]);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Chat with us'}
        aria-expanded={open}
        aria-controls="chat-widget-panel"
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>

      {open && (
        <div
          id="chat-widget-panel"
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Legendary Branding"
          className="fixed bottom-24 right-5 z-[90] flex h-[min(32rem,70dvh)] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-canvas)] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-sm font-medium tracking-wide">Legendary Branding</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <CloseIcon />
            </button>
          </div>

          <div
            ref={listRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
          >
            {messages.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">
                Ask about sizing, materials, our collections, or shipping and returns.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-[var(--color-accent)] text-white'
                    : 'mr-auto bg-[var(--color-surface)] text-[var(--color-ink)]'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="mr-auto max-w-[85%] rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-muted)]">
                Thinking…
              </div>
            )}
            {error && (
              <div role="alert" className="mr-auto max-w-[85%] rounded-xl bg-[var(--color-surface)] px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[var(--color-border)] p-3">
            <label htmlFor="chat-widget-input" className="sr-only">
              Type your message
            </label>
            <input
              id="chat-widget-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              maxLength={500}
              disabled={sending}
              className="flex-1 rounded-full border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 8h11M8 2l5 6-5 6" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
