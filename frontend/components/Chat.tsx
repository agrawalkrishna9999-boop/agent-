import { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import MarkdownMessage from './MarkdownMessage';
import type { ChatMessage } from '../../types';

interface ChatProps {
  conversationId: string | null;
  onConversationStart: (id: string) => void;
  onConversationUpdated: () => void;
}

interface DisplayMessage extends ChatMessage {
  streaming?: boolean;
}

export default function Chat({ conversationId, onConversationStart, onConversationUpdated }: ChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history whenever the active conversation changes (including "new chat" -> null).
  useEffect(() => {
    setError(null);
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!res.ok) throw new Error('Failed to load conversation');
        const data = (await res.json()) as { messages: ChatMessage[] };
        if (!cancelled) setMessages(data.messages);
      } catch {
        if (!cancelled) setError('Could not load that conversation.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(text: string) {
    setError(null);
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '', streaming: true },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: text }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'The server could not start a response.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;
          const lines = rawEvent.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event:'));
          const dataLine = lines.find((l) => l.startsWith('data:'));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.slice('event:'.length).trim();
          const payload = JSON.parse(dataLine.slice('data:'.length).trim());

          if (eventName === 'conversation') {
            if (!conversationId) onConversationStart(payload.conversationId);
          } else if (eventName === 'delta') {
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const next = prev.slice(0, -1);
              const last = prev[prev.length - 1];
              next.push({ ...last, content: last.content + payload.text });
              return next;
            });
          } else if (eventName === 'error') {
            throw new Error(payload.message);
          }
        }
      }

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.slice(0, -1);
        const { streaming: _streaming, ...rest } = prev[prev.length - 1];
        next.push(rest);
        return next;
      });
      onConversationUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setMessages((prev) => prev.filter((m) => !m.streaming));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 && (
          <p className="mx-auto max-w-md pt-16 text-center text-sm text-console-muted">
            Send a message to start. This is Phase 1 — plain chat, no tools yet.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[80%] rounded-lg bg-console-border px-4 py-2 text-sm'
                  : 'max-w-[80%] border-l-2 border-console-accent bg-console-panel px-4 py-2'
              }
            >
              {m.role === 'assistant' && (
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-console-accent">
                  agent
                </div>
              )}
              {m.role === 'user' ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : (
                <>
                  <MarkdownMessage content={m.content} />
                  {m.streaming && <span className="cursor-blink font-mono text-console-accent">▊</span>}
                </>
              )}
            </div>
          </div>
        ))}
        {error && (
          <p className="mx-auto max-w-md rounded border border-console-warn/40 bg-console-warn/10 px-3 py-2 text-center text-sm text-console-warn">
            {error}
          </p>
        )}
      </div>
      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
