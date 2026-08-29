import type { ConversationSummary } from '../../types';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNewChat }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-console-border bg-console-panel sm:flex">
      <div className="flex items-center justify-between border-b border-console-border px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-widest text-console-muted">agentic-ai</span>
        <button
          onClick={onNewChat}
          className="rounded border border-console-border px-2 py-1 font-mono text-xs text-console-accent transition hover:border-console-accent"
        >
          + new
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-sm text-console-muted">No conversations yet.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`mb-1 block w-full truncate rounded px-2 py-2 text-left text-sm transition ${
              c.id === activeId
                ? 'bg-console-border text-console-text'
                : 'text-console-muted hover:bg-console-border/50 hover:text-console-text'
            }`}
          >
            {c.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}
