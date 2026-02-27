import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AppHeader } from './AppHeader';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const location = useLocation();
  const showNav = !['/splash', '/welcome', '/quiz', '/profile-result', '/auth'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            "flex-1 w-full max-w-lg mx-auto",
            showNav ? "pt-16 pb-36" : ""
          )}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {showNav && <BottomNav />}
    </div>
  );
}
