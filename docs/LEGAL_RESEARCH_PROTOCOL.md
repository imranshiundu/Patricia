# Patricia Legal Research Protocol

Patricia must work with small, cheap, or less intelligent models. The product should therefore depend on workflow discipline, source evidence, and verification rather than raw model intelligence.

## Core rule

Patricia does not create legal answers from memory. Patricia explains verified material collected from user-provided text, imported legal sources, or trusted East African legal research leads.

## Pipeline

```text
User question
  -> legal router
  -> jurisdiction + intent detection
  -> trusted source research when needed
  -> case/statute extraction
  -> evidence ledger
  -> final answer draft
  -> verification pass
  -> user-facing legal answer
```

## Why this works with weaker models

A weak model fails when it is asked to do everything at once. Patricia breaks the task into narrow jobs:

1. detect jurisdiction and intent;
2. fetch or rank source leads;
3. extract case fields into JSON;
4. build a claim/support ledger;
5. write only from that ledger;
6. verify and remove unsupported claims.

The model is not asked to be brilliant. It is asked to obey small, auditable tasks.

## Extraction worker

The extraction worker receives local legal text and returns JSON only:

```json
{
  "case_metadata": {
    "case_name": "",
    "citation": "",
    "neutral_citation": "",
    "case_number": "",
    "court": "",
    "judge": "",
    "date": "",
    "origin": ""
  },
  "procedural_history": "",
  "material_facts": [],
  "issues": [],
  "applicable_law": [],
  "holding": "",
  "reasoning": [],
  "orders": [],
  "legal_principles": [],
  "missing_information": []
}
```

Rules:

- use only the provided legal text;
- empty fields are better than fake fields;
- do not invent statutes, dates, judges, holdings, or orders;
- keep extraction concise and factual.

## Evidence ledger

Every legal answer must be built from a ledger:

| Field | Meaning |
| --- | --- |
| `claim` | The point Patricia wants to say |
| `support` | The text/source that supports it |
| `source` | Local legal text, imported URL, or source lead |
| `confidence` | high, medium, or low |
| `kind` | local text, source lead, model extraction, or inference |

The final answer writer uses this ledger as source of truth.

## Verification worker

The verifier receives the draft and the evidence ledger. Its job is to:

- remove unsupported facts;
- downgrade uncertain claims;
- keep source leads separate from verified holdings;
- remove legal overclaiming;
- preserve professional structure.

## Required answer style

Patricia answers in this structure:

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

## Source authority

Patricia ranks sources this way:

1. official court / government source;
2. legal index or LII source;
3. news/context source.

News is never treated as law.

## Groq model strategy

For the default small Groq model, Patricia uses JSON Object Mode for extraction and a separate verification pass. When a stronger model is available, the same pipeline remains useful, but strict schema structured outputs can replace JSON Object Mode where supported.

## Example: Frederick Muchere Mudialo v Republic

When a user asks about a case like `Frederick Muchere Mudialo v Republic`, Patricia should not simply produce a case brief from memory. It should:

1. identify the query as Kenyan case law;
2. search Kenya Law / trusted legal sources when no full text is provided;
3. import the judgment text when possible;
4. extract metadata, facts, issues, holding, reasoning, and orders;
5. build an evidence ledger;
6. write the case brief;
7. verify the answer before returning it.

## Product positioning

Patricia is not an AI lawyer. Patricia is a legal research assistant with AI inside it. The commercial value comes from dependable workflow, trusted sources, source transparency, exportable briefs, audio learning, and low-cost model compatibility.
