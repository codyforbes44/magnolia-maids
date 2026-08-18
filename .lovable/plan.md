# Expandable Communications Hub

Today the hub is locked to a 420px phone mock with a fixed 600px screen, so on a desktop monitor most of the space goes unused. Add a layout toggle so the same hub can run as a phone, a wide desktop workspace, or full screen.

## What you get

A small control in the hub header with three modes:

- **Phone** — the current realistic device frame (default on small screens).
- **Desktop** — the frame opens into a two-pane workspace: a left sidebar with the app list (Home, Phone, Texts, Chats, Email, Messenger, Slack, Ads, Status) plus unread badges, and a large right pane for the active app with the search bar across the top.
- **Full screen** — the desktop layout expanded edge to edge over the admin chrome, with an Escape key / close button to exit.

Your choice is remembered between visits. On phones and small tablets the phone layout is always used, so nothing regresses on mobile.

```text
Desktop / full screen
+----------------------------------------------------+
| Communications hub        [Search............] [x]  |
+---------+------------------------------------------+
| Home    |                                          |
| Phone 2 |   Active app fills the pane              |
| Texts 5 |   (threads list + conversation side by   |
| Chats   |    side when the app has a detail view)  |
| Email   |                                          |
| ...     |                                          |
+---------+------------------------------------------+
```

## Behaviour details

- Thread apps (Texts, Chats, Email, Messenger, Slack) use a master/detail split in wide mode: conversation list on the left of the pane, open conversation on the right, instead of the current push-and-back navigation.
- Screen height becomes fluid (viewport-based) in desktop and full screen rather than the fixed 600px, so long threads scroll in place.
- Everything else — search, filter chips, delivery statuses, retry, polling — behaves identically in every mode.

## Technical notes

- `src/components/hub/PhoneFrame.tsx` gains a `layout` prop (`phone | desktop | fullscreen`). Phone keeps the current markup; the wide layouts render a sidebar dock, a header toolbar row, and a flexible-height screen container. No child component API changes.
- `src/routes/_authenticated/admin/hub.tsx` owns the mode state, persists it to `localStorage` (read in `useEffect` to avoid hydration mismatch), forces phone mode under `md`, and renders a segmented toggle. Full screen renders in a fixed overlay with Escape handling and body scroll lock.
- `HubThreads.tsx` (and `HubMessenger`/`HubSlack` where they list-then-detail) accept a `wide` prop that switches from single-column push navigation to a side-by-side grid; the existing single-column path is unchanged.
- Only presentation changes — no server functions, queries, or database work.
