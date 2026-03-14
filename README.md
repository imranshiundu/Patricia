# Patricia: Legal Intelligence and Case Law Audio Platform

Patricia is a specialized platform designed for legal professionals and law students in the East African region. The system leverages artificial intelligence to transform complex case law into high-fidelity audio and concise, actionable summaries. It provides a modern, high-performance interface to streamline the consumption of legal precedents and citations.

## Core Objective

The primary objective of Patricia is to bridge the gap between dense legal documentation and efficient professional research. By providing broadcast-quality narration and AI-driven summarization, the platform allows users to digest legal material during commutes or between court sessions, significantly increasing productivity and information retention.

## Platform Architecture

### Frontend Stack
- Framework: Next.js (React) using the App Router architecture.
- Styling: Tailwind CSS for a utility-first, responsive design system.
- Component Primitives: Radix UI and shadcn/ui for accessible and consistent interface elements.
- Aesthetics: A refined "Bento-box" layout designed to reduce cognitive load and organize complex legal data into intuitive, modular segments.

### Infrastructure and Backend
- Identity and Persistence: Supabase is utilized for authentication (JWT-based), PostgreSQL database management, and Row Level Security (RLS).
- Storage: Supabase Storage handles the persistent hosting of high-quality MP3 assets.
- Deployment: The frontend is hosted on Vercel, optimized for edge delivery and global performance.

### AI and Media Pipeline
- Summarization Engine: OpenAI GPT-4o models are employed to extract key facts, legal issues, and final rulings with high fidelity.
- Audio Synthesis: OpenAI TTS-1-HD provides human-quality narration for case judgements.
- Document Ingestion: OpenAI Vision and Google Cloud Vision are used for Optical Character Recognition (OCR) to process physical documents and PDF uploads.

## Key Functional Components

1. Automated Summarization: Rapid generation of executive summaries for extensive case files.
2. High-Quality Narration: Instant playback of case law judgements in a professional audio format.
3. Omni-Channel Ingestion: Supports ingestion of cases via URL, PDF, Word documents, and images.
4. Offline Support: Built with a focus on progressive web application (PWA) capabilities for offline access.
5. Search and Retrieval: A universal legal search interface for querying case names, citations, and specific topics.

## Technical Implementation Details

The application is structured around a three-pane layout:
- Navigation: A fixed sidebar for primary application state.
- Workspace: A fluid center canvas for content interaction and search.
- Context: A right sidebar for bookmarks, recent history, and related precedents.

Processing of heavy media and AI tasks is offloaded to dedicated workers to ensure the frontend remains responsive and fluid under high concurrent load.

## Development and Deployment

### Getting Started
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Configure environment variables for Supabase and OpenAI.
4. Run development server: `npm run dev`.

### Deployment Pipeline
The project follows a standard CI/CD workflow with Vercel integration, ensuring that all changes pushed to the main branch are automatically built and deployed to the production environment.
