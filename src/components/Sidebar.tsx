import { NavLink, useLocation } from 'react-router-dom';
import { Home, PieChart, Compass, BookOpen, BarChart3, CalendarClock, Crown, Headphones, User, Gift, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { to: '/ai-trade', icon: Bot, label: 'ALTIS Trading' },
  { to: '/dca-planner', icon: CalendarClock, label: 'DCA Planner' },
  { to: '/strategies', icon: Compass, label: 'Strategies' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/learn', icon: BookOpen, label: 'Learn' },
];

const secondaryNav = [
  { to: '/settings', icon: User, label: 'Profile & Settings' },
  { to: '/upgrade', icon: Crown, label: 'Upgrade' },
  { to: '/referrals', icon: Gift, label: 'Referrals' },
  { to: '/support', icon: Headphones, label: 'Support' },
];

function SidebarLink({ item }: { item: { to: string; icon: typeof Home; label: string } }) {
  const location = useLocation();
  const isActive =
    location.pathname === item.to ||
    location.pathname.startsWith(item.to + '/') ||
    (item.to === '/home' && location.pathname === '/');

  return (
    <NavLink to={item.to} className="relative block">
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="sidebarActiveItem"
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.05))',
              border: '1px solid hsl(var(--primary) / 0.2)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </AnimatePresence>
      <div
        className={cn(
          'relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
        )}
      >
        <item.icon
          className={cn(
            'w-[18px] h-[18px] shrink-0',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
        <span className={cn('text-[13px] font-medium', isActive && 'font-semibold')}>
          {item.label}
        </span>
      </div>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-background/80 backdrop-blur-xl border-r border-border/40 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border/30">
        <div className="w-9 h-9 rounded-xl apice-gradient-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
          <svg width="18" height="18" viewBox="0 0 40 40" fill="none" className="text-white">
            <path d="M20 4L36 34H4L20 4Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" fill="none" />
            <path d="M20 14L29 32H11L20 14Z" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight leading-none">Apice</h2>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em] font-semibold leading-none mt-0.5">
            Capital
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}

        {/* Divider */}
        <div className="pt-3 pb-2">
          <div className="h-px bg-border/30" />
          <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium px-3 pt-3">
            More
          </p>
        </div>

        {secondaryNav.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground text-center">
          Apice Capital v1.0
        </p>
      </div>
    </aside>
  );
}
