import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ExplosiveFilterSector, ExplosiveSortKey } from '@/types/explosive';

interface ExplosiveFiltersProps {
  activeSector: ExplosiveFilterSector;
  onSectorChange: (sector: ExplosiveFilterSector) => void;
  activeSort: ExplosiveSortKey;
  onSortChange: (sort: ExplosiveSortKey) => void;
}

const SECTORS: { value: ExplosiveFilterSector; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'defi', label: 'DeFi' },
  { value: 'l1', label: 'L1' },
  { value: 'l2', label: 'L2' },
  { value: 'ai', label: 'AI' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'rwa', label: 'RWA' },
  { value: 'infra', label: 'Infra' },
  { value: 'meme', label: 'Meme' },
];

const SORTS: { value: ExplosiveSortKey; label: string }[] = [
  { value: 'score', label: 'Score' },
  { value: 'risk', label: 'Risk' },
  { value: 'change24h', label: '24h %' },
  { value: 'marketCap', label: 'Mkt Cap' },
];

export function ExplosiveFilters({ activeSector, onSectorChange, activeSort, onSortChange }: ExplosiveFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Sector pills */}
      <div className="flex flex-wrap gap-1.5">
        {SECTORS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSectorChange(value)}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium transition-all border',
              activeSector === value
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-secondary/40 text-muted-foreground border-border/20 hover:bg-secondary/60',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort pills */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Sort:</span>
        <div className="flex gap-1">
          {SORTS.map(({ value, label }) => (
            <Badge
              key={value}
              variant={activeSort === value ? 'default' : 'secondary'}
              className={cn(
                'cursor-pointer text-[10px] px-2 py-0',
                activeSort === value && 'bg-primary/20 text-primary border-primary/30',
              )}
              onClick={() => onSortChange(value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
