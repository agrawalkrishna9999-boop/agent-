# Agentic AI - Phase 1

**Now using FreeLLMAPI for free LLM access!** No paid API keys required.

## Setup

### Prerequisites
- Node.js 18+ (20+ recommended for FreeLLMAPI support)
- Optional: FreeLLMAPI instance running (see below)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# FreeLLMAPI Configuration (free)
FREELLM_API_URL=http://localhost:3001/v1
FREELLM_API_KEY=your-freellm-key-here
LLM_MODEL=gpt-3.5-turbo

# Server
PORT=3001
```

#### Option A: Use Public FreeLLMAPI Instance
Set `FREELLM_API_URL` to a public instance (if available).

#### Option B: Self-Host FreeLLMAPI

```bash
git clone https://github.com/tashfeenahmed/freellmapi.git
cd freellmapi
npm install
printf "ENCRYPTION_KEY=$(openssl rand -hex 32)\nPORT=3001" > .env
npm run dev
```

Then set `FREELLM_API_URL=http://localhost:3001/v1` in your agentic-ai `.env`.

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Build

```bash
npm run build
npm start
```

## TypeScript & Build

```bash
# Type checking
npm run typecheck

# Build only
npm run build:client
npm run build:server
```

## Features (Phase 1)

✅ Chat UI with streaming responses
✅ Conversation history & SQLite persistence
✅ Markdown message rendering
✅ Error handling & SSE streaming
✅ Free LLM via FreeLLMAPI (supports 34+ providers)
✅ No paid API keys required

## Architecture

```
frontend/
├── App.tsx              # Main app component
├── main.tsx             # React entry point
├── components/
│   ├── Chat.tsx         # Chat interface
│   ├── Sidebar.tsx      # Conversation sidebar
│   ├── MessageInput.tsx # Message input textarea
│   └── MarkdownMessage.tsx # Markdown renderer
├── index.css            # Tailwind styles
└── index.html           # HTML root

src/
├── server.ts            # Express server
├── api/
│   └── chat.ts          # Chat endpoints & streaming
├── database/
│   └── database.ts      # SQLite operations
├── llm/
│   ├── FreeLLMProvider.ts # FreeLLMAPI integration
│   └── LLMProvider.ts     # LLM interface
└── utils/
    └── logger.ts        # Logging utility
```

## Notes

- **Phase 1** = Chat, history, streaming, markdown. No agent/tools yet.
- **Phase 2** = Tool system & agentic loop (planned).
- **FreeLLMAPI** aggregates 34+ free LLM providers. No credit card required.
- Conversation history persists in SQLite (`agentic.db`).

## License

MIT
