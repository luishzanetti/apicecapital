import { EXPERTS, type ExpertId } from '@/data/experts';
import { cn } from '@/lib/utils';

export interface ExpertAvatarProps {
  expert: ExpertId;
  size?: number;
  /** Show the emerald brand-signature dot (bottom-right). Already baked into the PNG; pass false only if rendering without it is needed. */
  showBrandDot?: boolean;
  /** Show colored ring matching the expert's accent color. */
  showAccentRing?: boolean;
  className?: string;
}

export function ExpertAvatar({
  expert,
  size = 64,
  showBrandDot = true,
  showAccentRing = false,
  className,
}: ExpertAvatarProps) {
  const data = EXPERTS[expert];
  const ringWidth = showAccentRing ? 2 : 0;

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: showAccentRing
            ? `0 0 0 ${ringWidth}px ${data.accentHex}`
            : undefined,
          outline: showAccentRing ? `${ringWidth}px solid transparent` : undefined,
          outlineOffset: showAccentRing ? '2px' : undefined,
        }}
      >
        <img
          src={data.imagePath}
          alt={`${data.name} — ${data.title}`}
          loading="lazy"
          decoding="async"
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </div>
      {!showBrandDot && (
        // A subtle overlay to mask the baked-in brand dot if consumer explicitly disables it.
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[6%] right-[6%] block rounded-full bg-white/90"
          style={{ width: '16%', height: '16%' }}
        />
      )}
    </div>
  );
}
