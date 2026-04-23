import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { ErrorBoundary } from './ErrorBoundary';
import { AiChatProvider } from './ai/AiChatContext';
import { AiAdvisorChat } from './ai/AiAdvisorChat';
import { cn } from '@/lib/utils';

/**
 * AppLayout — shared canvas for all authenticated routes.
 * Applies the AiTradeLanding premium background decor (dark #050816 + triple
 * radial gradient + grid fade) so every inner page inherits the premium
 * aesthetic without per-page wrapping. Dark mode forced.
 */

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Routes that render their own full-screen canvas (marketing/onboarding/auth)
// and therefore should NOT get the AppLayout chrome (Sidebar, Header, BottomNav).
const FULLSCREEN_ROUTES = new Set([
  '/splash',
  '/welcome',
  '/quiz',
  '/quiz-v2',
  '/quiz-legacy',
  '/profile-result',
  '/auth',
  '/onboarding',
  '/landing',
]);

export function AppLayout() {
  const location = useLocation();
  const showNav = !FULLSCREEN_ROUTES.has(location.pathname);

  // Force dark mode app-wide.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AiChatProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-[#0F1626] text-white antialiased">
        {/* Softer background decor — elevated from near-black to slate-blue, keeps ambient blue glow signature */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(82,143,255,0.14),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(234,179,8,0.06),transparent_25%),radial-gradient(circle_at_15%_85%,rgba(22,166,97,0.08),transparent_30%),linear-gradient(180deg,#0F1626_0%,#152038_50%,#0F1626_100%)]" />
          <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:96px_96px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]" />
        </div>

        <ScrollToTop />

        {showNav && <Sidebar />}
        {showNav && <AppHeader />}

        {/* Main content area — left-padded for sidebar (256px), fills remaining viewport */}
        <div
          className={cn(
            'relative z-10 min-h-screen',
            showNav && 'lg:pl-[256px]'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                // Fill remaining viewport — no artificial max-width that creates dead space on ultrawide
                'w-full',
                // Mobile: leave space for AppHeader (~72px) + BottomNav (~80px) + safe area;
                // desktop: page handles its own padding (lg:px-8 xl:px-10).
                showNav ? 'pt-16 lg:pt-0 pb-24 lg:pb-8' : ''
              )}
              style={
                showNav
                  ? { paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }
                  : undefined
              }
            >
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </motion.main>
          </AnimatePresence>
        </div>

        {showNav && (
          <div className="lg:hidden">
            <BottomNav />
          </div>
        )}

        {/* Global AI Advisor — available on every authenticated route */}
        {showNav && <AiAdvisorChat />}
      </div>
    </AiChatProvider>
  );
}
