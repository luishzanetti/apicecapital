import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AppHeader } from './AppHeader';
import { ErrorBoundary } from './ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export function AppLayout() {
  const location = useLocation();
  const showNav = !['/splash', '/welcome', '/quiz', '/profile-result', '/auth'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScrollToTop />
      {showNav && <AppHeader />}

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            duration: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            "flex-1 w-full max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8",
            showNav ? "pt-16 pb-36" : ""
          )}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </motion.main>
      </AnimatePresence>

      {showNav && <BottomNav />}
    </div>
  );
}
