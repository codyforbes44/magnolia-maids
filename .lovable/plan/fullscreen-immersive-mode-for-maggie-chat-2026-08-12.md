# Fullscreen "Immersive Mode" for Maggie chat

Add an expand/collapse toggle to the Maggie chat widget. Expanded, it takes over the whole screen: a large portrait of Maggie on one half, the conversation on the other — no page distractions.

## What the user sees

- A new expand icon in the chat header (next to close). One click goes fullscreen, one click returns to the corner bubble.
- Fullscreen layout on desktop/tablet: left half is a floor-to-ceiling Maggie portrait over a soft magnolia/laurel gradient, with her name, role, live status ("Listening" / "Speaking…") and a couple of trust cues (Durant OK, phone number). Right half is the conversation: bigger type, roomier bubbles, wider input, same Talk / Chat controls.
- Mobile fullscreen: portrait becomes a compact top banner (about a third of the screen) so the chat keeps most of the room; safe-area padding so controls clear the home bar.
- When Maggie is speaking, the portrait gets a subtle glow/breathing animation so the voice call feels alive.
- Escape key exits fullscreen; page scroll is locked behind the overlay; focus moves into the chat and is trapped there.
- The conversation, voice session, and message history carry over untouched when toggling either direction — nothing restarts.

## Image

Generate a new high-quality portrait-orientation Maggie image (warm, upscale, magnolia-themed, consistent with the existing mascot avatar) sized for a half-screen panel. The existing small round avatar stays for the header, nudge bubble, and collapsed panel.

## Technical notes

- `src/components/MagnoliaChatWidget.tsx`: add an `expanded` state. Keep one instance of the conversation state and message list; render the shell as either the corner panel or a fixed `inset-0` overlay so `useConversation` never remounts.
- Extract the message list and the controls block into small local subcomponents (or a `size` prop) so both layouts share them without duplication.
- New asset `src/assets/maggie-portrait.jpg` imported as an ES module; `loading="eager"` in fullscreen, `fetchpriority` left default.
- Colors from existing semantic tokens (`laurel`, `sage`, `accent`) — no hardcoded hex.
- Accessibility: overlay gets `role="dialog"` + `aria-modal="true"` + labelled heading, Escape handler, `overflow-hidden` on `document.body` while expanded, restore focus to the launcher on close.
