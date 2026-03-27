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
    <div className="fixed bottom-4 left-0 right-0 z-40 px-5 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto flex items-center glass-nav px-1.5 py-1.5 rounded-[22px] shadow-2xl shadow-black/25">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/') ||
            (item.to === '/home' && location.pathname === '/');

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-[18px] transition-all duration-200 press-scale',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active background pill */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-[18px]"
                    style={{
                      background: 'linear-gradient(145deg, hsl(var(--primary) / 0.14), hsl(var(--primary) / 0.06))',
                      border: '1px solid hsl(var(--primary) / 0.2)',
                    }}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 480, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.div
                animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative z-10"
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </motion.div>

              {/* Label */}
              <span
                className={cn(
                  'text-[9px] font-semibold uppercase tracking-wide relative z-10 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
