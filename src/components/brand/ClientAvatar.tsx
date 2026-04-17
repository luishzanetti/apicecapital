import { getClient } from '@/data/clients';
import { cn } from '@/lib/utils';

export interface ClientAvatarProps {
  clientId: string;
  size?: number;
  className?: string;
}

export function ClientAvatar({ clientId, size = 48, className }: ClientAvatarProps) {
  const client = getClient(clientId);
  if (!client) return null;

  return (
    <div
      className={cn('overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      <img
        src={client.imagePath}
        alt={`${client.name}, ${client.age} · ${client.city}`}
        loading="lazy"
        decoding="async"
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
