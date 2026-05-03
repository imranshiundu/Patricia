# Patricia

Patricia is a browser-first East African legal research assistant for reading, questioning, researching, summarising, briefing, and listening to case law. The product is designed for a hosted Vercel deployment without a permanent backend database. It should not pretend to have cases, users, paid plans, or stored audio that do not exist.

Patricia's job is simple: take real legal text from the user, help the user understand it, fetch legal research leads from trusted East African sources, and turn useful parts into structured briefs or listenable audio without overwhelming free AI limits.

## Current technical reality

- Framework: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Hosting target: Vercel.
- AI provider: Groq through a server-side API route.
- Legal research: server-side source connectors for East African public legal sources.
- Answer safety: legal router, extraction worker, evidence ledger, final answer writer, and verification worker.
- Client persistence: browser `localStorage` for case metadata, chat sessions, queue jobs, retention records, and audio queue metadata.
- Runtime audio: browser `HTMLAudioElement` playback from generated or imported audio URLs.
- Cleanup policy: temporary import/audio records are expired after 24 hours unless the user exports or saves them.
- No Supabase, no database, no permanent file server, no fake case library.

## Environment variables

Create these in `.env.local` for development and in Vercel Project Settings for production:

```bash
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

The default model is intentionally small. Patricia must work even with lower-intelligence/free-tier models, so prompts and workflows reduce each task into small, clear steps instead of sending massive judgments in one request.

## Dependable legal answer protocol

Patricia must not answer like a generic chatbot. The chat API now routes legal answers through this workflow:

```text
User question
  -> legal router
  -> jurisdiction + intent detection
  -> trusted source research when needed
  -> case/statute extraction JSON
  -> evidence ledger
  -> final answer draft
  -> verification pass
  -> user-facing answer
```

This means Patricia does not trust one weak model call to do all the work. It forces the model to extract first, write second, and verify third.

## Evidence-ledger model

Patricia turns legal material into a claim/support ledger before writing the final answer.

Each ledger item has:

- `claim` — what Patricia wants to say;
- `support` — the supporting text or source lead;
- `source` — local legal text, imported URL, or trusted research lead;
- `confidence` — high, medium, or low;
- `kind` — local text, source lead, model extraction, or inference.

The final answer writer uses this ledger as the source of truth. The verifier removes unsupported claims and downgrades uncertain ones.

## Professional answer structure

For legal lookup/research questions, Patricia uses this structure:

```text
## Answer

## How Patricia built the answer

## Case or subject identified

## Explanation

## Verified facts

## Legal significance

## Sources and confidence

## What Patricia should check next

## Want more?
```

Forbidden answer behavior:

- no invented cases, citations, parties, statutes, holdings, courts, or dates;
- no vague claims like “I found the case” unless a source actually supports it;
- no treating news as law;
- no saying “I will try to search” inside the final answer;
- no hiding weak evidence;
- no final legal advice that replaces an advocate.

## What Patricia should do

### 1. Real input only

Patricia should accept real legal material from the user:

- pasted judgment text;
- uploaded PDF or text file;
- legal research links from trusted public sources;
- imported case text from a trusted legal source.

The app should not show hard-coded recent cases as if the user created them. Empty states are better than fake data.

### 2. Legal assistant behavior

Patricia should answer as a careful legal research assistant:

- summarise facts, issues, holdings, reasoning, orders, and cited authorities;
- explain legal language in plain English;
- extract party names, court, date, judge, citation, statutes, and legal principles when present;
- fetch source leads from East African legal websites when local context is missing;
- say when the provided text or search result is insufficient;
- never invent citations, statutes, holdings, or case names.

### 3. Saved local chats

Patricia stores multiple chat sessions in the browser:

- users can start a new chat;
- users can switch previous chats from the sidebar;
- chat history remains until the user deletes it or clears browser data/cache;
- session titles are generated from the first question;
- chats are local to that browser/device.

### 4. East African legal research

Patricia does not claim to have a full legal database in memory. It fetches live source leads and passes those leads through the evidence-ledger workflow.

Initial source registry:

- Kenya Law Case Law
- Kenya Law Constitution/Legislation pages
- Uganda Legal Information Institute
- Tanzania Legal Information Institute
- Zanzibar Legal Information Institute
- East African Court of Justice
- African Legal Information Institute
- selected news/context sources such as Citizen Digital and The Standard Kenya

Source authority order:

1. `official`
2. `legal-index`
3. `news-context`

News is only context and should not be cited as the law.

### 5. Audio behavior

Patricia should reuse the voice pattern from the beta portfolio where possible, but the legal audio layer must be chunk-based. Case law audio can easily become one or two hours long, and one long audio job is the wrong architecture for a free Groq/API workflow.

The correct design is:

1. split the judgment into sections;
2. summarise or clean each section;
3. generate audio section by section;
4. save each audio chunk locally or in IndexedDB later;
5. play the chunks as a queue;
6. allow resume, skip, and regenerate per section;
7. expire temporary audio after 24 hours unless exported/saved.

A one-hour judgment should become many smaller tracks, not one fragile request.

## Long case-law strategy

Large judgments must be processed like a book, not like a chat message.

### Chunking rules

- Split by headings first: background, facts, issues, analysis, disposition, orders.
- If headings are missing, split by paragraph groups.
- Keep each AI request small enough for the selected Groq model.
- Store intermediate summaries in the browser so failed requests do not destroy progress.
- Treat every chunk independently, then create a final combined brief from chunk summaries.

### When the user uploads many cases

Free APIs cannot safely process everything at once. Patricia should use a queue:

- one active AI job at a time;
- retry failed chunks with backoff;
- summarise first, narrate later;
- let the user choose priority cases;
- warn when the browser storage limit is near;
- export/download generated notes so the user does not lose work.

## Key files

- `src/app/api/patricia/chat/route.ts` — server-side Groq route using legal routing, extraction, evidence ledger, drafting, and verification.
- `src/lib/patricia-legal-briefing.ts` — extraction prompts, evidence ledger helpers, final-answer prompt, and verifier prompt.
- `src/app/api/patricia/research/route.ts` — research endpoint for East African legal/public sources.
- `src/app/api/patricia/import/route.ts` — trusted source import endpoint.
- `src/lib/patricia-research.ts` — source registry and authority-ranked research fetcher.
- `src/lib/patricia-legal-router.ts` — jurisdiction, intent, source-order, and answer-mode planner.
- `src/lib/patricia-chat-sessions.ts` — local multi-chat session storage.
- `src/lib/patricia-retention.ts` — 24-hour temporary import/audio cleanup helpers.
- `src/lib/patricia-storage.ts` — browser persistence helpers for case records and audio chunks.
- `src/lib/patricia-processing.ts` — chunking, narration-time estimation, and case-title helpers.
- `src/lib/patricia-queue.ts` — local queue for chunked summaries/audio jobs.
- `src/components/PatriciaChat.tsx` — professional chat UI with long-answer layout.
- `src/components/Sidebar.tsx` — navigation, saved chats, and recent cases.
- `src/components/ResearchClient.tsx` — legal research search/import UI.
- `src/components/DocumentIntakeClient.tsx` — real case intake and queue creation.
- `src/components/LibraryClient.tsx` — saved local case library and exports.
- `src/components/QueuePanel.tsx` — long-case queue visibility.
- `src/components/AudioPlayer.tsx` — real audio playback component.
- `docs/LEGAL_RESEARCH_PROTOCOL.md` — dependable legal AI workflow.
- `docs/PATRICIA_PRODUCT_STRATEGY.md` — product, sponsor, and sale-readiness strategy.

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

1. Add PDF extraction for uploaded judgments and imported legal PDFs.
2. Add source-specific parsers for Kenya Law judgments and legislation.
3. Add source-specific paragraph citation capture.
4. Add downloadable legal briefs and source appendices.
5. Add text-to-speech integration using the same voice direction as the beta portfolio.
6. Move audio blob storage from object URLs/localStorage metadata to IndexedDB.
7. Add downloadable audio chunks and legal briefs.
8. Add source verification fields so Patricia can track where each case came from.
