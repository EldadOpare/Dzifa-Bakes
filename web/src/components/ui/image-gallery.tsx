import { useState } from 'react';
import { cn } from '@/lib/utils';

export type GalleryImage = { src: string; alt: string };

// A row of photos. Resting photos show as slim slices; the one you hover or tap opens
// to its natural proportions, so the whole photo is seen exactly as it was taken.
export function ImageGallery({ images, className }: { images: GalleryImage[]; className?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>({});

  return (
    <div
      className={cn('flex h-[var(--gh)] w-full items-stretch gap-2 [--gh:460px] sm:[--gh:540px]', className)}
      onMouseLeave={() => setActive(null)}
    >
      {images.map((image, index) => {
        const isActive = active === index;
        const ratio = ratios[image.src] ?? 0.75;
        return (
          <button
            key={image.src}
            type="button"
            aria-label={image.alt}
            aria-pressed={isActive}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive((current) => (current === index ? null : index))}
            className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-muted transition-[flex-basis,flex-grow] duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              flexGrow: isActive ? 0 : 1,
              flexShrink: 1,
              // Full height times the photo's own ratio gives its natural width, capped so wide photos can't push the others out.
              flexBasis: isActive ? `min(calc(var(--gh) * ${ratio}), 72%)` : '0px',
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              draggable={false}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalHeight) setRatios((current) => ({ ...current, [image.src]: naturalWidth / naturalHeight }));
              }}
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 35%' }}
            />
          </button>
        );
      })}
    </div>
  );
}
