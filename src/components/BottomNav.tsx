import { NavLink, useLocation } from 'react-router-dom';
import { Home, PieChart, Compass, BookOpen, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { to: '/strategies', icon: Compass, label: 'Strategies' },
  { to: '/learn', icon: BookOpen, label: 'Learn' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-6 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto flex items-center bg-card/85 backdrop-blur-xl border border-border/40 px-2 py-1.5 rounded-2xl shadow-2xl shadow-black/30">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/') ||
            (item.to === '/home' && location.pathname === '/');

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              <item.icon className={cn(
                "w-4 h-4 relative z-10 transition-transform duration-300",
                isActive && "scale-110"
              )} />
              <span className="text-[8px] font-bold uppercase tracking-tight relative z-10">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
