# Fix agent pricing math (transcript review)

## What the transcript got right
- Greeting, service list, recurring-plan framing, and the "base includes 2bd/2ba" explanation all match the site.
- It correctly asked for service type and bed/bath counts before quoting.

## What it got wrong
Caller: Standard Clean, biweekly, 4 bed / 2.5 bath.

Correct per `src/lib/pricing.ts`:

```text
129 base + 2 extra bedrooms x $20 = $40 + 0.5 extra bath x $15 = $7.50
raw = $176.50 -> rounded $177
biweekly 15% off -> $150
```

The agent said $22.50 for the half bath (should be $7.50 — it billed the half
bath as one and a half extra baths), then quoted $162.43, which does not even
match its own line items ($191.50 x 0.85 = $162.78). Two separate errors: a
wrong half-bath rule and unreliable arithmetic. It also quoted cents; the site
always quotes whole dollars.

Root cause: the knowledge base says "half baths bill at half rate" but never
states that a 2.5-bath home has only **0.5** billable extra baths, has no
worked half-bath example, and no rounding rule — so the model does freehand
mental math.

## Plan

1. Rewrite the pricing section of `public/magnolia-maids-knowledge-base.md`:
   - Explicit formula: `total = round((base + max(0, beds-2) x perBed + max(0, baths-2) x perBath) x (1 - discount))`
   - Baths above 2 count as a decimal: 2.5 baths = 0.5 extra bath; 1.5 baths = 0 extra.
   - Rounding rule: whole dollars only, never quote cents.
   - Worked examples covering half baths and smaller-than-included homes, including 4bd/2.5ba biweekly = $150.
   - Pre-quote self-check: recompute the total from the line items before speaking it.
2. Mirror the same rules in `src/agents/magnolia-concierge.prompt.md` and in the live briefing from `src/agents/knowledge.ts` so voice, chat, and KB agree.
3. Re-upload the updated knowledge base to ElevenLabs agent `agent_0001kygbk76rfwxrf6bef7z6xf1t`, attach it, and remove the superseded document.
4. Re-run the same test question and confirm the answer is $150.

## Optional (recommended)
Add a server route `src/routes/api/public/quote` that calls `priceHome()` from
`src/lib/pricing.ts`, and register it as an ElevenLabs agent tool so the agent
looks prices up instead of doing arithmetic. This removes math errors
permanently and keeps quotes in sync with the site automatically.