# Patricia --- Case Law Audio & Summarization Platform

> Converts East African case laws into broadcast-quality audio, AI-powered summaries, and
> contextual explanations. Built for lawyers, students, and legal researchers.

---

## Do We Need to Train an AI?

No. We do not train or build an AI model from scratch --- that would cost millions of dollars and require a dedicated research team. Instead, we use powerful, pre-trained AI models via API (like using electricity from a grid rather than building a power station). The AI already understands legal language. Our job is to give it the right instructions (called "prompts") to produce high-quality legal summaries specific to East African law.

---

## All Required APIs & Services

### 1. AI Brain --- OpenAI API
- **What it does:** Reads and understands the full case law text. Generates structured summaries (Facts, Issues, Ruling, Precedent). Cleans messy legal text before it goes to voice.
- **Model:** gpt-4o (the most capable, not the "mini" --- quality matters here)
- **Cost:** ~$5 per 1M tokens (~750 pages of text per dollar)
- **Sign up:** https://platform.openai.com

### 2. Human-Quality Voice --- OpenAI TTS API
- **What it does:** Converts cleaned case law text into natural, broadcast-quality audio. Sounds like a real human narrator, not a robot.
- **Voices available:** alloy, echo, fable, onyx, nova, shimmer --- all professional quality
- **Model:** tts-1-hd (HD = highest quality, non-negotiable for a premium product)
- **Cost:** $15 per 1M characters (~$0.75 per 1-hour case)
- **Users can download their audio files directly** --- we generate and store them permanently

### 3. Document Vision (PDF Reading) --- OpenAI Vision API
- **What it does:** Reads PDF files of case laws, even scanned/image-based ones. Handles court documents that were scanned as pictures.
- **How:** We encode the PDF pages as images and send them to GPT-4o Vision --- it reads text from the page just like a human would.
- **Cost:** Included in the OpenAI API subscription. ~$0.0025 per page.

### 4. OCR (Scanning Pictures of Case Laws) --- Google Cloud Vision API
- **What it does:** Extracts text from photographs of physical case books or printed judgments. A lawyer can photograph a page from an old law book and upload it --- the system extracts the text perfectly.
- **Cost:** First 1,000 pages/month FREE. $1.50 per 1,000 pages after.
- **Sign up:** https://cloud.google.com/vision

### 5. Web Scraping (Online Repositories) --- Custom Scraper (Built In-House)
- **What it does:** Automatically pulls new case laws from Kenya Law (eKLR), ULII, Southern African Legal Information Institute, etc. No manual copy-paste.
- **Cost:** $0 (we write this code ourselves)
- **Optional Enhancement:** Apify ($49/month) for managed, robust scraping at scale

### 6. Authentication & Database --- Supabase
- **What it does:** Stores all users, cases, summaries, and audio file links. Handles login, sign-up, password reset, and role management (Admin, Lawyer, Student). Provides secure file storage for all MP3 audio files.
- **Cost:** Free up to 500MB DB + 1GB storage. Pro plan ($25/month = KES 3,250) for production.
- **Sign up:** https://supabase.com

### 7. Audio File Storage & Delivery --- Supabase Storage + Cloudflare CDN
- **What it does:** Stores all generated MP3 files. Serves them globally at high speed via CDN --- all 50 users can stream simultaneously with zero performance issues.
- **Download support:** Yes --- users can download any case audio file to their device for offline listening.
- **Cost:** Included in Supabase Pro plan.

### 8. Backend Worker (Processing Engine) --- Render.com VPS
- **What it does:** This is our "engine room." A small server that runs continuously, processing new cases: fetching text -> cleaning -> summarizing -> generating audio -> storing results.
- **Spec needed:** Starter instance (512MB RAM, 0.5 CPU) is sufficient. Upgrade to Standard ($25/month) for faster processing.
- **Cost:** $7--$25/month (KES 910 -- KES 3,250)
- **Sign up:** https://render.com

### 9. Frontend Hosting --- Vercel
- **What it does:** Hosts the web application. Globally distributed, sub-second load times. 99.99% uptime.
- **Cost:** Free (Hobby plan handles 50 users comfortably)
- **Sign up:** https://vercel.com

### 10. Payments (Subscription Billing) --- IntaSend or Stripe
- **IntaSend:** Kenyan-built, supports M-Pesa, credit cards, and bank transfers. Best for local users.
- **Stripe:** International cards and currency support for diaspora or foreign users.
- **Cost:** 2.9% + KES 30 per transaction (IntaSend). No monthly fee.
- **Sign up:** https://intasend.com / https://stripe.com

### 11. Error Monitoring --- Sentry
- **What it does:** Instantly alerts us if any part of the platform crashes or behaves unexpectedly. We see the error before users complain.
- **Cost:** Free plan covers our needs.
- **Sign up:** https://sentry.io

---

## How the Platform Ingests Case Laws (All Methods)

The platform supports 5 separate ingestion methods, so no matter how the case law exists, we can process it:

| Method | How It Works | Best For |
|---|---|---|
| 1. URL / Web Link | Admin pastes a case URL (e.g., from eKLR.com). Scraper pulls the full text automatically. | New published judgments online |
| 2. PDF Upload | Admin or user uploads a PDF. GPT-4o Vision reads the text, even from scanned court docs. | Court PDFs sent by email or downloaded |
| 3. Image / Photo Upload | Upload a photo of a printed case from a law book. Google Vision OCR extracts every word. | Old printed judgments, physical law books |
| 4. Word Document Upload | Upload a `.docx` file. We extract the text directly --- no AI needed, just a library. | Judgments shared as Word docs |
| 5. Manual Text Paste | Copy-paste raw text directly into an admin panel input field. Straight into the pipeline. | Any text source, quick entry |

---

## Tech Stack Summary

| Component | Technology |
|---|---|
| Web App (Frontend) | Next.js 14 (TypeScript) |
| Mobile App | React Native (Expo) |
| Backend API | Node.js (Express or Fastify) |
| AI Processing Worker | Python (runs separately on VPS) |
| Database | PostgreSQL via Supabase |
| File Storage | Supabase Storage |
| Audio CDN | Cloudflare (via Supabase) |
| Authentication | Supabase Auth (JWT) |
| Hosting (Web) | Vercel |
| Hosting (Worker) | Render.com |
| Payments | IntaSend (M-Pesa + Cards) |

---

## Final Budget (KES) --- 50-User Launch

### One-Time Setup Cost

| Item | KES |
|---|---|
| Process & generate audio for 200 starter cases (OpenAI APIs) | 19,890 |
| Month 1: Supabase Pro | 3,250 |
| Month 1: Render.com Worker | 910 |
| Domain name (patricia.co.ke or similar, 1 year) | 1,500 |
| Google Cloud Vision API setup + test credits | 500 |
| IntaSend onboarding (requires KRA PIN + business registration) | 0 |
| Buffer / contingency | 8,950 |
| **TOTAL LAUNCH CAPITAL** | **KES 35,000** |

### Monthly Running Costs (After Launch)

| Item | KES/month |
|---|---|
| Supabase Pro (database + storage + auth) | 3,250 |
| Render.com Worker (processing new cases) | 910 |
| Adding ~20 new cases/month (AI + TTS API cost) | 1,950 |
| Sentry monitoring | 0 (free) |
| IntaSend (% of revenue, not fixed) | ~2% of revenue |
| **TOTAL MONTHLY COST** | **~KES 6,110** |

---

## Revenue & Profit Model

| Plan | Users | Price | Monthly Revenue |
|---|---|---|---|
| Student | 20 | KES 500 | KES 10,000 |
| Professional Lawyer | 25 | KES 2,000 | KES 50,000 |
| Law Firm (5 seats) | 1 firm | KES 7,500 | KES 7,500 |
| **TOTAL** | **50** | | **KES 67,500** |

| | KES |
|---|---|
| Monthly Revenue | 67,500 |
| Monthly Cost | 6,110 |
| **Monthly Profit** | **KES 61,390** |
| **Break-even** | **5 paying users** |
| **Profit Margin** | **~91%** |

---

## Audio Download Feature

Yes --- fully supported. Every generated audio file is stored as a permanent MP3 in Supabase Storage. Users on the Professional and Firm plans can:
- Stream any case online
- Download the MP3 to their phone or laptop for offline use
- Student plan: stream only (no download --- a paid upgrade incentive)

---

## What We Are NOT Doing (To Keep Costs Down)

- No AI training: We use pre-trained OpenAI models. Training is unnecessary and costs $100,000+.
- No custom voice cloning: OpenAI HD voices are indistinguishable from professional narrators.
- No on-demand generation: Every audio is pre-generated. Users never wait.
- No dedicated server: Managed cloud services (Render, Supabase, Vercel) handle all infrastructure.

---

## Legal Disclaimer (Required on Platform)

> Patricia is a legal technology tool that processes publicly available case law for research and
> educational purposes. AI-generated summaries are not a substitute for qualified legal advice.
> Always verify key citations and rulings against primary court records. Patricia Ltd is not a
> law firm and does not provide legal services.

---

*Built by Patricia Ltd --- March 2026*
