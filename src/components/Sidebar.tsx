import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, PieChart, Compass, BookOpen, BarChart3, CalendarClock, Crown, Headphones, User, Gift, ChevronUp, ChevronDown } from 'lucide-react';
import { AltisIcon } from '@/components/brand/AltisIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TriangleMark } from '@/components/brand/BrandMark';
import { ApiceLogo } from '@/components/brand';

const mainNav = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { to: '/ai-trade', icon: AltisIcon, label: 'ALTIS Trading' },
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
    <NavLink
      to={item.to}
      aria-label={item.label}
      className="relative block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="sidebarActiveItem"
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--apice-gradient-end) / 0.18), hsl(var(--apice-gradient-start) / 0.08))',
              border: '1px solid hsl(var(--apice-gold) / 0.35)',
              boxShadow: '0 0 30px -8px hsl(var(--apice-gradient-end) / 0.35)',
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
          'relative z-10 flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors duration-150',
          isActive
            ? 'text-white'
            : 'text-white/55 hover:bg-white/[0.04] hover:text-white'
        )}
      >
        <item.icon
          aria-hidden="true"
          className={cn(
            'w-[18px] h-[18px] shrink-0 transition-colors',
            isActive ? 'text-[hsl(var(--apice-gold))]' : 'text-white/60'
          )}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
        <span className={cn('text-[13.5px] font-medium tracking-tight', isActive && 'font-semibold')}>
          {item.label}
        </span>
      </div>
    </NavLink>
  );
}

export function Sidebar() {
  const [moreExpanded, setMoreExpanded] = useState(false);

  return (
    <aside
      aria-label="Primary"
      className="fixed inset-y-0 left-0 z-50 hidden w-[256px] flex-col border-r border-white/5 bg-[#0F1626]/90 backdrop-blur-xl lg:flex"
    >
      {/* Brand — unified horizontal (triangle-in-circle with blue glow + Apice. + tagline).
           Clickable → home. Hover lifts glow intensity for premium feedback. */}
      <NavLink
        to="/home"
        aria-label="Apice — Global AI Investing · go to home"
        className="group flex h-20 items-center justify-start border-b border-white/5 px-3 py-2 text-white transition-all hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-inset"
      >
        <div className="transition-transform duration-300 ease-out group-hover:scale-[1.02] group-active:scale-[0.98]">
          <ApiceLogo
            variant="unified-horizontal-dark"
            size={56}
            aria-label="Apice — Global AI Investing"
          />
        </div>
      </NavLink>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}

        {/* Collapsible More section */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-white/5" />
          <button
            type="button"
            onClick={() => setMoreExpanded(!moreExpanded)}
            aria-expanded={moreExpanded}
            aria-label={moreExpanded ? 'Collapse more' : 'Expand more'}
            className="flex w-full items-center justify-between rounded-lg px-2.5 pt-3 pb-1 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1626]"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
              More
            </span>
            {moreExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />
            )}
          </button>
        </div>

        {moreExpanded && (
          <div className="space-y-0.5">
            {secondaryNav.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-3 py-2.5">
        <p className="text-center text-[10px] tracking-wider text-white/30">
          Apice · v1.5
        </p>
      </div>
    </aside>
  );
}
