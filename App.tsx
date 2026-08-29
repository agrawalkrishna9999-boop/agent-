import { useCallback, useEffect, useState } from 'react';
import Sidebar from './frontend/components/Sidebar';
import Chat from './frontend/components/Chat';
import type { ConversationSummary } from './types';

export default function App() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = (await res.json()) as { conversations: ConversationSummary[] };
      setConversations(data.conversations ?? []);
    } catch {
      // The sidebar list is a nice-to-have; a failed fetch here shouldn't block chat.
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  return (
    <div className="flex h-screen overflow-hidden bg-console-bg text-console-text">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNewChat={() => setActiveId(null)}
      />
      <Chat
        conversationId={activeId}
        onConversationStart={(id) => {
          setActiveId(id);
          void refreshConversations();
        }}
        onConversationUpdated={refreshConversations}
      />
    </div>
  );
}
