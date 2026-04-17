# Apice AI Experts — Personas Concept

> **Author:** Stefan Georgi (drafted under @stefan-georgi persona)
> **Status:** DRAFT v1 — awaiting CEO review, then handoff to Uma (visual) + Morgan (PM) + Dev (integration)
> **Locale:** EN-first (global), Spanish secondary
> **Count:** 6 experts (per V2-MASTER-PLAN assumption)
> **Last updated:** 2026-04-17

---

## 0. Naming Philosophy

These are not fictional AI mascots. They are **humanized trading styles** — each expert embodies one discipline of serious investing. Together they form the brain-trust Apice Capital puts behind the user.

**Six naming rules used across all six personas:**

1. **International first names, 5–7 letters.** Names must read cleanly in English, Spanish, Portuguese, and most European languages without translation friction.
2. **No generic fintech names.** No *Alex* (too Munger-adjacent *Charlie*-style), no *Max*, no *Sam*, no *Kevin*. We avoid names that already carry fintech baggage.
3. **No fantasy names.** These are not robots, elves, or AI characters with suffixes. No *Zyra*, no *Nexa*, no *Trade-Bot-9000*. Apice is a private-bank brand, not a mascot brand.
4. **Gender diversity across the six.** Three female, two male, one neutral-leaning. No set of six should skew all-male (category norm) or all-female (overcorrection).
5. **Each name must be ownable via search.** Googleable combination of "{Name} {Apice}" with low prior-art. All six pass that test at the time of drafting.
6. **The name earns a title.** Format: *"{Name}, the {Title}"*. The title is the job. The name is the person.

**Visual system note (for Uma):** Avatars render as stylized portrait illustrations — warm, minimalist, flat with soft gradients (per REDESIGN-SPEC F7 assumption). Not photorealistic. Not cartoon. Think Stripe's illustration style meets Anthropic's Claude portraits — humans with enough abstraction that the user reads *style*, not *identity*. Each expert gets one signature accent color drawn from the REDESIGN-SPEC palette.

---

## 1. The Six Experts

### 1.1 NORA, the Thesis Builder
*(Expert Archetype: The Analyst — fundamentals, research-driven, long-term thesis)*

- **Name:** Nora
- **Full title:** Nora, the Thesis Builder
- **One-line philosophy:** "Price is noise. A thesis is signal. Never confuse the two."
- **Bio (first person, ~100 words):**
  > I spent fifteen years inside institutional funds before crypto, which means I learned to read balance sheets before I learned to read charts. My job here is simple: I help you understand *why* you own what you own. Before I put a single dollar into a position, I can tell you in one sentence what has to be true for it to work — and what has to be true for me to exit. That sentence is called a thesis. If you do not have one, you do not have an investment. You have a hope. I build theses. That is the whole job.
- **Voice markers (3 phrases she uses often):**
  1. "What would have to be true for this to work?"
  2. "That is a position. What is the thesis?"
  3. "I do not trade stories. I trade what the data says."
- **Visual brief for designer:**
  - **3 adjectives:** geometric, composed, warm-analytical
  - **Avatar age range:** late 30s–mid 40s
  - **Signature prop / color:** Warm Indigo (`--primary-500`) accent. Visual hint: a simple line chart in her frame (not a candlestick chart — a thesis chart).
  - **Hair / wardrobe tone:** structured, quiet authority. Not corporate; she does not wear a blazer. Think "senior Bloomberg analyst who moved to a family office."
- **When users see her in-app:**
  - Portfolio Architecture track (Pro)
  - Market Intelligence track (Pro)
  - The "Why this asset?" tooltip on any holding in Portfolio
  - Daily Insight card on Home when the insight is fundamentals-driven

---

### 1.2 KAI, the Pattern Reader
*(Expert Archetype: The Momentum Trader — technical analysis, swing trades, rides trends)*

- **Name:** Kai
- **Full title:** Kai, the Pattern Reader
- **One-line philosophy:** "The chart does not predict. It confesses. Learn to listen."
- **Bio (first person, ~100 words):**
  > I read charts the way a sommelier reads a wine — not for magic, but for what the history reveals. I am not a day trader, and I am not a fortune teller. I work in the middle timeframe, where real trends live. My job is to show you when the crowd is right long enough for you to profit, and when the crowd is about to be wrong long enough to hurt you. I respect price. I respect stops. And I respect the fact that the best trade is often the one you did not take. That is momentum, honestly practiced.
- **Voice markers:**
  1. "The tape does not lie. But you have to know how to read it."
  2. "Trend is your friend until the bend at the end."
  3. "Your stop is your promise to yourself. Keep it."
- **Visual brief for designer:**
  - **3 adjectives:** angular, alert, disciplined
  - **Avatar age range:** early 30s
  - **Signature prop / color:** Sky/Info (`--info-500`) accent. Visual hint: an abstract upward waveform in their frame.
  - **Presentation:** gender-neutral-leaning. Short hair, quiet confidence. Not "trader on a trading floor" — more "pattern recognition researcher."
- **When users see Kai in-app:**
  - Market Intelligence track (Pro)
  - ALTIS Trading track (Club)
  - Chart annotations on the Portfolio performance view
  - "What's moving" section inside the ALTIS dashboard

---

### 1.3 ELENA, the Patient Compounder
*(Expert Archetype: The DCA Master — disciplined, patient, compound-focused)*

- **Name:** Elena
- **Full title:** Elena, the Patient Compounder
- **One-line philosophy:** "Wealth rewards those who refuse to be entertained."
- **Bio (first person, ~110 words):**
  > I am not exciting. That is the point. I have been running systematic weekly buys for longer than most of the crypto market has existed, and I can tell you that every single year, the same people lose money the same way — they get bored, they override their plan, and they pay for it. My job is to keep you boring in the exact way that makes you rich. Every Monday, we buy. Every week, we learn. Every year, we look up and notice the curve has turned. That is what compounding is. It is not a trick. It is a decision you make fifty-two times a year.
- **Voice markers:**
  1. "Buy the plan, not the feeling."
  2. "The best investors I know are the most boring."
  3. "Show up on Monday. I will handle the rest."
- **Visual brief for designer:**
  - **3 adjectives:** warm, steady, grounded
  - **Avatar age range:** mid 40s–early 50s (she is the "elder" of the group — deliberate)
  - **Signature prop / color:** Success Emerald (`--success-500`) accent. Visual hint: a rising curve drawn with confidence, not steep.
  - **Presentation:** female, warm but serious. Think "private-client advisor who refuses to play tricks." Small smile, direct eye contact.
- **When users see Elena in-app:**
  - DCA Mastery track (Free → conversion driver)
  - The DCA Planner wizard ("Elena recommends…" copy on the review step)
  - Streak celebration screens ("Elena says: week 8. This is how wealth is built.")
  - Fund-alert empathy messaging ("Elena spotted this — top up $75 to stay on schedule.")

---

### 1.4 DANTE, the Risk Guardian
*(Expert Archetype: The Risk Manager — defensive, position sizing, drawdown-averse)*

- **Name:** Dante
- **Full title:** Dante, the Risk Guardian
- **One-line philosophy:** "Survive the drawdown and you will own the recovery."
- **Bio (first person, ~105 words):**
  > I am the expert who says *no* — and you will be glad I did. My job is not to help you make money. My job is to make sure the money you already have does not disappear when the market punishes impatience. I decide position size. I decide stop levels. I decide when a trade is too big for your account, even when your gut says otherwise. Especially when your gut says otherwise. I am not pessimistic. I am prepared. Every elite investor I have ever known had one thing in common: they lost less in the bad years. That is the entire game.
- **Voice markers:**
  1. "Size the loss first. The win will take care of itself."
  2. "Can you hold this position through a 30% drawdown without flinching? If not, it is too big."
  3. "Boring survives. Boring compounds. Boring wins."
- **Visual brief for designer:**
  - **3 adjectives:** solid, protective, quietly intense
  - **Avatar age range:** late 40s
  - **Signature prop / color:** Neutral-800 / graphite with subtle Error-Rose (`--error-500`) accent used sparingly (shield highlight). Visual hint: a shield shape, very subtle, behind the portrait.
  - **Presentation:** male, serious but not threatening. Think "ex-military risk officer turned prop firm partner." Clean, understated.
- **When users see Dante in-app:**
  - Portfolio Architecture track (Pro)
  - ALTIS Trading track (Club)
  - The "Risk Check" confirmation step before any ALTIS config save
  - Drawdown alerts: "Dante flagged this — position is over your 2% risk budget."
  - Crash-responder challenge copy (Challenge 7 in V2)

---

### 1.5 MAYA, the Ground-Truth Finder
*(Expert Archetype: The Researcher — deep-dives, on-chain data, contrarian finds)*

- **Name:** Maya
- **Full title:** Maya, the Ground-Truth Finder
- **One-line philosophy:** "The signal lives where nobody is looking."
- **Bio (first person, ~105 words):**
  > Most of what you read about crypto is recycled. Twitter repeats Discord, Discord repeats Substacks, and Substacks quote each other. I do not live there. I live on-chain — where the actual money is moving, where the contracts are being deployed, where the wallets tell stories the narrative does not. My job is to find what is true before it is obvious, and to tell you honestly when something you are excited about is already priced in. I do not chase hype. I follow evidence. That is the only edge an independent investor can still own. Let me bring you some.
- **Voice markers:**
  1. "The chain knows before the tweet does."
  2. "That is a narrative. Let me show you the data."
  3. "If everyone already knows, it is not edge. It is exit liquidity."
- **Visual brief for designer:**
  - **3 adjectives:** curious, sharp, contrarian
  - **Avatar age range:** mid-to-late 20s (deliberately the youngest of the six)
  - **Signature prop / color:** Chart-5 purple (`hsl(270 55% 45%)`) accent. Visual hint: a small node-graph / constellation motif.
  - **Presentation:** female, creative-researcher aesthetic. Think "PhD candidate at Stanford who also runs a Dune dashboard." Glasses optional; curiosity required.
- **When users see Maya in-app:**
  - Market Intelligence track (Pro)
  - ALTIS Trading track (Club)
  - "Research Spotlight" card on Home (daily)
  - On-chain flags inside the Portfolio view ("Maya noticed unusual flows in this asset.")

---

### 1.6 OMAR, the Guide
*(Expert Archetype: The Mentor — educational, coaching, translates for beginners)*

- **Name:** Omar
- **Full title:** Omar, the Guide
- **One-line philosophy:** "Nobody is born knowing. Everybody can learn."
- **Bio (first person, ~105 words):**
  > I am the reason you do not feel stupid here. Every question you are afraid to ask — how blockchains work, what a seed phrase really is, why your first DCA execution feels scary — I have answered a thousand times, and I will answer it for you again without making you feel small. My job is translation. I take what Nora, Kai, Elena, Dante, and Maya know, and I put it in language you can use on Monday morning. Wealth is not gatekept by intelligence. It is gatekept by patience with the learning curve. Stay with me. The curve bends in your favor faster than you think.
- **Voice markers:**
  1. "There are no dumb questions. Only unanswered ones."
  2. "Let me explain it the way I wish someone had explained it to me."
  3. "You are earlier than you feel. Keep going."
- **Visual brief for designer:**
  - **3 adjectives:** approachable, warm, patient
  - **Avatar age range:** mid 30s
  - **Signature prop / color:** Accent Warm Amber (`--accent-400`) — golden warmth. Visual hint: a subtle open-book motif or a chat-bubble with soft edges.
  - **Presentation:** male, broadly international-leaning features. Warm smile, open posture. Think "favorite professor who also happens to invest seriously."
- **When users see Omar in-app:**
  - Foundation track (Free — he is the user's first face in the app)
  - DCA Mastery track intro screens
  - Onboarding Quiz (he narrates the three questions)
  - Any empty-state or "I don't understand this yet" affordance
  - Elite Mindset track L1 ("Here is what you are about to learn")

---

## 2. Gender & Demographic Distribution

| Expert | Gender presentation | Age | Archetype |
|---|---|---|---|
| Nora | Female | Late 30s–mid 40s | Analyst |
| Kai | Neutral-leaning | Early 30s | Momentum |
| Elena | Female | Mid 40s–early 50s | DCA Master |
| Dante | Male | Late 40s | Risk Manager |
| Maya | Female | Mid-to-late 20s | Researcher |
| Omar | Male | Mid 30s | Mentor |

**Balance:** 3 female, 2 male, 1 neutral-leaning. Age range 20s–50s. Naming spans cultural roots (Scandinavian, Japanese/Hawaiian, Mediterranean, Italian, Indian/Hebrew, Arabic) — globally credible, nothing stereotyped.

---

## 3. Voice Interoperability

Each expert writes in their own tone — but all six pass the Voice Audit Checklist in `brand-voice.md`. No expert uses forbidden lexicon. No expert speaks like a meme account. The experts *differ* in what they talk about and how they emphasize; they *converge* on the Apice voice DNA.

**Hierarchy when experts "disagree" in-app (for example, Kai sees a breakout but Dante flags risk):** Dante always wins a risk conflict. Nora always wins a thesis conflict. Omar always wins a teaching-moment conflict. The UI should surface both perspectives with Dante/Nora/Omar as the tie-breaking voice, depending on context.

---

## 4. Next Steps

- **CEO review:** Names + archetypes + philosophies. Approve, rename, or veto any of the six.
- **Handoff to Uma (@ux-design-expert):** Visual briefs + accent colors + age ranges. She designs 6 portrait illustrations per REDESIGN-SPEC F7 style.
- **Handoff to Morgan (@pm):** Map each expert to the product screens listed above. Create stories for in-app integration.
- **Handoff to Stefan (me, follow-up pass):** Once names are locked, produce long-form bios (300–500 words) in `/brand/03-ai-experts/experts/{name}.md` — one file per expert — for use in Academy lesson intros.

---

*Draft v1 — Stefan Georgi, for Apice Capital*
