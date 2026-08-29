import { Router } from 'express';
import {
  addMessage,
  createConversation,
  getConversation,
  getMessages,
  listConversations,
  touchConversation,
} from '../database/database';
import { FreeLLMProvider } from '../llm/FreeLLMProvider';
import type { LLMProvider } from '../llm/LLMProvider';
import { logger } from '../utils/logger';

const router = Router();
const llm: LLMProvider = new FreeLLMProvider();

function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New conversation';
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

router.get('/conversations', (_req, res) => {
  res.json({ conversations: listConversations() });
});

router.get('/conversations/:id/messages', (req, res) => {
  const conversation = getConversation(req.params.id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  res.json({ conversation, messages: getMessages(req.params.id) });
});

router.post('/chat', async (req, res) => {
  const { conversationId: incomingId, message } = req.body as {
    conversationId?: string;
    message?: string;
  };

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required.' });
    return;
  }

  let conversationId = incomingId;
  if (conversationId && !getConversation(conversationId)) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  if (!conversationId) {
    conversationId = createConversation(deriveTitle(message));
  }

  addMessage(conversationId, 'user', message.trim());
  const history = getMessages(conversationId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('conversation', { conversationId });

  await llm.streamChat(history, {
    onText: (chunk) => send('delta', { text: chunk }),
    onDone: (fullText) => {
      addMessage(conversationId!, 'assistant', fullText);
      touchConversation(conversationId!);
      send('done', {});
      res.end();
    },
    onError: (error) => {
      logger.error('LLM stream failed', { conversationId, error: error.message });
      send('error', { message: error.message });
      res.end();
    },
  });
});

export default router;
