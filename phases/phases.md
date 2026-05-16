# Phases and Removed Mock Features

This document tracks features that were present as mockups or placeholders in the initial UI but have been removed during the frontend redesign to ensure the application only presents fully functional capabilities.

## Removed Mock Features (Phase 1 Redesign)

1. **Audio / Text-to-Speech (TTS) Buttons**
   - **Context:** The chat UI contained "Audio next" or "Listen" buttons.
   - **Reason for Removal:** Real text-to-speech generation is not yet implemented (as per the README).
   - **Future Phase:** To be reintroduced when the TTS backend generation is fully integrated.

2. **Admin Dashboard Links**
   - **Context:** Placeholders for an admin dashboard.
   - **Reason for Removal:** Admin functionality and database are not yet implemented.
   - **Future Phase:** Reintroduce when cloud database and admin auth roles are active.

3. **PDF Upload / OCR Placeholders**
   - **Context:** UI elements suggesting native PDF or scanned document parsing.
   - **Reason for Removal:** The backend currently only supports plain text/markdown intake. PDF and OCR parsing are pending.
   - **Future Phase:** Add back once real PDF extraction and OCR are supported.

4. **Advanced "Impact Profile" Selectors**
   - **Context:** UI for selecting "Who does this affect?" (e.g., citizen, student, landlord).
   - **Reason for Removal:** The routing and extraction logic for specific profiles is pending.
   - **Future Phase:** Implement when the backend can tailor answers to specific user profiles.

5. **Cloud Database / Sync Status Indicators**
   - **Context:** UI suggesting cloud saving or synchronization.
   - **Reason for Removal:** Currently, all data (cases, chats) is stored locally in the browser (`localStorage`).
   - **Future Phase:** Reintroduce when cloud database sync is implemented.
