import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AppLayout() {
  const location = useLocation();
  const showNav = !['/splash', '/welcome', '/quiz', '/profile-result'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={showNav ? 'pb-24' : ''}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </div>
  );
}
