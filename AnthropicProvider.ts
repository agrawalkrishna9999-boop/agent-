import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, LLMProvider, LLMStreamHandlers } from './LLMProvider';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// No tools yet — Phase 2 (Tool system) and Phase 3 (Agent loop) are what turn this
// into an actual agent. For now it's a direct, undecorated chat completion.
const SYSTEM_PROMPT =
  'You are the chat layer of a personal agentic AI platform that is still being built. ' +
  'You have no tools yet — answer directly and concisely, no filler.';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic | null = null;
  private initError: string | null = null;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key) {
      this.initError = 'ANTHROPIC_API_KEY is not set. Add it to your .env file and restart the server.';
      return;
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async streamChat(messages: ChatMessage[], handlers: LLMStreamHandlers): Promise<void> {
    if (!this.client) {
      handlers.onError(new Error(this.initError ?? 'LLM provider is not configured.'));
      return;
    }

    let fullText = '';
    try {
      const stream = this.client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      stream.on('text', (delta) => {
        fullText += delta;
        handlers.onText(delta);
      });

      stream.on('error', (err) => {
        handlers.onError(err instanceof Error ? err : new Error('Streaming error.'));
      });

      await stream.finalMessage();
      handlers.onDone(fullText);
    } catch (err) {
      handlers.onError(err instanceof Error ? err : new Error('Unknown LLM error.'));
    }
  }
}
