import { ClientAvatar } from './ClientAvatar';
import { getClient, type Client } from '@/data/clients';
import { cn } from '@/lib/utils';

export interface TestimonialProps {
  clientId: string;
  quote: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function Testimonial({ clientId, quote, rating = 5, className }: TestimonialProps) {
  const client = getClient(clientId);
  if (!client) return null;

  return (
    <figure
      className={cn(
        'flex items-start gap-4 rounded-2xl border border-[color:var(--apice-border,#E4E0D7)] bg-[color:var(--apice-surface,#FFFFFF)] p-6',
        className,
      )}
    >
      <ClientAvatar clientId={clientId} size={64} className="flex-shrink-0" />
      <div className="min-w-0">
        <Stars rating={rating} />
        <blockquote className="mt-2 text-[15px] italic leading-relaxed text-[color:var(--apice-text-secondary,#3F3D38)]">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <figcaption className="mt-2 text-[12px] font-semibold text-[color:var(--apice-text-tertiary,#6E6A61)]">
          {client.name}, {client.age} · {client.city}
          {client.plan ? ` · Apice ${client.plan === 'free' ? 'user' : client.plan + ' member'}` : ''}
          {client.since ? ` since ${client.since}` : ''}
        </figcaption>
      </div>
    </figure>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-1 text-[14px] tracking-[2px] text-[#16A661]"
      aria-label={`${rating} of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden="true">
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export type { Client };
