# Patricia Architecture

Patricia is currently a server-light Vercel app. The design must respect three limits:

1. no database yet;
2. no permanent audio storage yet;
3. Groq/free API usage cannot process unlimited long judgments in one shot.

## Runtime layout

```text
User browser
  ├─ Next.js UI
  ├─ localStorage case metadata
  ├─ RAM/session state
  ├─ object URLs for generated/imported audio
  └─ HTMLAudioElement playback

Vercel
  └─ /api/patricia/chat
       └─ Groq OpenAI-compatible chat completions
```

## Why browser storage first

Because there is no server database, Patricia cannot honestly promise permanent account-level storage. The current MVP should say the truth:

- cases are saved in the user's current browser;
- audio is local/session-based unless downloaded or later stored in IndexedDB/backend storage;
- clearing browser data can remove saved records;
- another device will not see the same records.

## Case processing pipeline

```text
Paste/upload real case
  ↓
Extract title + metadata
  ↓
Split into safe chunks
  ↓
Save case record locally
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
- merge outputs deterministically in app code where possible.

## Storage roadmap

### Current

- `localStorage` for metadata.
- RAM/object URLs for audio playback.

### Better browser-only version

- IndexedDB for large audio blobs.
- Export/import `.patricia.json` project files.
- Downloadable MP3 chunks and summary PDFs.

### Production version

- Auth.
- Database.
- Object storage for audio.
- Per-user queues.
- Background workers.
- Rate-limit tracking.
- Audit log for legal-source provenance.
