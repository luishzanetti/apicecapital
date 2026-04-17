-- ═══════════════════════════════════════════════════════════════════
-- EDUCATION SEED: 7 learning tracks + initial badge catalog
-- Migration: 007_seed_education.sql
--
-- Lessons are intentionally NOT seeded here — content lands in Week 4.
-- Safe to re-run: every insert uses ON CONFLICT DO NOTHING so manual
-- tweaks to seeded rows are preserved.
-- ═══════════════════════════════════════════════════════════════════

-- ─── A. Learning Tracks ──────────────────────────────────────────

insert into public.learning_tracks (slug, title, description, tier, "order", icon, color_theme) values
  ('foundation',             'Foundation',             'Kill your crypto fears in 30 minutes',               'free', 1, 'BookOpen',   '212 100% 62%'),
  ('dca-mastery',             'DCA Mastery',            'From first buy to unstoppable habit',                'free', 2, 'Repeat',     '152 72% 52%'),
  ('portfolio-architecture',  'Portfolio Architecture', 'Build a real crypto portfolio',                      'pro',  3, 'PieChart',   '265 90% 68%'),
  ('market-intelligence',     'Market Intelligence',    'Read the market like a pro',                         'pro',  4, 'Brain',      '190 95% 60%'),
  ('altis-trading',           'ALTIS Trading',          'Advanced leveraged strategies',                      'club', 5, 'TrendingUp', '348 90% 62%'),
  ('elite-mindset',           'Elite Investor Mindset', 'Think like the top 1%',                              'club', 6, 'Crown',      '38 92% 58%'),
  ('capital-game',            'Capital Game',           'Living track for lifetime learning',                 'club', 7, 'Infinity',   '280 80% 65%')
on conflict (slug) do nothing;

-- ─── B. Badges ───────────────────────────────────────────────────
-- Schema: slug (unique), name, description, icon, rarity, unlock_condition_json
-- Supported condition types in education-progress edge function:
--   { type: 'lessons_completed', count: N }
--   { type: 'streak_reached',    days:  N }
--   { type: 'track_completed',   trackSlug: 'foundation' }
--   { type: 'total_xp',          amount: N }
--   { type: 'perfect_quiz',      count:  N }
--   { type: 'first_quiz_pass' }

insert into public.badges (slug, name, description, icon, rarity, unlock_condition_json, xp_reward) values
  -- Lesson milestones
  ('first_lesson',         'First Step',        'Completed your first lesson',           '🎓', 'common',    '{"type":"lessons_completed","count":1}'::jsonb,   0),
  ('ten_lessons',          'Steady Learner',    'Completed 10 lessons',                  '📚', 'rare',      '{"type":"lessons_completed","count":10}'::jsonb,  50),
  ('fifty_lessons',        'Knowledge Seeker',  'Completed 50 lessons',                  '📖', 'epic',      '{"type":"lessons_completed","count":50}'::jsonb,  250),

  -- Track completions
  ('foundation_complete',  'Foundation Laid',   'Completed the Foundation track',        '🏛️', 'rare',      '{"type":"track_completed","trackSlug":"foundation"}'::jsonb,             100),
  ('dca_master',           'DCA Disciple',      'Completed DCA Mastery',                 '📈', 'rare',      '{"type":"track_completed","trackSlug":"dca-mastery"}'::jsonb,            100),
  ('portfolio_architect',  'Portfolio Architect','Completed Portfolio Architecture',     '🏗️', 'epic',      '{"type":"track_completed","trackSlug":"portfolio-architecture"}'::jsonb, 200),
  ('market_reader',        'Market Reader',     'Completed Market Intelligence',         '🧠', 'epic',      '{"type":"track_completed","trackSlug":"market-intelligence"}'::jsonb,    200),
  ('altis_trader',         'ALTIS Trader',      'Completed ALTIS Trading',               '⚡', 'legendary', '{"type":"track_completed","trackSlug":"altis-trading"}'::jsonb,          400),

  -- Streaks
  ('7_day_streak',         'Week Warrior',      '7 days straight',                       '🔥', 'rare',      '{"type":"streak_reached","days":7}'::jsonb,     50),
  ('30_day_streak',        'Monthly Master',    '30 days straight — Blue Flame unlocked','💙', 'epic',      '{"type":"streak_reached","days":30}'::jsonb,   200),
  ('100_day_streak',       'Centurion',         '100 days straight — Purple Flame',      '💜', 'legendary', '{"type":"streak_reached","days":100}'::jsonb,  500),
  ('365_day_streak',       'Year of Fire',      '365 days — Rainbow Flame',              '🌈', 'mythic',    '{"type":"streak_reached","days":365}'::jsonb, 2000),

  -- XP milestones
  ('xp_1000',              'Four Digits',       'Reached 1,000 XP',                      '💎', 'rare',      '{"type":"total_xp","amount":1000}'::jsonb,  0),
  ('xp_5000',              'Five Figures',      'Reached 5,000 XP',                      '🏆', 'legendary', '{"type":"total_xp","amount":5000}'::jsonb,  0),

  -- Quiz excellence
  ('perfect_mind',         'Perfect Mind',      'Scored 100% on a quiz',                 '🎯', 'rare',      '{"type":"perfect_quiz","count":1}'::jsonb, 25)
on conflict (slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- END MIGRATION 007
-- ═══════════════════════════════════════════════════════════════════
