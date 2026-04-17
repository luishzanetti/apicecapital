# Apice — Feature Naming Guide

> **Author:** Stefan Georgi
> **Status:** Production. Reference for naming any product feature, module, or surface.
> **Length:** ~1 page. Use it before shipping any feature name.
> **Last updated:** 2026-04-17

---

## The Naming Test — Four Rules

Every Apice feature name clears these four. If one fails, try again.

1. **Short.** One word preferred. Two words maximum, and only if the second word does real work.
2. **Meaning-first.** The word describes what the feature *does for the user* — not how it works under the hood.
3. **Ownable.** Apice can defend this word in search, in conversation, and in product copy. No generic noun that every fintech already uses.
4. **Human.** Spoken aloud, it sounds like something a disciplined investor would say — not a product manager.

---

## Do

- **Short Anglo-Saxon roots over Latin compounds.** "Pulse" > "Activity Monitor." "Ledger" > "Transaction History."
- **Nouns that imply a relationship.** "Reserve" (it is yours). "Thesis" (you own it). "Ledger" (you keep it).
- **Words that age well.** "Forecast" will still be called "forecast" in ten years. "AI-Powered Predictions" will not.
- **Words from the domain, not the tech.** Investing, old money, ship logs, dojos, libraries, stewardship. Not SaaS.
- **Test it in a sentence.** *"I checked my Pulse this morning."* If that sounds natural, ship. If it sounds like marketing copy, cut.

---

## Don't

- **Tech jargon.** *"Dashboard," "Analytics," "Engine," "Platform," "Suite," "Hub," "Console."* All dead on arrival.
- **Buzzwords.** *"AI-Powered Insights," "Smart Alerts," "Pro Tools."* Smart is not a feature — it is the baseline.
- **Acronyms without humanism.** AUM, DCA, APY are category terms we respect. But no invented acronyms — no "AVT-007" surfaces for users.
- **Cute/clever naming.** *"MoneyBuddy," "WealthWizard," "InvestoMatic."* We are not a kids' app.
- **Tiered prefixes as names.** *"Pro Features," "Club Tools."* Pro and Club are price tiers, not product names.
- **Localization traps.** "Pulse" translates. "Zeal" does not. Test every name in ES/PT before locking.

---

## Ten GOOD Apice-feel names (for future features)

These are *example names* — candidates, not commitments. Use them as the reference register.

| Name | Feature it could cover | Why it works |
|---|---|---|
| **Pulse** | Live market heartbeat / portfolio status at a glance | One word. Physiological metaphor. Translates (pulso in ES/PT). |
| **Ledger** | Full transaction history, exportable | Old money vocabulary. Implies keeping, not just viewing. |
| **Forecast** | Wealth projection / compound simulation | Common word, but undercolonized in fintech. Names the benefit. |
| **Thesis** | User-owned investment rationale per position | From the manifesto ("own your thesis"). Ownable. |
| **Reserve** | Long-term DCA savings vault | The word we rejected as a descriptor — perfect as a feature name. |
| **Signal** | Curated AI Expert market notes | Short, meaning-first, implies selectivity. |
| **Allocate** | Portfolio rebalancing module | Verb-as-name. Implies the action you take, not the screen. |
| **Shelter** | Stablecoin allocation during drawdown | Warm, protective, clear meaning. Counter-positions "bear market." |
| **Compound** | Reinvestment scheduler | Loaded with the manifesto's thesis word. High memorability. |
| **Post** | Once-per-week ritual of reviewing positions | Short, military/ritual gravity. "Check your post" reads right. |

**Pattern:** Each name lives in one syllable or two. Each has meaning before product context is supplied. Each clears the Naming Test.

---

## Ten BAD names to reject on sight

If any of these show up in a spec, rewrite.

1. "Portfolio Dashboard" — two dead words, stacked.
2. "Smart Alerts 2.0" — versioning + buzzword. Double fail.
3. "InvestPro" — portmanteau. Feels like 2008.
4. "WealthHub" — generic. Unownable. Translates badly.
5. "Apice AI Analytics Suite" — four words, three of them filler.
6. "Auto-Rebalancer Engine" — tech jargon front and back.
7. "MyApice" — consumer-app-ism. Not our register.
8. "Apice X" — letters-as-names are hedge-fund tells and do not age.
9. "The Vault" — overused in fintech. Undefensible.
10. "Dream Builder" — emotional overclaim. Not our voice.

---

## Process — Who Approves What

| Stage | Who | What happens |
|---|---|---|
| **Proposal** | @pm (Morgan) or feature lead | Drafts 3–5 candidate names using this guide. |
| **Voice check** | @stefan-georgi (this persona) | Runs the Naming Test on each candidate. Eliminates fails. |
| **Shortlist** | @pm | Narrows to 2 finalists. Pairs each with a one-sentence rationale. |
| **Approval** | **CEO** | Picks the final name or requests another round. |
| **Registration** | @pm | Logs in `brand/DECISIONS-LOG.md` and the Entity Registry. |

**When in doubt, escalate to CEO.** Names are brand assets — renaming a feature after launch is expensive in copy, illustration, user memory, and search equity. Get it right once.

---

## The Sanity Check (do this before every approval)

Say the name out loud in these three sentences:

1. *"I use Apice's ______ every Monday."*
2. *"My ______ just updated."*
3. *"Have you seen the new ______?"*

If all three sound natural — ship. If any one of them makes you pause, try again.

---

*— Stefan Georgi, for Apice*
