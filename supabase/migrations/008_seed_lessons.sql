-- ═══════════════════════════════════════════════════════════════════
-- EDUCATION SEED: Lessons for Foundation + DCA Mastery tracks
-- Migration: 008_seed_lessons.sql
--
-- Seeds 8 Foundation + 10 DCA Mastery = 18 lessons extracted from the
-- existing in-app sampleData.ts content. Slug-addressed so the seed is
-- idempotent — `on conflict (track_id, slug) do nothing` preserves any
-- manual content edits in the database.
--
-- Track slugs referenced (from migration 007):
--   foundation   → Foundation (free tier)
--   dca-mastery  → DCA Mastery (free tier)
--
-- Content shape for content_blocks (jsonb array):
--   [{ "type": "paragraph" | "highlight" | "stat" | "quote",
--      "content": "...",
--      "label": "...",       // stat only
--      "value": "...",       // stat only
--      "author": "...",      // quote only
--      "role": "..." }]      // quote only
--
-- Content shape for quiz (jsonb array):
--   [{ "id": "q1",
--      "question": "...",
--      "options": ["..."],
--      "correctIndex": 1,
--      "explanation": "..." }]
-- ═══════════════════════════════════════════════════════════════════

do $$
declare
  foundation_id   uuid;
  dca_mastery_id  uuid;
begin
  select id into foundation_id  from public.learning_tracks where slug = 'foundation';
  select id into dca_mastery_id from public.learning_tracks where slug = 'dca-mastery';

  if foundation_id is null or dca_mastery_id is null then
    raise exception 'Required tracks (foundation, dca-mastery) not seeded — run migration 007 first';
  end if;

  -- ═════════════════════════════════════════════════════════════════
  -- FOUNDATION TRACK — 8 lessons
  -- ═════════════════════════════════════════════════════════════════

  insert into public.lessons (
    track_id, slug, title, summary, content_blocks, duration_min, xp, "order", quiz, challenge, required_tier, is_published
  ) values
  -- 1. What is a Crypto Portfolio
  (
    foundation_id,
    'intro-portfolio',
    'What is a Crypto Portfolio?',
    'A strategic collection of crypto holdings balancing risk and return across asset classes.',
    '[
      {"type":"paragraph","content":"A crypto portfolio is your collection of cryptocurrency holdings, strategically allocated to balance risk and return. Unlike picking a single asset, a portfolio approach spreads risk across multiple positions, protecting you when any single asset drops."},
      {"type":"highlight","content":"The Apice framework divides portfolios into three tiers: Blue Chips (BTC/ETH) for stability, Layer-1s for growth, and Stablecoins for dry powder to buy dips."},
      {"type":"stat","label":"Blue Chip allocation","value":"50-70%","content":"of most safe portfolios should be BTC + ETH"},
      {"type":"quote","content":"Diversification is the only free lunch in investing.","author":"Harry Markowitz","role":"Nobel Prize in Economics"},
      {"type":"paragraph","content":"The key insight: you do not need to pick the winner. By holding a basket of high-quality assets, you capture the upside of the entire market cycle without betting everything on one coin."}
    ]'::jsonb,
    4, 50, 1,
    '[
      {"id":"q1","question":"What is the main advantage of a crypto portfolio vs. holding a single asset?","options":["Higher returns guaranteed","Risk is spread across multiple assets","You pay lower fees","The market moves faster"],"correctIndex":1,"explanation":"Diversification spreads risk so that a crash in one asset does not wipe you out."},
      {"id":"q2","question":"In the Apice framework, what role do stablecoins (USDT/USDC) play?","options":["Maximum growth potential","Dry powder to buy market dips","The riskiest bet","Replace Bitcoin"],"correctIndex":1,"explanation":"Stablecoins act as reserves so you can buy aggressively during market crashes."},
      {"id":"q3","question":"Which allocation is typically considered the foundation of a safe crypto portfolio?","options":["Memecoins 80%","BTC + ETH 50-70%","Only stablecoins","Equal split of 100 coins"],"correctIndex":1,"explanation":"BTC and ETH have the longest track record, deepest liquidity, and are the base of most institutional portfolios."}
    ]'::jsonb,
    '{"title":"Portfolio Analysis Challenge","description":"Look at your current or desired crypto holdings and classify each asset.","steps":["List every asset you hold or want to hold","Categorize each: Blue Chip / Layer-1 / DeFi / Stablecoin","Calculate what % each category represents","Compare to the Classic Core (40% BTC, 30% ETH, 20% SOL, 10% USDT)"],"reward":"+25 Bonus XP if shared in community"}'::jsonb,
    'free', true
  ),

  -- 2. Why DCA Works
  (
    foundation_id,
    'why-dca',
    'Why DCA Works',
    'Dollar-Cost Averaging removes emotional timing and builds positions at a lower cost than the average price.',
    '[
      {"type":"paragraph","content":"Dollar-Cost Averaging (DCA) means investing a fixed amount at regular intervals, regardless of market price. This eliminates the near-impossible task of timing the market — a game that even professional traders lose 95% of the time."},
      {"type":"stat","label":"DCA investors in profit","value":"83%","content":"after 3+ years, regardless of entry point"},
      {"type":"highlight","content":"When price drops, your fixed $100 buys MORE coins. When price rises, it buys fewer. Over time, this averages out to a cost lower than the average price — the mathematical edge of DCA."},
      {"type":"paragraph","content":"Consider this: an investor who put $100/week into Bitcoin from 2019 to 2024, through crashes and recoveries, accumulated over 3x their total investment. They did this without stress, without charts, without fear."},
      {"type":"quote","content":"Time in the market beats timing the market.","author":"Ken Fisher","role":"Forbes Columnist & Fund Manager"}
    ]'::jsonb,
    4, 50, 2,
    '[
      {"id":"q1","question":"What happens when the price drops during a DCA plan?","options":["You should pause your plan","Your fixed amount buys more coins","You lose more money","Nothing changes"],"correctIndex":1,"explanation":"Lower prices mean your fixed investment buys more units — this is the power of cost averaging."},
      {"id":"q2","question":"What percentage of market timers lose money long-term?","options":["20%","50%","75%","95%"],"correctIndex":3,"explanation":"Studies consistently show 95%+ of traders who try to time markets underperform a simple DCA strategy."},
      {"id":"q3","question":"What is the main psychological benefit of DCA?","options":["You make more trades","Eliminates emotional decision-making","You always buy at the bottom","Guarantees profit"],"correctIndex":1,"explanation":"With DCA you invest on a schedule, removing fear and greed from the equation."},
      {"id":"q4","question":"The Apice recommended DCA frequency is:","options":["Daily","Weekly","Monthly","Annually"],"correctIndex":1,"explanation":"Weekly DCA provides the optimal balance of averaging frequency and practical execution."}
    ]'::jsonb,
    '{"title":"DCA Simulator Challenge","description":"Calculate what weekly DCA into BTC would have returned over different periods.","steps":["Pick a weekly amount: $25, $50, or $100","Assume you started 2 years ago (Jan 2023)","Estimate total invested (weekly x 104 weeks)","Compare to today approximate BTC price vs 2023 price"],"reward":"Unlock the DCA Historical Data section"}'::jsonb,
    'free', true
  ),

  -- 3. Understanding Your Risk Tolerance
  (
    foundation_id,
    'risk-tolerance',
    'Understanding Your Risk Tolerance',
    'Match your strategy to your psychological comfort zone — the only strategy that works is the one you can stick to.',
    '[
      {"type":"paragraph","content":"Risk tolerance is not just about returns — it is about sleep. The most profitable strategy is the one you can stick to. A 60% annual return means nothing if you panic-sell during a 40% drawdown."},
      {"type":"highlight","content":"The Apice 3 Profiles: Conservative Builder (15% target, focus on BTC/ETH) · Balanced Optimizer (35% target, BTC/ETH + L1s) · Growth Seeker (60%+ target, adds high-beta altcoins)"},
      {"type":"stat","label":"Biggest investor mistake","value":"72%","content":"of retail investors sell at the worst possible time due to panic"},
      {"type":"paragraph","content":"Key principle: Never invest more than you can psychologically afford to see drop 50% without panicking. Crypto regularly experiences 30-80% drawdowns — even Bitcoin has dropped 80% from all-time highs multiple times before recovering to new highs."},
      {"type":"quote","content":"The investor chief problem — and even his worst enemy — is likely to be himself.","author":"Benjamin Graham","role":"Father of Value Investing"}
    ]'::jsonb,
    3, 50, 3,
    '[
      {"id":"q1","question":"Bitcoin has historically experienced maximum drawdowns of up to:","options":["20%","40%","80%","100%"],"correctIndex":2,"explanation":"BTC has dropped ~80-85% from highs multiple times (2018, 2022) before recovering to new all-time highs."},
      {"id":"q2","question":"What is the most profitable strategy according to Apice?","options":["The one with highest returns","The riskiest","The one you can stick to during volatility","Daily trading"],"correctIndex":2,"explanation":"Consistency and execution matter more than theoretical returns. The strategy you abandon during a crash is useless."},
      {"id":"q3","question":"A Conservative Builder profile targets approximately:","options":["5% annual","15% annual","60%+ annual","100% annual"],"correctIndex":1,"explanation":"Conservative builders focus on BTC/ETH DCA targeting ~15% annual returns with lower volatility."}
    ]'::jsonb,
    '{"title":"Stress Test Challenge","description":"Test your true risk tolerance before the market does.","steps":["Imagine your portfolio drops 40% tomorrow","Would you: panic-sell / hold / buy more?","Pick your answer honestly","Check if your current investor profile matches your answer"],"reward":"Personalized profile confirmation badge"}'::jsonb,
    'free', true
  ),

  -- 4. Position Sizing Fundamentals
  (
    foundation_id,
    'position-sizing',
    'Position Sizing Fundamentals',
    'The higher the risk, the smaller the position — this single principle can be the difference between surviving a crash and losing everything.',
    '[
      {"type":"paragraph","content":"Position sizing is the discipline of deciding HOW MUCH of your portfolio to allocate to each asset. The core rule: the higher the risk, the smaller the position. This one principle can be the difference between surviving a crash and losing everything."},
      {"type":"highlight","content":"Apice Rule: If an asset can go to zero (high-risk), it should represent no more than 5-15% of your portfolio. Blue chips (BTC/ETH) can represent 40-70%. Stablecoins 10-20%."},
      {"type":"stat","label":"Portfolio protection","value":"5%","content":"max allocation to any single high-risk altcoin"},
      {"type":"paragraph","content":"Example: Imagine your portfolio is $1,000. You put $900 in a memecoin that goes to zero — you lose $900. But if you used proper sizing ($50 max), you lose only $50 while your BTC/ETH positions might have gained during the same period."},
      {"type":"quote","content":"Risk comes from not knowing what you are doing.","author":"Warren Buffett","role":"CEO, Berkshire Hathaway"}
    ]'::jsonb,
    4, 50, 4,
    '[
      {"id":"q1","question":"According to Apice, what is the max recommended allocation for a single high-risk altcoin?","options":["50%","30%","5-15%","No limit"],"correctIndex":2,"explanation":"High-risk assets can go to zero. Keeping them at 5-15% means a total loss barely affects your overall portfolio."},
      {"id":"q2","question":"What is the primary goal of position sizing?","options":["Maximize profits","Protect capital from catastrophic loss","Buy more coins","Impress other investors"],"correctIndex":1,"explanation":"Position sizing is defensive — it ensures no single bad bet can destroy your portfolio."},
      {"id":"q3","question":"In a $500 portfolio, following Apice rules, the maximum you should put in a speculative new L1 is:","options":["$250","$500 — go all in","$75 (15%)","$5"],"correctIndex":2,"explanation":"15% of $500 = $75. This protects your core portfolio if the speculative bet fails."}
    ]'::jsonb,
    '{"title":"Portfolio Sizing Exercise","description":"Apply position sizing rules to a hypothetical $1,000 portfolio.","steps":["Allocate 50% to BTC + ETH (blue chips)","Allocate 20% to 1-2 L1s like SOL or AVAX","Allocate 15% to 1 DeFi project","Allocate 10% to USDT/USDC reserves","Leave max 5% for a speculative play"],"reward":"50 XP + Position Sizing badge"}'::jsonb,
    'free', true
  ),

  -- 5. Reading a Crypto Chart
  (
    foundation_id,
    'reading-charts',
    'Reading a Crypto Chart',
    'The minimum chart literacy every investor needs: candles, timeframes, and the only two patterns that actually matter.',
    '[
      {"type":"paragraph","content":"Charts are how markets communicate. You do not need to become a day trader — but understanding candles and timeframes will prevent you from panicking at normal price action. A green candle means price closed higher than it opened; red means lower. That is the whole language, fundamentally."},
      {"type":"highlight","content":"Apice rule for investors: only look at the weekly and monthly timeframes. Daily is noise. Anything shorter than daily is emotional poison."},
      {"type":"stat","label":"Investor timeframes that matter","value":"2","content":"weekly + monthly — ignore everything below"},
      {"type":"paragraph","content":"Two patterns worth knowing: higher highs + higher lows = uptrend (keep DCAing normally). Lower highs + lower lows = downtrend (discount zone, consider adding reserves). Everything else is noise that loses money for retail traders."},
      {"type":"quote","content":"The trend is your friend — until the end, when it bends.","author":"Ed Seykota","role":"Market Wizards veteran"}
    ]'::jsonb,
    4, 50, 5,
    '[
      {"id":"q1","question":"Which two timeframes does Apice recommend investors look at?","options":["1-minute and 5-minute","Hourly and 4-hour","Weekly and monthly","Only intraday"],"correctIndex":2,"explanation":"Longer timeframes filter out the emotional noise that destroys retail returns."},
      {"id":"q2","question":"An uptrend is characterized by:","options":["Higher highs and higher lows","Lower highs and lower lows","Random zig-zag","Only green candles"],"correctIndex":0,"explanation":"Higher highs + higher lows is the textbook signature of a healthy uptrend."},
      {"id":"q3","question":"What does a red candle indicate?","options":["Price went up","Price closed lower than it opened","A crash is guaranteed","Nothing — colors are random"],"correctIndex":1,"explanation":"Candle color reflects the open-to-close direction for that period — red means the close was below the open."}
    ]'::jsonb,
    '{"title":"Weekly Chart Audit","description":"Look at BTC on the weekly timeframe and identify the current trend.","steps":["Open any free chart tool (TradingView)","Switch to the weekly timeframe","Count: are recent highs higher or lower than prior highs?","Write down: uptrend / downtrend / sideways"],"reward":"Chart Literate badge"}'::jsonb,
    'free', true
  ),

  -- 6. Blue Chip vs Altcoin
  (
    foundation_id,
    'blue-chip-vs-altcoin',
    'Blue Chip vs Altcoin',
    'Why 80% of your portfolio belongs in 2 assets, and why most altcoins go to zero over a full cycle.',
    '[
      {"type":"paragraph","content":"A blue chip in crypto is an asset with a decade-plus track record, institutional adoption, and proven survivability through at least two bear markets. Only two assets fully qualify today: Bitcoin and Ethereum. Everything else is an altcoin — higher upside, much higher failure rate."},
      {"type":"highlight","content":"Apice insight: roughly 90% of altcoins present at the top of a bull cycle do not reach new all-time highs in the next cycle. Survival — not max gain — is the hardest game."},
      {"type":"stat","label":"Altcoin survival rate across cycles","value":"~10%","content":"of top-100 altcoins make new highs in the following cycle"},
      {"type":"paragraph","content":"That is why the Apice framework treats blue chips as the foundation (40-70% of portfolio) and altcoins as satellite bets — selected for specific theses, sized smaller, and rotated actively. Never reverse this: an altcoin-heavy portfolio with a 5% BTC allocation is a casino, not an investment strategy."}
    ]'::jsonb,
    4, 50, 6,
    '[
      {"id":"q1","question":"Which two assets currently qualify as crypto blue chips by Apice standards?","options":["BTC and ETH","Any top-10 coin","Stablecoins","Memecoins with high volume"],"correctIndex":0,"explanation":"Only BTC and ETH combine a decade-plus history, institutional adoption, and multiple bear-market survivals."},
      {"id":"q2","question":"Historically, what % of altcoins present at a cycle top reach new highs in the next cycle?","options":["~90%","~50%","~10%","100%"],"correctIndex":2,"explanation":"Roughly 90% fade permanently — which is why altcoin sizing discipline matters so much."},
      {"id":"q3","question":"How should altcoins be treated in a balanced portfolio?","options":["As the core","As satellite positions sized smaller","Never held","Always the majority"],"correctIndex":1,"explanation":"Altcoins are satellite bets — specific theses, smaller sizes, actively rotated."}
    ]'::jsonb,
    null::jsonb,
    'free', true
  ),

  -- 7. Custody Basics
  (
    foundation_id,
    'custody-basics',
    'Custody Basics: Exchange vs Self',
    'Where your keys live determines who actually owns the coins — and what happens when the next exchange collapses.',
    '[
      {"type":"paragraph","content":"Custody is the single most important concept in crypto. If you do not hold the private keys, you do not own the asset — you own a claim against whoever does. This is why FTX depositors lost everything overnight while self-custody holders were unaffected."},
      {"type":"highlight","content":"Apice custody framework: small amounts on a reputable exchange for trading and DCA execution. Medium+ holdings migrate to a hardware wallet. Anything you cannot afford to lose MUST be self-custody."},
      {"type":"stat","label":"FTX customer funds lost","value":"$8B+","content":"highlighting why exchange custody is not ownership"},
      {"type":"paragraph","content":"Practical tier: under $1k stays on exchange (trading friction matters). $1k-10k: hardware wallet with a mnemonic backed up offline. $10k+: multi-sig or institutional custody. The Apice methodology uses Bybit for execution but never as long-term storage for significant positions."}
    ]'::jsonb,
    5, 50, 7,
    '[
      {"id":"q1","question":"Why does Apice recommend self-custody for significant holdings?","options":["It is cheaper","You own the keys — no counterparty risk","Exchanges charge storage fees","Hardware wallets earn yield"],"correctIndex":1,"explanation":"Self-custody removes counterparty risk — FTX showed what happens when the custodian fails."},
      {"id":"q2","question":"What does the phrase not your keys, not your coins mean?","options":["Keys are worthless","If you do not control the private keys, you do not really own the asset","Keys expire","It is about keyboards"],"correctIndex":1,"explanation":"Without the private keys, you only hold a claim against a third party — not the asset itself."},
      {"id":"q3","question":"According to the Apice tier, what portfolio size should migrate to a hardware wallet?","options":["Under $100","$1k-$10k","Only $1M+","Never"],"correctIndex":1,"explanation":"$1k-$10k is the threshold where exchange custody risk outweighs convenience."}
    ]'::jsonb,
    '{"title":"Custody Audit","description":"Map where every crypto dollar you own is stored right now.","steps":["List every exchange, wallet, or platform","Categorize: exchange custody / self-custody / DeFi","Identify any balance >$1k still on exchange","Plan one migration this month"],"reward":"Custody Ready badge + 75 XP"}'::jsonb,
    'free', true
  ),

  -- 8. Your First 30 Days
  (
    foundation_id,
    'first-30-days',
    'Your First 30 Days',
    'A concrete week-by-week plan to go from zero to running a disciplined crypto strategy by day 30.',
    '[
      {"type":"paragraph","content":"The first 30 days are where habits form. Most beginners fail not from bad strategy but from no structure. This lesson gives you a week-by-week plan designed to build competence without overwhelm."},
      {"type":"highlight","content":"Week 1: security (2FA, anti-phishing, account hardening). Week 2: first DCA ($25-100/week automated). Week 3: portfolio review + allocation targets. Week 4: first rebalance check + commit to the 12-month plan."},
      {"type":"stat","label":"Investor activation rate","value":"30 days","content":"is the threshold where DCA habits become permanent"},
      {"type":"paragraph","content":"Rule for the first 30 days: do not touch your portfolio outside of the weekly DCA. No checking prices more than twice a week. No altcoin experiments. No leverage. Earn the right to advanced strategies by mastering the boring basics first."}
    ]'::jsonb,
    4, 50, 8,
    '[
      {"id":"q1","question":"What is the focus of Week 1 in the Apice 30-day plan?","options":["Buying altcoins","Security (2FA, anti-phishing)","Leveraged trading","Copying influencers"],"correctIndex":1,"explanation":"Security comes first — without it every other strategy is at risk."},
      {"id":"q2","question":"How often should a new investor check prices in the first 30 days?","options":["Every hour","Daily","Max twice a week","Never"],"correctIndex":2,"explanation":"Limiting price-checking builds discipline and prevents emotional trades."},
      {"id":"q3","question":"When does Apice recommend exploring altcoin experiments?","options":["Week 1","After the first 30 days of disciplined DCA","Never","Immediately with leverage"],"correctIndex":1,"explanation":"Earn advanced strategies by first mastering the boring basics for 30 days."}
    ]'::jsonb,
    '{"title":"30-Day Commitment","description":"Lock in your personal 30-day plan today.","steps":["Enable 2FA + anti-phishing this week","Set up first DCA by end of week 2","Review allocation week 3","Do first rebalance check week 4"],"reward":"Foundation Complete badge + 100 XP"}'::jsonb,
    'free', true
  )
  on conflict (track_id, slug) do nothing;

  -- ═════════════════════════════════════════════════════════════════
  -- DCA MASTERY TRACK — 10 lessons
  -- ═════════════════════════════════════════════════════════════════

  insert into public.lessons (
    track_id, slug, title, summary, content_blocks, duration_min, xp, "order", quiz, challenge, required_tier, is_published
  ) values
  -- 1. Introduction to DCA
  (
    dca_mastery_id,
    'dca-intro',
    'Introduction to DCA',
    'Invest a fixed amount at regular intervals regardless of price — the cleanest retail edge in crypto.',
    '[
      {"type":"paragraph","content":"Dollar-Cost Averaging (DCA) is an investment strategy where you invest a fixed amount of money at regular intervals, regardless of the asset price. This removes the psychological burden of market timing and ensures you accumulate assets consistently."},
      {"type":"stat","label":"DCA vs Lump Sum","value":"78%","content":"of the time DCA beats lump-sum for retail investors in volatile markets"},
      {"type":"highlight","content":"Core Apice principle: Start small, stay consistent. $25/week for 4 years compounding at 35% annually = $15,000+. The math rewards discipline, not size."},
      {"type":"paragraph","content":"DCA works in all market conditions. In bull markets, you accumulate more assets from early cheaper prices. In bear markets, every week is a discounted buying opportunity. Across full market cycles, the average entry price almost always beats discretionary timing."}
    ]'::jsonb,
    3, 50, 1,
    '[
      {"id":"q1","question":"DCA stands for:","options":["Digital Currency Allocation","Dollar-Cost Averaging","Decentralized Capital Asset","Dynamic Compound Averaging"],"correctIndex":1,"explanation":"Dollar-Cost Averaging — investing a fixed dollar amount at regular intervals."},
      {"id":"q2","question":"The main goal of DCA is to eliminate:","options":["All investment risk","The need to time the market","Transaction fees","Crypto volatility"],"correctIndex":1,"explanation":"DCA does not eliminate risk but removes the pressure and danger of trying to predict market timing."},
      {"id":"q3","question":"$50/week for 2 years = total invested of:","options":["$1,200","$2,400","$5,200","$10,400"],"correctIndex":2,"explanation":"$50 x 52 weeks x 2 years = $5,200 total invested."}
    ]'::jsonb,
    '{"title":"Your First DCA Plan","description":"Design your ideal DCA plan using the Apice framework.","steps":["Choose your weekly amount ($25-$500)","Choose 2-4 assets maximum","Set a frequency: weekly (recommended)","Commit to at least 6 months without stopping"],"reward":"DCA Starter badge + 50 XP"}'::jsonb,
    'free', true
  ),

  -- 2. The Psychology of DCA
  (
    dca_mastery_id,
    'dca-psychology',
    'The Psychology of DCA',
    'Your biggest enemy is not the market — it is you. DCA neutralizes fear and greed by design.',
    '[
      {"type":"paragraph","content":"The biggest enemy of your investment returns is not the market — it is you. Studies show that emotional decision-making costs the average investor 1.5-3% per year in missed returns. Fear makes you sell at bottoms. Greed makes you buy at tops. DCA neutralizes both."},
      {"type":"quote","content":"The stock market is a device for transferring money from the impatient to the patient.","author":"Warren Buffett","role":"CEO, Berkshire Hathaway"},
      {"type":"highlight","content":"The Apice mindset: your weekly DCA is not a trade, it is a recurring bill — like rent or Netflix. Non-negotiable, automatic, emotionless."},
      {"type":"stat","label":"Emotional investors","value":"1.5-3%","content":"less annual returns due to behavioral mistakes"},
      {"type":"paragraph","content":"Crypto crashes feel catastrophic. The 2022 bear market saw BTC drop 77%. But DCA investors who kept buying through the crash accumulated BTC at $16,000-$25,000 — assets now worth multiples more. The ones who sold never bought back."}
    ]'::jsonb,
    4, 50, 2,
    '[
      {"id":"q1","question":"Emotional decision-making costs the average investor how much per year?","options":["0-0.1%","0.5%","1.5-3%","10%+"],"correctIndex":2,"explanation":"Behavioral finance studies consistently show 1.5-3% annual performance drag from emotional decisions."},
      {"id":"q2","question":"How should you think about your weekly DCA according to Apice?","options":["As an optional bonus investment","Like a recurring bill — automatic and non-negotiable","As a fun gambling game","Based on how the market is doing"],"correctIndex":1,"explanation":"Treating DCA as a fixed expense removes choice and emotion from the equation."},
      {"id":"q3","question":"During BTC 2022 crash (down 77%), what happened to disciplined DCA investors?","options":["They lost everything","They accumulated cheap BTC that recovered","Nothing — DCA does not work in bear markets","They switched to stocks"],"correctIndex":1,"explanation":"DCA investors accumulated BTC at major discounts during the crash, capturing huge gains in the subsequent recovery."}
    ]'::jsonb,
    '{"title":"Emotional Audit Challenge","description":"Identify and neutralize your emotional investing triggers.","steps":["Write down 3 market events that made you want to sell in fear","Write down 3 moments you wanted to buy in FOMO","For each: what would DCA discipline have done?","Create a personal rule: I will not deviate from my DCA unless..."],"reward":"Psychology Master badge + 75 XP"}'::jsonb,
    'free', true
  ),

  -- 3. DCA vs Lump Sum: The Data
  (
    dca_mastery_id,
    'dca-vs-lumpsum',
    'DCA vs Lump Sum: The Data',
    'Lump-sum wins on paper in trending markets. DCA wins on risk-adjusted returns in crypto.',
    '[
      {"type":"paragraph","content":"The academic debate: lump-sum investing (investing all at once) produces higher raw returns ~66% of the time in traditional markets. BUT — crypto is not traditional markets. In a market with 30-80% regular drawdowns, your entry point matters enormously."},
      {"type":"stat","label":"DCA into BTC (4-year windows)","value":"94%","content":"of all 4-year DCA periods ended in profit, regardless of starting price"},
      {"type":"highlight","content":"The Apice position: DCA wins on risk-adjusted returns for retail crypto investors. The risk of catastrophic timing in crypto (e.g., buying at November 2021 peak) is too high. DCA smooths this completely."},
      {"type":"paragraph","content":"Real example: Investor A puts $10,000 in BTC at the November 2021 peak ($67k). Portfolio drops 77% to $2,300. Investor B DCA-ed $200/week from 2021-2023. Average buy price: ~$28,000. Portfolio in much better shape entering 2024."}
    ]'::jsonb,
    5, 50, 3,
    '[
      {"id":"q1","question":"In traditional stock markets, lump-sum outperforms DCA:","options":["Always","Never","~66% of the time","~10% of the time"],"correctIndex":2,"explanation":"In trending markets, being fully invested sooner wins. But crypto extreme volatility changes this calculation."},
      {"id":"q2","question":"What percentage of 4-year DCA periods into BTC ended in profit?","options":["50%","70%","85%","94%"],"correctIndex":3,"explanation":"Historical analysis shows 94%+ of all 4-year DCA windows ended positive regardless of start date."},
      {"id":"q3","question":"Why does DCA win in crypto specifically vs. traditional markets?","options":["Crypto has lower fees","Crypto extreme volatility makes entry point much more important","DCA is only for crypto","Crypto always goes up"],"correctIndex":1,"explanation":"Crypto 30-80% regular drawdowns mean bad timing can devastate lump-sum investors in ways DCA avoids."}
    ]'::jsonb,
    '{"title":"Backtest Your Strategy","description":"Run a mental backtest comparing DCA vs lump-sum.","steps":["Pick an asset: BTC or ETH","Pick a start date when price was high (e.g., November 2021)","Calculate: $5,000 lump sum vs $100/week DCA","Estimate current value of each approach using current prices"],"reward":"Data-Driven Investor badge + 100 XP"}'::jsonb,
    'free', true
  ),

  -- 4. Building Your DCA Plan
  (
    dca_mastery_id,
    'dca-building-plan',
    'Building Your DCA Plan',
    'Three qualities define a good DCA plan: affordable amount, focused assets, 12+ month commitment.',
    '[
      {"type":"paragraph","content":"The perfect DCA plan has three qualities: (1) An amount you can genuinely afford every week without stress, (2) A focused asset selection (2-5 maximum), (3) A timeline commitment of at least 12 months."},
      {"type":"highlight","content":"Apice Golden Rule: The amount matters less than the consistency. $25/week every week for 4 years beats $500/month for 2 months every time. Build the habit first. Increase the amount later."},
      {"type":"stat","label":"Optimal DCA assets","value":"2-5","content":"maximum coins for a focused, manageable DCA plan"},
      {"type":"paragraph","content":"Asset selection framework: Start with BTC (40-50% of DCA). Add ETH (25-35%). Optional: Add 1 high-conviction L1 like SOL (15-25%). Only if you have $200+/week: Consider adding 1 DeFi or L2 position."}
    ]'::jsonb,
    4, 50, 4,
    '[
      {"id":"q1","question":"How many assets maximum does Apice recommend for a focused DCA plan?","options":["1","2-5","10","20+"],"correctIndex":1,"explanation":"More assets creates confusion and complexity. 2-5 quality assets is the effective range."},
      {"id":"q2","question":"What is the minimum recommended DCA commitment period?","options":["1 month","3 months","12 months","5 years"],"correctIndex":2,"explanation":"12 months is the minimum to begin seeing the statistical advantages of DCA averaging."},
      {"id":"q3","question":"According to Apice, what matters MORE than the weekly DCA amount?","options":["Picking the right coins","Consistency over time","Maximum leverage","Trading actively"],"correctIndex":1,"explanation":"Habit and consistency mathematically beat larger but inconsistent investments."}
    ]'::jsonb,
    '{"title":"Design Your 12-Month DCA Plan","description":"Create your complete personalized DCA blueprint.","steps":["Set your weekly investment amount","Choose 2-4 assets and their % split","Calculate your 12-month total investment","Project a 35% annual return scenario","Commit to it by saving it in the app"],"reward":"Master Planner badge + 150 XP"}'::jsonb,
    'free', true
  ),

  -- 5. Advanced DCA Strategies
  (
    dca_mastery_id,
    'dca-advanced',
    'Advanced DCA Strategies',
    'Value averaging, dynamic DCA, and rebalancing DCA — techniques that amplify returns without breaking discipline.',
    '[
      {"type":"paragraph","content":"Once you have mastered base DCA, advanced techniques can amplify returns without abandoning discipline. Value Averaging adjusts your contribution based on portfolio performance. Dynamic DCA increases buys during crashes. Rebalancing DCA uses contributions strategically to maintain allocations."},
      {"type":"highlight","content":"Apice Elite Strategy: During crashes of 20%+, double your weekly DCA. During 40%+ crashes, triple it if possible. Use your stablecoin reserves. This is where the biggest returns are generated."},
      {"type":"stat","label":"Enhanced DCA performance","value":"+15-25%","content":"additional returns from dynamic crash-buying vs static DCA"},
      {"type":"paragraph","content":"Rebalancing DCA: When BTC runs up and becomes 60% of your portfolio (above your 50% target), allocate more to ETH and SOL that month until rebalanced. This forces you to buy relatively cheaper assets — systematic low-buying."}
    ]'::jsonb,
    5, 75, 5,
    '[
      {"id":"q1","question":"What does Apice recommend doing during a 40%+ market crash?","options":["Stop investing — protect cash","Triple your DCA if possible","Switch entirely to stablecoins","Wait until the market recovers"],"correctIndex":1,"explanation":"Crash-buying is where generational wealth is built. Apice elite strategy uses reserves to amplify purchases during crashes."},
      {"id":"q2","question":"What is Value Averaging in the context of DCA?","options":["Investing only in valuable coins","Adjusting contribution size based on portfolio performance","Dollar averaging in value tokens only","Averaging down on losing positions"],"correctIndex":1,"explanation":"Value averaging adjusts how much you invest based on whether your portfolio is under or over its target growth curve."},
      {"id":"q3","question":"Rebalancing DCA means:","options":["Selling assets to rebalance","Using contributions strategically to restore target allocations","Starting multiple DCA plans","Changing your plan monthly"],"correctIndex":1,"explanation":"Smart rebalancing uses new contributions to buy underweight assets instead of selling overweight ones — tax efficient and disciplined."}
    ]'::jsonb,
    '{"title":"Crash Strategy Blueprint","description":"Prepare your action plan before the next market crash.","steps":["Define your crash thresholds: 20%, 40%, 60%","Decide how much extra DCA for each level","Identify which stablecoin reserves you would deploy","Write it down so you act on rules, not emotion"],"reward":"Elite Strategist badge + 200 XP"}'::jsonb,
    'free', true
  ),

  -- 6. DCA Success Stories
  (
    dca_mastery_id,
    'dca-success-stories',
    'DCA Success Stories',
    'The data across four years: discipline compounds, consistency wins, and the bear-market buyers captured the gains.',
    '[
      {"type":"paragraph","content":"The numbers tell the story. An investor who DCA-ed $100/week into BTC from January 2020 to January 2024 invested $20,800 total. At January 2024 prices (~$45,000/BTC), that portfolio was worth approximately $65,000+ — over 3x their investment."},
      {"type":"stat","label":"BTC DCA ($100/week, 2020-2024)","value":"3x+","content":"return on total investment despite 3 major crashes in that period"},
      {"type":"highlight","content":"The secret: those investors kept buying through 2022 bear market when BTC dropped from $68k to $15k. Discipline during fear was the differentiator."},
      {"type":"quote","content":"I have made more money being lazy than active. Set it, forget it, compound it.","author":"Michael Saylor","role":"MicroStrategy CEO, Bitcoin Maximalist"},
      {"type":"paragraph","content":"Every Apice member who completes 12 months of consistent DCA has positive portfolio performance in their total investment versus holding cash. The strategy works. The only question is whether you will stay the course."}
    ]'::jsonb,
    4, 50, 6,
    '[
      {"id":"q1","question":"$100/week DCA into BTC from 2020-2024 resulted in approximately:","options":["Breaking even","50% gain","3x+ gain","10x gain"],"correctIndex":2,"explanation":"$20,800 invested grew to ~$65,000+ for most DCA investors through full market cycles."},
      {"id":"q2","question":"What was the key behavior that separated successful DCA investors in 2022?","options":["They sold before the crash","They kept buying through the bear market","They switched to gold","They used leverage"],"correctIndex":1,"explanation":"Keeping DCA active during the 2022 crash — when BTC hit $15k — generated the largest gains when markets recovered."},
      {"id":"q3","question":"According to Apice data, what does any investor who completes 12 months of DCA achieve?","options":["Guaranteed 100% gains","Positive performance vs. holding cash","Access to Club tier free","A guaranteed monthly return"],"correctIndex":1,"explanation":"Historical consistency shows 12-month DCA investors consistently outperform cash holdings regardless of market conditions."}
    ]'::jsonb,
    '{"title":"Your 12-Month Commitment","description":"Make the commitment that separates future-you from everyone else.","steps":["Set a specific weekly DCA amount","Set a calendar reminder every week on the same day","Create a rule: I will not check my portfolio more than once per month","Log your first weekly deposit in the app today"],"reward":"DCA Champion badge + 250 XP"}'::jsonb,
    'free', true
  ),

  -- 7. DCA Frequency: Daily, Weekly, or Monthly
  (
    dca_mastery_id,
    'dca-frequency',
    'DCA Frequency: Daily, Weekly, or Monthly',
    'Why weekly wins the tradeoff between smoothing volatility and practical execution.',
    '[
      {"type":"paragraph","content":"Frequency is an under-appreciated DCA lever. Daily smooths volatility the most but creates fee drag and decision fatigue. Monthly minimizes work but gives up meaningful smoothing. Weekly is the empirical sweet spot and the Apice default for good reason."},
      {"type":"highlight","content":"Apice benchmark: at $100/week, weekly DCA captures ~95% of the smoothing benefit of daily DCA while using 1/7th the execution surface — fewer fees, fewer decisions, same statistical edge."},
      {"type":"stat","label":"Weekly vs monthly smoothing","value":"~40%","content":"improvement in cost-basis variance going from monthly to weekly"},
      {"type":"paragraph","content":"Edge cases: if your weekly amount is under $10, fees start to matter — consider bi-weekly instead. If your amount is $500+/week, monthly + dynamic crash-buying can outperform. For 90% of retail investors, weekly is correct."}
    ]'::jsonb,
    3, 50, 7,
    '[
      {"id":"q1","question":"Why does Apice default to weekly DCA?","options":["It is easier to remember","Best tradeoff between smoothing and execution cost","Required by exchanges","It always beats daily"],"correctIndex":1,"explanation":"Weekly captures the vast majority of smoothing benefit with 1/7th the friction."},
      {"id":"q2","question":"When might bi-weekly or monthly make more sense than weekly?","options":["Under $10/week amounts where fees matter","When you want more volatility","Always","Never"],"correctIndex":0,"explanation":"Under ~$10/week, execution costs start eating into the DCA edge."},
      {"id":"q3","question":"How much smoothing improvement does weekly give vs monthly?","options":["Zero","~5%","~40%","~90%"],"correctIndex":2,"explanation":"The move from monthly to weekly is where most of the smoothing gain lives."}
    ]'::jsonb,
    null::jsonb,
    'free', true
  ),

  -- 8. Asset Selection for DCA
  (
    dca_mastery_id,
    'dca-asset-selection',
    'Asset Selection for DCA',
    'What to DCA into — and why your list should almost always start with just BTC and ETH.',
    '[
      {"type":"paragraph","content":"Asset selection for DCA is different from discretionary trading. You are making a commitment to buy this asset for 12+ months regardless of price. That raises the bar dramatically — only convictions that can survive multiple downturns belong in a DCA plan."},
      {"type":"highlight","content":"Apice DCA shortlist (in order): (1) BTC — the foundation, (2) ETH — the smart-contract foundation, (3) one high-conviction L1 (SOL or equivalent), (4) optional thematic (Layer-2 or DeFi blue chip)."},
      {"type":"stat","label":"Apice DCA default split","value":"50/30/20","content":"BTC / ETH / high-conviction L1 — covers 90% of investors"},
      {"type":"paragraph","content":"What does NOT belong in a DCA: memecoins, low-cap speculations, narrative-of-the-month tokens. These are discretionary trades, not commitments. If you would be uncomfortable holding the asset through an 80% drawdown, it does not belong in your DCA."}
    ]'::jsonb,
    4, 50, 8,
    '[
      {"id":"q1","question":"What is the Apice default DCA split for most investors?","options":["100% BTC","50% BTC / 30% ETH / 20% L1","Equal-weighted top 20","Memecoins only"],"correctIndex":1,"explanation":"50/30/20 covers the vast majority of investor goals with clear hierarchy and discipline."},
      {"id":"q2","question":"What kind of asset should NOT be in a DCA plan?","options":["BTC","ETH","Memecoins and narrative-of-the-month tokens","Established L1s"],"correctIndex":2,"explanation":"DCA is a commitment — speculative low-caps belong in discretionary trades, not DCA."},
      {"id":"q3","question":"What is the minimum conviction test for a DCA asset?","options":["You like the name","You would be comfortable holding it through an 80% drawdown","The price went up last week","A friend recommended it"],"correctIndex":1,"explanation":"If you would sell in a bad drawdown, it does not belong in your DCA."}
    ]'::jsonb,
    null::jsonb,
    'free', true
  ),

  -- 9. When to Pause or Stop DCA
  (
    dca_mastery_id,
    'dca-pause-stop',
    'When to Pause or Stop DCA',
    'The three legitimate reasons to pause DCA — and the twenty emotional reasons that are always wrong.',
    '[
      {"type":"paragraph","content":"DCA discipline means 95% of the time you do not touch the plan. But there are three legitimate reasons to pause or stop. Knowing them in advance prevents you from confusing emotional panic with rational adjustment."},
      {"type":"highlight","content":"The three legitimate reasons: (1) Income loss — pausing to preserve emergency runway. (2) Thesis change — the asset no longer passes your conviction test. (3) Portfolio rebalance — temporarily redirecting contributions to underweight assets."},
      {"type":"stat","label":"Pauses that turned permanent","value":"~60%","content":"of investors who pause DCA emotionally never restart"},
      {"type":"paragraph","content":"What is NOT a valid reason: price is too high (you cannot know), a crash scares you (DCA exists for this), an influencer tweet changed your mind, your friend sold their bag. Every one of these is the opposite signal — the moments you are most likely to make emotional mistakes are exactly when DCA protects you."}
    ]'::jsonb,
    4, 50, 9,
    '[
      {"id":"q1","question":"Which of these is a legitimate reason to pause DCA?","options":["Price is too high","Fear of a crash","Income loss that threatens your emergency fund","A scary tweet"],"correctIndex":2,"explanation":"Financial preservation is real — emotional reactions are not."},
      {"id":"q2","question":"What percentage of emotional DCA pauses become permanent stops?","options":["~10%","~30%","~60%","0%"],"correctIndex":2,"explanation":"Most emotional pauses turn into permanent stops — a major reason to resist them."},
      {"id":"q3","question":"A crash should trigger you to:","options":["Stop DCA immediately","Continue DCA — that is why it exists","Switch to leveraged trading","Panic-sell everything"],"correctIndex":1,"explanation":"Crashes are when DCA captures maximum value — the system is designed for this."}
    ]'::jsonb,
    '{"title":"Your Pause Rules","description":"Define IN ADVANCE the only conditions under which you will pause DCA.","steps":["Write down your 3 legitimate pause conditions","Write down 5 emotional triggers that you will IGNORE","Share with an accountability partner","Commit to re-read this in any crash"],"reward":"Discipline Guardian badge + 100 XP"}'::jsonb,
    'free', true
  ),

  -- 10. Scaling Your DCA Over Time
  (
    dca_mastery_id,
    'dca-scaling',
    'Scaling Your DCA Over Time',
    'How to grow your DCA contribution systematically as income, confidence, and convictions compound.',
    '[
      {"type":"paragraph","content":"Your DCA amount should grow. A starter plan at $25/week is perfect — for 3-6 months. Then the plan should evolve as your income, confidence, and conviction grow. Otherwise you cap your compounding unnecessarily."},
      {"type":"highlight","content":"Apice scaling framework: increase DCA by 20% every time you either (a) complete 6 months at current amount, (b) get a raise, or (c) pay down debt. Never increase due to price action — only due to fundamentals of YOUR life."},
      {"type":"stat","label":"Scaled vs flat DCA (10 years)","value":"2-3x","content":"more accumulated capital via systematic scaling"},
      {"type":"paragraph","content":"Scaling traps to avoid: scaling UP during bull mania (you will buy the top), scaling DOWN during bear markets (you will miss the bottom). Scaling should be driven by YOUR life changes — not by market noise. The framework insulates you from both traps."}
    ]'::jsonb,
    4, 75, 10,
    '[
      {"id":"q1","question":"The Apice framework suggests increasing your DCA by:","options":["50% every month","20% at each life-based trigger","Matching bull-market excitement","Never"],"correctIndex":1,"explanation":"20% at life-based triggers compounds aggressively without market-driven mistakes."},
      {"id":"q2","question":"Which is NOT a valid reason to increase your DCA?","options":["Got a raise","Paid down debt","Price is going up","Completed 6 months consistent"],"correctIndex":2,"explanation":"Market price is never the trigger — only YOUR life changes."},
      {"id":"q3","question":"Scaled DCA vs flat DCA over 10 years can mean:","options":["No difference","2-3x more accumulated capital","Worse returns","Only matters in bull markets"],"correctIndex":1,"explanation":"Systematic scaling meaningfully compounds the final outcome over long timeframes."}
    ]'::jsonb,
    '{"title":"Build Your Scaling Schedule","description":"Write down the next three planned increases in your DCA.","steps":["Your current weekly DCA amount","Next +20% target date (based on 6-month milestone or raise)","Following +20% target","Decide: what will you NOT do (scale on price)?"],"reward":"Compounder badge + 125 XP"}'::jsonb,
    'free', true
  )
  on conflict (track_id, slug) do nothing;

  -- ═════════════════════════════════════════════════════════════════
  -- Update denormalized counters on tracks so the UI shows correct totals.
  -- ═════════════════════════════════════════════════════════════════

  update public.learning_tracks t set
    lesson_count = sub.lesson_count,
    xp_total     = sub.xp_total,
    updated_at   = now()
  from (
    select track_id, count(*)::int as lesson_count, coalesce(sum(xp),0)::int as xp_total
    from public.lessons
    where is_published = true
    group by track_id
  ) sub
  where t.id = sub.track_id;

end $$;

-- ═══════════════════════════════════════════════════════════════════
-- END MIGRATION 008
-- ═══════════════════════════════════════════════════════════════════
