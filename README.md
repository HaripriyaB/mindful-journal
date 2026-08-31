# Mindful Journal

A private, AI-powered journaling app that turns everyday reflection into a guided practice in emotional growth. Write (or speak) your thoughts, and Gemini responds with sharp, poetic reflections, tracks how your emotions evolve over time, and turns your journal into a living map of your inner life — complete with photos, locations, and multilingual voice dictation.

## What it does

- **Write or speak your entry.** Type freely, or dictate in **Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu**, Indian English, or mixed "Hinglish" — Gemini auto-detects the language and translates it into rich, natural English journal prose while preserving your original tone and detail.
- **Reflect with an AI companion.** A streaming chat drawer offers concise, non-cliché, psychologically grounded reflections on your entry — never generic therapy-speak — anchored by a bolded "core takeaway" and a single piercing follow-up question.
- **Track your emotional evolution.** Each entry is scored for sentiment and broken down across seven emotional dimensions (joy, calm, gratitude, stress, sadness, inspiration, energy), visualized with interactive charts, radar plots, and mood trends over 7/30/all-time windows.
- **Get a longitudinal growth report.** Gemini synthesizes your journal history into a narrative of your emotional trajectory — key milestones, strengths, coaching advice, and a recommended focus for what's next.
- **Attach memory context.** Tag entries with photos and real-world locations (with curated "sanctuary" presets across India) so reflections are grounded in a specific place and moment.
- **Auto-generated titles & tags.** Every entry gets a poetic, evocative title and relevant reflection tags without any manual effort.
- **Works even when the AI doesn't.** Every AI feature has a thoughtful local fallback (heuristic titles, tags, and reflections), so the app stays fully usable offline or without an API key.
- **Private by design.** Entries are stored per-user in Firestore (with a local-storage backup/cache), support Google sign-in or anonymous guest mode, and are never shared.

## The innovation

Most journaling apps either do nothing with your writing or bolt on a generic chatbot. Mindful Journal is built around a few ideas that make the AI feel like a genuine companion rather than a gimmick:

1. **Resilient AI by design, not by accident.** Every Gemini call — chat, streaming chat, titles, tags, sentiment, translation, evolution reports — runs through a model *cascade* (`gemini-3.1-flash-lite → gemini-3.7-flash → gemini-flash-latest`) with automatic retries on transient errors (503/429/`RESOURCE_EXHAUSTED`), and a hand-crafted local fallback for every single feature if all models are unavailable. The product never shows an error screen; it degrades gracefully to a still-useful, on-brand experience.
2. **Editorial constraints on the AI's voice.** The reflection prompt enforces strict brevity (45–75 words), bans therapy clichés, and mandates a fixed structure (observation → bolded insight → single anchor question). This is prompt engineering as UX design — it keeps AI reflections sharp and re-readable instead of generic AI filler.
3. **India-first multilingual voice journaling.** Rather than a bolt-on "translate" button, speech-to-text dictation is a first-class entry point: the app detects the spoken Indian language (or code-mixed speech like Tanglish/Kanglish/Hinglish), cleans up disfluencies, and produces polished English journal prose — while preserving the original transcript for authenticity.
4. **Emotion as a longitudinal signal, not a single data point.** Instead of a one-off mood tag, every entry contributes a 7-dimension emotional fingerprint that compounds into trend charts and an AI-generated growth narrative — turning a journal from a diary into a personal emotional-analytics tool.
5. **Context-aware reflection.** Photos, location, and mood are woven directly into the AI's prompt context, so reflections and photo insights are grounded in the specifics of *your* moment, not generic advice.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, Recharts, Framer Motion (`motion`), Lucide icons |
| Backend | Express 4 (TypeScript, run via `tsx`), server-side Gemini integration via `@google/genai` |
| AI | Google Gemini (`gemini-3.1-flash-lite`, `gemini-3.7-flash`, `gemini-flash-latest`) with streaming, JSON-mode, and low-latency thinking config |
| Data | Firebase Auth (Google sign-in + anonymous guest) and Firestore, with a `localStorage` cache/fallback for offline resilience |
| Build | Vite (client) + esbuild (server bundle), deployable as a single Node process (e.g. Cloud Run) |

## Project structure

```
src/
  components/     # UI: journal editor, chat drawer, voice recorder, photo/location pickers, charts
  lib/             # Firebase, auth, journal persistence, API client, local heuristics (titles/tags)
  types.ts         # Shared domain types (JournalEntry, EmotionAnalysis, MoodType, ...)
server.ts          # Express API: Gemini endpoints (chat, streaming chat, titles, tags,
                    #   emotion analysis, speech translation, evolution reports, photo insight)
```

## Getting started

```bash
npm install
cp .env.example .env   # add your GEMINI_API_KEY
npm run dev             # starts the Express + Vite dev server
```

Build & run for production:

```bash
npm run build
npm start
```

### Environment variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables all AI features. Without it, every feature falls back to a local heuristic equivalent. |
| `PORT` | Port to bind to (defaults to `3000`; platforms like Cloud Run inject this automatically). |

## API overview

All AI endpoints live under `/api/gemini/*` and are designed to **never fail hard** — each returns a sensible fallback payload on any error:

- `POST /api/gemini/chat` / `/api/gemini/chat-stream` — conversational & streaming journal reflection
- `POST /api/gemini/generate-title` — poetic title generation
- `POST /api/gemini/generate-tags` — reflection tag extraction
- `POST /api/gemini/analyze-emotions` — sentiment + 7-dimension emotion breakdown
- `POST /api/gemini/translate-speech` — Indian language speech-to-text translation & cleanup
- `POST /api/gemini/evolution-report` — longitudinal emotional growth report across entries
- `POST /api/gemini/generate-prompt` — dynamic journaling prompt suggestions
- `POST /api/gemini/photo-insight` — poetic reflection generation from a photo + location
- `GET /api/health` — health check
