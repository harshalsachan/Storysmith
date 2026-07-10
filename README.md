# AI Storyteller

An AI-powered interactive fiction web app where an AI game master writes the story in real time, tracks character and world state, and reacts to your decisions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS v4 |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| AI | Anthropic Claude API |

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key
- A Supabase project (for PostgreSQL)

### Setup

1. **Clone and install:**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Configure the server:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your ANTHROPIC_API_KEY and DATABASE_URL
   ```

3. **Set up the database:**
   ```bash
   cd server
   npx prisma db push
   ```

4. **Start both servers:**
   ```bash
   # Terminal 1 — Backend
   cd server && npm run dev

   # Terminal 2 — Frontend
   cd client && npm run dev
   ```

5. Open `http://localhost:5173` in your browser.

## Features

- 🎭 **4 genres:** Fantasy, Sci-Fi, Mystery, Horror — each with unique prompts and theming
- ✍️ **Free-text input** + AI-suggested action buttons
- 📊 **Real-time character tracking** — stats, inventory, and story flags
- 🔄 **Streaming responses** — typewriter-style narrative display
- 💾 **Persistent stories** — leave and resume anytime
- 🛡️ **Prompt injection guards** — player input is sandboxed
- 📖 **Rolling context summaries** — keeps stories coherent over 20+ turns

## Architecture

```
client/  → React SPA (Vite + Tailwind)
server/  → Express API
  ├── routes/     → REST endpoints
  ├── services/   → AI, context manager, state extraction
  ├── prompts/    → Game master system prompts per genre
  └── prisma/     → Database schema
```

## License

MIT
