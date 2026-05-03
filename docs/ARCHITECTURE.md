# Patricia Architecture

Patricia is currently a server-light Vercel app. The design must respect four limits:

1. no database yet;
2. no permanent audio storage yet;
3. Groq/free API usage cannot process unlimited long judgments in one shot;
4. legal answers must be traceable to real text or source leads.

## Runtime layout

```text
User browser
  ├─ Next.js UI
  ├─ localStorage case metadata
  ├─ localStorage chat history
  ├─ localStorage queue jobs
  ├─ RAM/session state
  ├─ exportable Markdown/JSON case files
  ├─ object URLs for generated/imported audio
  └─ HTMLAudioElement playback

Vercel
  ├─ /api/patricia/chat
  │    ├─ East African research lead fetcher
  │    └─ Groq OpenAI-compatible chat completions
  ├─ /api/patricia/research
  │    └─ trusted legal/news source search
  └─ /api/patricia/import
       └─ trusted HTML source import
```

## Dependability standard

Patricia should be useful to students, lawyers, and researchers, but it must not pretend to be a lawyer or a court database. Dependability means:

- every serious legal answer should be based on pasted/imported text or source leads;
- official sources outrank legal indexes;
- legal indexes outrank news;
- news is context only, not authority;
- uncertain results must be labelled as leads that need verification;
- users can export saved text out of browser storage.

## Why browser storage first

Because there is no server database, Patricia cannot honestly promise permanent account-level storage. The current MVP should say the truth:

- cases are saved in the user's current browser;
- chat history is saved in the user's current browser;
- audio is local/session-based unless downloaded or later stored in IndexedDB/backend storage;
- clearing browser data can remove saved records;
- another device will not see the same records.

## Legal research pipeline

```text
User asks for a case/law/source
  ↓
Patricia checks local selected case text
  ↓
If no strong local context exists, Patricia searches trusted East African sources
  ↓
Sources are labelled by authority level
  ↓
Groq receives source leads, not hidden fake memory
  ↓
Patricia answers with verification boundaries and source URLs
```

## Trusted source import pipeline

```text
Research result
  ↓
Trusted host allow-list check
  ↓
Fetch HTML source server-side
  ↓
Extract readable title and text
  ↓
Save as local case record
  ↓
Queue chunk summaries
  ↓
User can chat against imported text
```

Current import is HTML-first. PDF import and source-specific parsers should come next.

## Case processing pipeline

```text
Paste/upload/import real case
  ↓
Extract title + metadata
  ↓
Split into safe chunks
  ↓
Save case record locally
  ↓
Queue summary jobs
  ↓
Summarise chunks through Groq one-by-one
  ↓
Build final case brief from chunk summaries
  ↓
Generate narration script per chunk
  ↓
Generate/store/play audio chunks
```

## Handling 1-2 hour case audio

Do not generate one huge audio file.

A 1-2 hour legal narration should be split into a queue:

```text
Case A
  ├─ Part 01 - Background
  ├─ Part 02 - Facts
  ├─ Part 03 - Issues
  ├─ Part 04 - Court analysis
  ├─ Part 05 - Holding
  └─ Part 06 - Orders
```

Each chunk can fail, retry, regenerate, or be skipped independently. This protects the user from losing the whole job when one API request fails.

## Handling many uploaded case laws

Patricia should not process all uploads at the same time. Use a single queue:

```text
Queued → Reading → Summarising → Ready for audio → Narrating → Saved → Failed/Retry
```

Rules:

- one active Groq request at a time on the free tier;
- store partial results after every completed chunk;
- show queue progress;
- pause automatically when rate-limited;
- let users prioritise which case to process first;
- generate summaries before audio because summaries are cheaper and more useful.

## Model strategy for weaker LLMs

Patricia must assume the model is not brilliant. That means:

- ask for structured JSON or short labelled sections;
- give one task per request;
- never ask the model to analyse an entire long judgment at once;
- include only the relevant chunk and a narrow instruction;
- include authority levels and URLs in the prompt;
- merge outputs deterministically in app code where possible.

## Storage roadmap

### Current

- `localStorage` for metadata.
- `localStorage` for chat and queue jobs.
- Markdown export for individual cases.
- JSON export for the whole local library.
- RAM/object URLs for audio playback.

### Better browser-only version

- IndexedDB for large legal text and audio blobs.
- Export/import `.patricia.json` project files.
- Downloadable MP3 chunks and summary PDFs.
- Search index over imported local cases.

### Production version

- Auth.
- Database.
- Object storage for audio.
- Per-user queues.
- Background workers.
- Rate-limit tracking.
- Audit log for legal-source provenance.
- Source-specific parsers for Kenya Law, EACJ, Ulii, TanzLII, and AfricanLII.
