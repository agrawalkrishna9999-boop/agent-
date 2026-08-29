export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMStreamHandlers {
  onText: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface LLMProvider {
  streamChat(messages: ChatMessage[], handlers: LLMStreamHandlers): Promise<void>;
}
