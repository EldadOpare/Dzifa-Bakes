import { useEffect, useState, type ReactNode } from 'react';
import { motion, useMotionValue } from 'framer-motion';

import { cn } from '@/lib/utils';

type Direction = 'left' | 'right';

export type GalleryPhoto = { src: string; alt: string };

// Horizontal fan layout: offsets are in px at full size and scale down on small screens.
const layout: { x: number; y: number; zIndex: number; direction: Direction }[] = [
  { x: -320, y: 15, zIndex: 50, direction: 'left' },
  { x: -160, y: 32, zIndex: 40, direction: 'left' },
  { x: 0, y: 8, zIndex: 30, direction: 'right' },
  { x: 160, y: 22, zIndex: 20, direction: 'right' },
  { x: 320, y: 44, zIndex: 10, direction: 'left' },
];

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return compact;
}

export const PhotoGallery = ({
  photos,
  eyebrow,
  title,
  description,
  actions,
  animationDelay = 0.5,
}: {
  photos: GalleryPhoto[];
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  animationDelay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const compact = useCompact();
  const size = compact ? 150 : 270;
  const scale = compact ? 0.5 : 1.22;

  useEffect(() => {
    // Fade the container in first, then fan the photos out.
    const visibilityTimer = setTimeout(() => setIsVisible(true), animationDelay * 1000);
    const animationTimer = setTimeout(() => setIsLoaded(true), (animationDelay + 0.4) * 1000);
    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [animationDelay]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
  };

  const photoVariants = {
    hidden: { x: 0, y: 0, rotate: 0, scale: 1 },
    visible: (custom: { x: number; y: number; order: number }) => ({
      x: custom.x,
      y: custom.y,
      rotate: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 70, damping: 12, mass: 1, delay: custom.order * 0.15 },
    }),
  };

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-[200px] -z-10 h-[300px] w-full bg-[linear-gradient(to_right,#d4d8dc_1px,transparent_1px),linear-gradient(to_bottom,#d4d8dc_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] max-md:hidden" />
      {eyebrow && <p className="my-2 text-center font-display text-lg text-primary">{eyebrow}</p>}
      <h1 className="mx-auto max-w-3xl text-center font-display text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[1.05] tracking-[-.03em] text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mx-auto mt-6 max-w-xl text-center text-[17px] leading-7 text-muted-foreground">{description}</p>
      )}
      <div className="relative mb-8 mt-12 flex h-[340px] w-full items-center justify-center md:h-[400px]">
        <motion.div
          className="relative mx-auto flex w-full max-w-7xl justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className="relative flex w-full justify-center"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? 'visible' : 'hidden'}
          >
            <div className="relative" style={{ height: size, width: size }}>
              {/* Reverse order so the highest z-index photos render last in the DOM. */}
              {photos
                .slice(0, layout.length)
                .map((photo, order) => ({ photo, order, ...layout[order] }))
                .reverse()
                .map(({ photo, order, x, y, zIndex, direction }) => (
                  <motion.div
                    key={photo.src}
                    className="absolute left-0 top-0"
                    style={{ zIndex }}
                    variants={photoVariants}
                    custom={{ x: x * scale, y: y * scale, order }}
                  >
                    <Photo width={size} height={size} src={photo.src} alt={photo.alt} direction={direction} />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      {actions && <div className="flex w-full flex-wrap items-center justify-center gap-4">{actions}</div>}
    </div>
  );
};

function getRandomNumberInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const Photo = ({
  src,
  alt,
  className,
  direction,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  direction?: Direction;
  width: number;
  height: number;
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  useEffect(() => {
    setRotation(getRandomNumberInRange(1, 4) * (direction === 'left' ? -1 : 1));
  }, [direction]);

  function handleMouse(event: { currentTarget: { getBoundingClientRect: () => DOMRect }; clientX: number; clientY: number }) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  const resetMouse = () => {
    x.set(200);
    y.set(200);
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      whileTap={{ scale: 1.2, zIndex: 9999 }}
      whileHover={{ scale: 1.1, rotateZ: 2 * (direction === 'left' ? -1 : 1), zIndex: 9999 }}
      whileDrag={{ scale: 1.1, zIndex: 9999 }}
      initial={{ rotate: 0 }}
      animate={{ rotate: rotation }}
      style={{
        width,
        height,
        perspective: 400,
        zIndex: 1,
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
      className={cn(className, 'relative mx-auto shrink-0 cursor-grab active:cursor-grabbing')}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      draggable={false}
      tabIndex={0}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl border-4 border-white shadow-lg ring-1 ring-black/5">
        <img className="h-full w-full object-cover" style={{ objectPosition: 'center 35%' }} src={src} alt={alt} draggable={false} />
      </div>
    </motion.div>
  );
};
