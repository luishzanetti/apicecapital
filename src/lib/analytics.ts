import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

const SESSION_ID = Math.random().toString(36).substring(2, 15);

export function trackEvent(eventName: string, eventData?: Record<string, unknown>) {
  if (!isSupabaseConfigured) return;

  // Validate event name to prevent injection of arbitrary strings
  if (!eventName || typeof eventName !== 'string' || eventName.length > 100) return;

  // Ensure user is authenticated before inserting (RLS requires authenticated role)
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) return; // Skip tracking for unauthenticated users

    supabase.from('analytics_events').insert({
      event_name: eventName,
      event_data: eventData || {},
      page: window.location.pathname,
      session_id: SESSION_ID,
    }).then(() => {}).catch(() => {});
  }).catch(() => {});
}

// Pre-defined events
export const AnalyticsEvents = {
  // Onboarding
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Core actions
  DCA_PLAN_CREATED: 'dca_plan_created',
  DCA_RECOMMENDED_ACTIVATED: 'dca_recommended_activated',
  DEPOSIT_LOGGED: 'deposit_logged',
  PORTFOLIO_SELECTED: 'portfolio_selected',

  // AI
  AI_CHAT_SENT: 'ai_chat_sent',
  AI_RECOMMENDATION_VIEWED: 'ai_recommendation_viewed',
  AI_INSIGHT_VIEWED: 'ai_insight_viewed',

  // Engagement
  LESSON_COMPLETED: 'lesson_completed',
  BADGE_EARNED: 'badge_earned',
  STREAK_MILESTONE: 'streak_milestone',

  // Monetization
  UPGRADE_PAGE_VIEWED: 'upgrade_page_viewed',
  REFERRAL_LINK_CLICKED: 'referral_link_clicked',
  TRIAL_STARTED: 'trial_started',

  // Navigation
  PAGE_VIEW: 'page_view',
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
} as const;
