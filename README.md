# agentic-ai — Phase 1: Chat

The first slice of the full agentic platform, scoped exactly to the Phase 1 line
from the build plan: a working chat app with streaming, history, markdown, and
error handling. No tools, agent loop, memory, or dashboard yet — that's Phase 2
onward, on top of this same codebase.

## What's here

- **Streaming chat** — Server-Sent Events from Express to the browser, token by token
- **Conversation history** — every conversation and message persisted in SQLite
- **Markdown rendering** — assistant replies render through `react-markdown` + GFM
- **Error handling** — a missing API key, a dropped stream, or a bad request all
  surface as a real message in the UI instead of a silent failure or a raw stack trace

## Setup

```bash
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the Express
server on port 3001, so both run together under `npm run dev`.

For a production-style run:

```bash
npm run build
npm start
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs the Express API and the Vite dev server together |
| `npm run build` | Builds the frontend (Vite) and compiles the backend (tsc) |
| `npm start` | Runs the compiled server, which also serves the built frontend |
| `npm run typecheck` | Type-checks both `tsconfig.json` (frontend) and `tsconfig.server.json` (backend) |

## Project structure

```
agentic-ai/
├── src/
│   ├── server.ts              Express app, static serving, error handling
│   ├── api/chat.ts            /api/chat (SSE) + /api/conversations routes
│   ├── llm/
│   │   ├── LLMProvider.ts     Provider-agnostic interface
│   │   └── AnthropicProvider.ts
│   ├── database/database.ts   SQLite schema + conversation/message CRUD
│   └── utils/logger.ts
├── frontend/
│   ├── App.tsx, main.tsx, types.ts
│   └── components/
│       ├── Sidebar.tsx        Conversation list
│       ├── Chat.tsx           Message list + SSE stream consumption
│       ├── MessageInput.tsx   Auto-resizing input, Enter to send
│       └── MarkdownMessage.tsx
├── data/                      agentic-ai.sqlite lives here (gitignored)
└── dist/                      build output (gitignored)
```

`agent/`, `tools/`, `agents/`, and `memory/` from the full architecture aren't
created yet — adding empty folders for functionality that doesn't exist yet
is exactly the "fake it" pattern the build plan says to avoid. They show up
starting Phase 2.

## Decisions made to get this running

- **LLM provider: Anthropic (Claude).** Set behind `LLMProvider` so swapping in
  another provider later means writing one new class, not touching `chat.ts`.
  Model defaults to `claude-sonnet-5`, overridable via `ANTHROPIC_MODEL` in `.env`.
- **better-sqlite3** for storage — synchronous, no async ceremony for simple
  reads/writes. If it ever fails to install on your machine, Node 22+ has a
  built-in `node:sqlite` you can swap in instead.
- **Express 4, not 5** — Express 5 changed how wildcard routes work, and the
  SPA fallback route here relies on the old `'*'` behavior.
- **SSE over fetch, not `EventSource`** — `EventSource` can't send a POST body,
  and each request needs to carry the message and conversation id. `Chat.tsx`
  parses the `text/event-stream` response manually instead.

## Next

Phase 2 (Tool system) is next per the build plan: a generic `Tool` interface,
a couple of real tools (calculator, current time are the easy first ones), and
a tool router the model can actually call into — landing in the same repo, on
top of this chat loop.
