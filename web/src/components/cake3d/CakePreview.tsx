import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import type { CakeDesign } from './Cake';

// three.js is heavy, so it only loads when the builder is on screen.
const CakeViewer = lazy(() => import('./CakeViewer'));

const Unavailable = () => (
  <div className="grid h-full w-full place-items-center p-8 text-center text-sm text-muted-foreground">
    The 3D preview isn’t available on this device. Your choices are still saved and priced below.
  </div>
);

export function CakePreview({ design }: { design: CakeDesign }) {
  return (
    <ErrorBoundary FallbackComponent={Unavailable}>
      <Suspense
        fallback={<div className="grid h-full w-full place-items-center text-sm text-muted-foreground">Preheating the oven…</div>}
      >
        <CakeViewer design={design} />
      </Suspense>
    </ErrorBoundary>
  );
}
