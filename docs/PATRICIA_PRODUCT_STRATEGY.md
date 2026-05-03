# Patricia Product Strategy

Patricia should be built as a serious East African legal research product, not a generic chatbot. The goal is to prove that dependable legal explanations can be produced even with lower-cost AI models when the system controls research, extraction, evidence, and verification.

## Positioning

Patricia is a browser-first legal research assistant for East Africa.

It helps users:

- understand case law;
- extract legal principles;
- prepare student notes;
- draft research memos;
- import trusted legal sources;
- listen to long judgments as audio;
- verify what is known, what is inferred, and what still needs checking.

## Commercial thesis

If Patricia can produce dependable legal briefs with small Groq models, then stronger models such as GPT-5.5 make the same architecture more powerful, not less necessary. The saleable product is not only the AI model. The saleable product is the workflow:

```text
trusted sources + legal parsing + evidence ledger + verification + export/audio + East African focus
```

## Demonstration standard

A demo answer should show:

1. the case or law identified;
2. source confidence;
3. verified facts;
4. legal reasoning;
5. practical significance;
6. what still needs checking;
7. an option to generate a deeper memo, student notes, or audio.

## Features to prioritise

### Phase 1: Dependable answers

- legal router;
- source registry;
- case extraction JSON;
- evidence ledger;
- verification pass;
- professional answer structure.

### Phase 2: Source import

- Kenya Law judgment parser;
- Kenya Law legislation parser;
- AfricanLII / Ulii / TanzLII import support;
- source metadata capture;
- original URL retained with every imported case.

### Phase 3: Exports

- case brief markdown export;
- counsel-style memo export;
- student notes export;
- citation/source appendix;
- downloadable PDF later.

### Phase 4: Audio learning

- split judgment into sections;
- summarize before narration;
- generate one audio chunk per section;
- allow queue, skip, resume, regenerate;
- expire temporary audio after 24 hours unless exported.

### Phase 5: Sponsor/sale readiness

- demo library using public cases;
- transparent no-fake-data policy;
- source confidence badges;
- clear legal disclaimer;
- institution-friendly report format;
- cost controls for Groq/free-tier usage.

## Communication personality

Patricia should sound like a careful digital legal researcher:

- professional;
- calm;
- precise;
- evidence-first;
- never theatrical;
- never overconfident;
- clear enough for non-lawyers;
- useful enough for law students and junior advocates.

## Non-negotiables

- no invented case law;
- no fake case library;
- no fake user data;
- no pretending news is law;
- no hidden uncertainty;
- no final legal advice without advocate review;
- no long uncontrolled model calls for large judgments.

## Demo case pattern

For a case such as `Frederick Muchere Mudialo v Republic`, Patricia should explain how the answer was built:

```text
1. I identified the case from the name, case number, and citation.
2. I treated it as Kenyan criminal appellate case law.
3. I checked trusted Kenyan legal source leads.
4. I extracted metadata, facts, issues, reasoning, holding, and orders.
5. I separated verified facts from legal significance.
6. I verified the final explanation against the evidence ledger.
```

That kind of transparency is what makes Patricia credible to users, sponsors, and potential buyers.
