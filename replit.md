# AgriAssist

AI-powered smart farming platform for Filipino farmers, built exclusively for the Philippines using official PSGC (Philippine Standard Geographic Code) location data.

## Run & Operate

- `bash scripts/start-api-server.sh` — start Ollama + API server (port 8080)
- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/agri-assistant run dev` — run the frontend (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (Postgres), `GROQ_API_KEY` (Groq AI), `MONGODB_URI` (MongoDB Atlas chat history)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080)
- DB: PostgreSQL + Drizzle ORM (farm data), MongoDB Atlas + Mongoose (chat history)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- AI Chat: LLaMA 3.3 70B via Groq API (`llama-3.3-70b-versatile`)
- AI Dashboard/Market: OpenRouter (free models)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React 19 + Vite + Wouter + TanStack Query

## Where things live

- `artifacts/agri-assistant/` — React frontend (port 5000)
- `artifacts/api-server/` — Express backend (port 8080)
- `artifacts/api-server/src/routes/chat.ts` — AI chat route (Groq + LLaMA 3.3 70B, SSE streaming)
- `artifacts/api-server/src/lib/mongodb.ts` — MongoDB/Mongoose models (Conversation, Message)
- `artifacts/api-server/src/routes/farming-plan.ts` — PSGC-strict farm planning
- `lib/db/src/schema/` — Drizzle DB schema (farming_plans, ph-crops)
- `lib/integrations-openrouter-ai/` — OpenRouter client (used for dashboard/market AI)
- `scripts/start-api-server.sh` — Ollama startup + API server launcher

## Architecture decisions

- **Groq + LLaMA 3.3 70B for chat**: All AI chat uses LLaMA 3.3 70B via Groq API with SSE streaming. Fast, high-quality responses with no local model overhead.
- **MongoDB for chat history**: Chat conversations and messages are stored in MongoDB Atlas (`Conversation` + `Message` collections). PostgreSQL is no longer used for chat.
- **PSGC-strict location**: Farm planner and AI chat context are always tied to PSGC region/province/city codes. Free-text location input is rejected. If location is missing, users are redirected to onboarding/settings.
- **Cache key = PSGC code**: Farm plans are cached in PostgreSQL using the city/province PSGC code as the key, not a free-text string.
- **Category navigation cards**: Dashboard shows quick-access cards for Weather, Crops, Market, Farm Planner, and AI Chat — on both mobile and desktop layouts.

## Product

- **Dashboard**: Overview with weather hero, category nav cards, market prices, AI summaries
- **Weather**: Live + forecast weather for the farmer's PSGC location
- **Crops**: Philippine crop database (DA Philippines data)
- **Market**: Live commodity prices with AI market insights
- **Farm Planner**: GDD-based farming schedules using real climate data (Open-Meteo ERA5). PSGC-locked.
- **AI Chat** (`/chat`): LLaMA 3.3 70B agriculture specialist via Groq. Answers questions about crops, pests, fertilizers, weather, and market prices. Conversation history in MongoDB Atlas.
- **Settings**: PSGC location management, crop profile, theme

## User preferences

- Philippines/PSGC-specific only (no other countries)
- Groq + LLaMA 3.3 70B for all AI chat
- No free-text location input anywhere
- Conversation memory persisted in MongoDB Atlas

## Gotchas

- Ollama still runs for the startup script but chat no longer uses it — the main API server uses Groq instead.
- `GROQ_API_KEY` and `MONGODB_URI` must be set as Replit Secrets.
- The Agri Assistant workflow at port 5000 proxies all `/api/*` calls to the API server at port 8080.
- Farm plan generation is blocked if `regionCode` and `provinceCode` are missing from the request body (returns HTTP 422 with `code: "PSGC_MISSING"`).
- MongoDB conversations use `_id` (ObjectId as string), not numeric `id`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- PSGC API: `https://psgc.gitlab.io/api` — used for region/province/city data during onboarding
- Open-Meteo API: `https://api.open-meteo.com` + `https://archive-api.open-meteo.com` — weather data (free, no key)
- Groq console: `https://console.groq.com` — API keys, model list, usage
