import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { ErrorBoundary } from './ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-background">
      <ScrollToTop />

      {showNav && <Sidebar />}
      {showNav && <AppHeader />}

      {/* Main content area */}
      <div
        className={cn(
          'min-h-screen',
          showNav && 'lg:pl-[240px]'
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
              'w-full mx-auto',
              // Mobile: full width with padding
              'px-4 sm:px-5',
              // Tablet: wider with more padding
              'md:px-6 md:max-w-2xl',
              // Desktop: max width for readability
              'lg:px-8 lg:max-w-4xl',
              'xl:max-w-5xl',
              // Spacing for nav elements
              showNav ? 'pt-[72px] lg:pt-6 pb-32 lg:pb-8' : ''
            )}
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
    </div>
  );
}
