'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CarCustomization, CarDefinition, DestinationDefinition, Quality } from '@/lib/types';
import type { PreviewEngine } from '@/lib/game/preview';

interface PreviewCanvasProps {
  car: CarDefinition;
  customization: CarCustomization;
  mode?: 'car' | 'destination';
  destination?: DestinationDefinition;
  quality?: Quality;
  invertCamera?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Client-only wrapper around the Three.js preview renderer. The module is
 * imported dynamically so the game engine never lands in the initial bundle.
 */
export function PreviewCanvas({
  car,
  customization,
  mode = 'car',
  destination,
  quality = 'high',
  invertCamera = false,
  className,
  ariaLabel = 'Interactive 3D preview',
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PreviewEngine | null>(null);
  const configRef = useRef<{ car: CarDefinition; customization: CarCustomization }>({
    car,
    customization,
  });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  configRef.current = { car, customization };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let engine: PreviewEngine | null = null;
    setReady(false);
    setFailed(false);

    void import('@/lib/game/preview')
      .then(({ PreviewEngine }) => {
        if (cancelled || !canvasRef.current) return;
        engine = new PreviewEngine(canvasRef.current, {
          mode,
          quality,
          car: configRef.current.car,
          customization: configRef.current.customization,
          destination,
          invertCamera,
        });
        engineRef.current = engine;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      engine?.dispose();
      engine = null;
      if (engineRef.current === engine) engineRef.current = null;
      engineRef.current = null;
    };
  }, [mode, quality, destination?.id, invertCamera, destination]);

  useEffect(() => {
    engineRef.current?.updateCar(car, customization);
  }, [car, customization]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 240 }}>
      <canvas
        ref={canvasRef}
        className={className}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'pan-y',
          cursor: 'grab',
          opacity: ready ? 1 : 0,
          transition: 'opacity .5s ease',
        }}
      />
      {!ready && !failed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-dim)',
          }}
        >
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      {failed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            padding: 20,
            color: 'var(--text-dim)',
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          3D preview unavailable on this device. The game itself may still run.
        </div>
      )}
    </div>
  );
}
