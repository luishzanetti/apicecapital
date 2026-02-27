import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AppHeader } from './AppHeader';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98 },
};

export function AppLayout() {
  const location = useLocation();
  const showNav = !['/splash', '/welcome', '/quiz', '/profile-result', '/auth'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNav && <AppHeader />}

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "flex-1 w-full max-w-lg mx-auto",
            showNav ? "pt-20 pb-40" : ""
          )}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {showNav && <BottomNav />}
    </div>
  );
}

import { cn } from '@/lib/utils';
