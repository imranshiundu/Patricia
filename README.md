# Patricia

Patricia is a browser-first legal assistant for reading, questioning, researching, summarising, and listening to case law. The product is designed for a hosted Vercel deployment without a permanent backend database. It should not pretend to have cases, users, paid plans, or stored audio that do not exist. User-created case records and generated audio are stored in the browser using `localStorage`, in-memory state, and object URLs until a real storage backend is added.

Patricia's job is simple: take real legal text from the user, help the user understand it, fetch legal research leads from trusted East African sources, and turn useful parts into listenable audio without overwhelming free AI limits.

## Current technical reality

- Framework: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Hosting target: Vercel.
- AI provider: Groq through a server-side API route.
- Legal research: server-side source connectors for East African public legal sources.
- Client persistence: browser `localStorage` for case metadata, chat history, queue jobs, and audio queue records.
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
- legal research links from trusted public sources;
- imported case text from a trusted legal source when deeper import is added.

The app should not show hard-coded recent cases as if the user created them. Empty states are better than fake data.

### 2. Legal assistant behavior

Patricia should answer as a careful legal research assistant:

- summarise facts, issues, holdings, reasoning, orders, and cited authorities;
- explain legal language in plain English;
- extract party names, court, date, judge, citation, statutes, and legal principles when present;
- fetch source leads from East African legal websites when local context is missing;
- say when the provided text or search result is insufficient;
- never invent citations, statutes, holdings, or case names.

### 3. East African legal research

Patricia now has a research layer. It does not claim to have a full legal database in memory. It fetches live source leads and passes those leads to Groq for careful explanation.

Initial source registry:

- Kenya Law Case Law
- Kenya Law Constitution/Legislation pages
- Uganda Legal Information Institute
- Tanzania Legal Information Institute
- Zanzibar Legal Information Institute
- East African Court of Justice
- African Legal Information Institute
- selected news/context sources such as Citizen Digital and The Standard Kenya

Official legal sources must be treated as stronger authority than news. News is only context and should not be cited as the law.

### 4. Audio behavior

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

## Key files

- `src/app/api/patricia/chat/route.ts` — server-side Groq chat route with legal research leads.
- `src/app/api/patricia/research/route.ts` — research endpoint for East African legal/public sources.
- `src/lib/patricia-research.ts` — source registry and research fetcher.
- `src/lib/patricia-storage.ts` — browser persistence helpers for case records and audio chunks.
- `src/lib/patricia-processing.ts` — chunking, narration-time estimation, and case-title helpers.
- `src/lib/patricia-queue.ts` — local queue for chunked summaries/audio jobs.
- `src/components/PatriciaChat.tsx` — normal assistant chat UI.
- `src/components/ResearchClient.tsx` — legal research search UI.
- `src/components/DocumentIntakeClient.tsx` — real case intake and queue creation.
- `src/components/LibraryClient.tsx` — saved local case library.
- `src/components/QueuePanel.tsx` — long-case queue visibility.
- `src/components/AudioPlayer.tsx` — real audio playback component.

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

1. Add full HTML/document import for selected legal research results.
2. Add PDF extraction for uploaded judgments.
3. Add text-to-speech integration using the same voice direction as the beta portfolio.
4. Move audio blob storage from object URLs to IndexedDB for better large-file handling.
5. Add export options for summaries, legal briefs, source lists, and generated narration scripts.
6. Add source verification fields so Patricia can track where each case came from.
