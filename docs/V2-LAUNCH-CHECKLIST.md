# V2 Launch Checklist

## Completed in V2 (6 weeks of development):
- [x] Migration 006 + 007 (11 new tables)
- [x] Migration 008 (18 seeded lessons — Foundation + DCA Mastery)
- [x] ALTIS config loop fix
- [x] Transfer system (Spot→Unified native)
- [x] Balance monitoring + fund alerts
- [x] Education platform foundation
- [x] Academy UI (LearningMap, LessonPlayer, QuizEngine)
- [x] Gamification (Badges, Challenges, LevelUp celebrations)
- [x] 7 tracks + 15 badges seeded
- [x] Home Academy widget (continue-lesson CTA + streak flame)
- [x] Settings Academy section (View Badges / Challenges / Reset progress)
- [x] Settings Account Transfer link (Spot ↔ Unified ↔ Funding ↔ Contract)
- [x] Legacy redirect: `/learn/:trackId/:lessonId` → `/learn/lesson/:lessonId`
- [x] Local `resetLearnProgress` store action (clears lessons, streak, XP, badges)

## Requires Manual Action Before Launch:
- [ ] Run migrations 006, 007, 008 in production Supabase
- [ ] Deploy Edge Functions: `bybit-transfer`, `balance-monitor`, `education-progress`, `challenge-engine`
- [ ] Set up cron schedule for `balance-monitor` (daily 08:00 UTC)
- [ ] Set `CRON_SECRET` env var in Supabase for cron auth
- [ ] Complete remaining lesson content (Portfolio Architecture, Market Intelligence, ALTIS Trading, Elite Mindset, Capital Game tracks)
- [ ] Record video content for lessons (or leave as text-only initially — `video_provider` default is `none`, so the player degrades gracefully)
- [ ] Set up Stripe subscription for Pro/Club payments
- [ ] Configure push notification service (Firebase/APNs)
- [ ] PWA icons (192x192, 512x512 PNGs)
- [ ] Bybit affiliate code (env var `VITE_BYBIT_AFFILIATE_ID`)

## Metrics to Track Post-Launch:
- Free → Pro conversion rate (target: 2-3%)
- Pro → Club conversion rate (target: 12-15%)
- Lesson completion rate (target: 75%+)
- Challenge completion rate (target: 25%)
- 7-day streak rate (target: 30%)
- Transfer success rate (target: 99.9%)
- Fund alert dismiss/resolve rate

## V3 Priorities (post-launch):
- Mobile app (React Native)
- Social layer (leaderboards, shared portfolios)
- AI Agent trading (Claude executes trades)
- More video content
- Advanced analytics

## Key File References (absolute paths)

### Migrations
- `supabase/migrations/006_v2_foundation.sql` — tables: `learning_tracks`, `lessons`, `lesson_progress`, `badges`, `user_badges`, `user_xp`, `challenges`, `challenge_progress`, `balance_snapshots`, `fund_alerts`, `account_transfers`
- `supabase/migrations/007_seed_education.sql` — 7 tracks + 15 badges
- `supabase/migrations/008_seed_lessons.sql` — 18 lessons (8 Foundation + 10 DCA Mastery) with content blocks, quizzes, and challenges; denormalizes `lesson_count` / `xp_total` on tracks

### App surface
- `src/App.tsx` — routes `/learn`, `/learn/lesson/:lessonId`, `/learn/:trackId/:lessonId` (legacy redirect), `/badges`, `/challenges`, `/settings`, `/portfolio`
- `src/pages/Home.tsx` — mounts `AcademyHomeWidget` in left column + `GamificationWidget` footer
- `src/pages/Settings.tsx` — Apice Academy menu section (Badges / Challenges / Academy / Reset progress)
- `src/components/academy/AcademyHomeWidget.tsx` — compact Academy preview
- `src/store/slices/learnSlice.ts` — local state + new `resetLearnProgress` action
- `src/store/slices/educationSlice.ts` — remote edge-function state (`hydrateEducation`, `completeLesson_v2`)

### Known limitations / follow-ups
- `resetLearnProgress` only clears LOCAL state. Server-side `user_xp`, `lesson_progress`, and `user_badges` rows remain. An admin-only `/reset-education` edge function should be added if full server-side reset is required.
- Sample lesson content lives in two places: `src/data/sampleData.ts` (in-app fallback for demo mode) and `supabase/migrations/008_seed_lessons.sql` (production). Any copy change must touch both, OR the demo fallback should be removed post-launch.
- `AcademyHomeWidget` computes level from local `completedLessons.length * 50`. Once server state is the source of truth, swap to `useAppStore(s => s.totalXP)` to reflect bonus XP from quizzes and challenges.
