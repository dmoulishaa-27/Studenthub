import { useEffect, useState } from 'react';
import { PRESET_AVATARS } from '../types';

interface AvatarProps {
  src: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const isMonogram = src.startsWith('monogram:') || !src || imageFailed;
  const matchedPreset = PRESET_AVATARS.find((p) => p.id === src && p.type === 'monogram');
  const monogramBg =
    matchedPreset && 'bg' in matchedPreset ? matchedPreset.bg : 'bg-[#243B64]';

  if (isMonogram) {
    return (
      <div
        aria-label={name}
        className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold tracking-tight text-white ${monogramBg} ${SIZE_CLASSES[size]} ${className}`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} profile avatar`}
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
      className={`shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
