import type { ChatMessage, LLMProvider, LLMStreamHandlers } from './LLMProvider';

const FREELLM_BASE_URL = process.env.FREELLM_API_URL || 'http://localhost:3001/v1';
const FREELLM_API_KEY = process.env.FREELLM_API_KEY || 'default-key';
const MODEL = process.env.LLM_MODEL || 'gpt-3.5-turbo';

const SYSTEM_PROMPT =
  'You are the chat layer of a personal agentic AI platform that is still being built. ' +
  'You have no tools yet — answer directly and concisely, no filler.';

export class FreeLLMProvider implements LLMProvider {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(baseUrl?: string, apiKey?: string, model?: string) {
    this.baseUrl = baseUrl || FREELLM_BASE_URL;
    this.apiKey = apiKey || FREELLM_API_KEY;
    this.model = model || MODEL;
  }

  async streamChat(messages: ChatMessage[], handlers: LLMStreamHandlers): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`FreeLLM API error: ${response.status} ${error}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          const data = line.slice(6);

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              handlers.onText(delta);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      handlers.onDone(fullText);
    } catch (err) {
      handlers.onError(err instanceof Error ? err : new Error('Unknown LLM error'));
    }
  }
}
