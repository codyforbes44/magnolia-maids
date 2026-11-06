<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep operational domains, mail destinations, social handles and integration identifiers separate from displayed branding; a display-only rebrand must not redirect existing integrations.
- Apply palette changes through semantic CSS and email brand tokens so existing page structures inherit the new identity without pricing or workflow changes.

- All estimate surfaces and new plan checkout amounts use quoteVisit and its lineItems from the shared pricing module; this keeps discount order and rounding consistent.
- Google Places and geocoding use authenticated server functions through the gateway; public forms retain manual address entry to avoid unauthenticated billable proxies.
- Asset renames must update all import/download references and preserve stored legal document bytes.
