# Patricia

Patricia is a browser-first legal assistant for reading, questioning, summarising, and listening to case law. The product is designed for a hosted Vercel deployment without a permanent backend database. It should not pretend to have cases, users, paid plans, or stored audio that do not exist. User-created case records and generated audio are stored in the browser using `localStorage`, in-memory state, and object URLs until a real storage backend is added.

Patricia's job is simple: take real legal text from the user, help the user understand it, and turn the useful parts into listenable audio without overwhelming free AI limits.

## Current technical reality

- Framework: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Hosting target: Vercel.
- AI provider: Groq through a server-side API route.
- Client persistence: browser `localStorage` for case metadata and audio queue records.
- Runtime audio: browser `HTMLAudioElement` playback from generated or imported audio URLs.
- No Supabase, no database, no permanent file server, no fake case library.

## Environment variables

Create these in `.env.local` for development and in Vercel Project Settings for production:

```bash
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

The default model is intentionally small. Patricia must work even with lower-intelligence/free-tier models, so prompts and workflows should reduce each task into small, clear steps instead of sending massive judgments in one request.

## What Patricia should do

### 1. Real input only

Patricia should accept real legal material from the user:

- pasted judgment text;
- uploaded PDF or text file;
- imported case text from a trusted legal source when that feature is added.

The app should not show hard-coded recent cases as if the user created them. Empty states are better than fake data.

### 2. Legal assistant behavior

Patricia should answer as a careful legal research assistant:

- summarise facts, issues, holdings, reasoning, orders, and cited authorities;
- explain legal language in plain English;
- extract party names, court, date, judge, citation, statutes, and legal principles when present;
- say when the provided text is insufficient;
- never invent citations, statutes, holdings, or case names.

### 3. Audio behavior

Patricia should reuse the voice pattern from the beta portfolio where possible, but the legal audio layer must be chunk-based. Case law audio can easily become one or two hours long, and one long audio job is the wrong architecture for a free Groq/API workflow.

The correct design is:

1. split the judgment into sections;
2. summarise or clean each section;
3. generate audio section by section;
4. save each audio chunk locally;
5. play the chunks as a queue;
6. allow resume, skip, and regenerate per section.

A one-hour judgment should become many smaller tracks, not one fragile request.

## Long case-law strategy

Large judgments must be processed like a book, not like a chat message.

### Chunking rules

- Split by headings first: background, facts, issues, analysis, disposition, orders.
- If headings are missing, split by paragraph groups.
- Keep each AI request small enough for the selected Groq model.
- Store intermediate summaries in the browser so failed requests do not destroy progress.
- Treat every chunk independently, then create a final combined brief from chunk summaries.

### Audio rules

- Do not convert the entire judgment into one audio file.
- Generate audio chunks of roughly 5-10 minutes each.
- Store chunk metadata in `localStorage`.
- Keep the actual audio as a browser object URL or IndexedDB entry until a real backend is added.
- Show users which chunks are ready, failed, queued, or skipped.

### When the user uploads many cases

Free APIs cannot safely process everything at once. Patricia should use a queue:

- one active AI job at a time;
- retry failed chunks with backoff;
- summarise first, narrate later;
- let the user choose priority cases;
- warn when the browser storage limit is near;
- export/download generated notes so the user does not lose work.

## Files added or corrected

- `src/app/api/patricia/chat/route.ts` — server-side Groq chat route. Keeps the Groq API key off the browser.
- `src/lib/patricia-storage.ts` — browser persistence helpers for case records and audio chunks.
- `src/lib/patricia-processing.ts` — chunking, narration-time estimation, and case-title helpers.
- `src/components/Sidebar.tsx` — now reads recent cases from browser storage instead of hard-coded mock cases.
- `src/components/RightSidebar.tsx` — now reads saved case/audio records from browser storage instead of mock case-law cards.
- `src/components/AudioPlayer.tsx` — now accepts a real track, uses an actual `<audio>` element, and shows real progress.

## Development

```bash
npm install
npm run dev
```

Build locally before deploying:

```bash
npm run build
```

## Deployment on Vercel

1. Push to GitHub.
2. Connect the repository to Vercel.
3. Add `GROQ_API_KEY` and `GROQ_MODEL` in Vercel environment variables.
4. Redeploy.

Do not expose `GROQ_API_KEY` with a `NEXT_PUBLIC_` prefix. It must remain server-side.

## Product warning

Patricia is a legal research assistant, not a lawyer. The interface should always encourage verification against the original judgment and the applicable law. It should help users read and reason faster, not replace professional legal judgment.

## Next implementation steps

1. Add a real document intake page that saves pasted/uploaded text with `savePatriciaCase`.
2. Add a queue UI for long judgments and many uploaded cases.
3. Add text-to-speech integration using the same voice direction as the beta portfolio.
4. Move audio blob storage from object URLs to IndexedDB for better large-file handling.
5. Add export options for summaries, legal briefs, and generated narration scripts.
6. Add source verification fields so Patricia can track where each case came from.
