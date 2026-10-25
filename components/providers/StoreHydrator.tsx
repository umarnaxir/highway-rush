'use client';

import { useEffect } from 'react';
import { getAudioManager } from '@/lib/audio/AudioManager';
import { useGameStore } from '@/lib/store/useGameStore';

export function StoreHydrator() {
  const setHydrated = useGameStore((state) => state.setHydrated);
  const settings = useGameStore((state) => state.settings);

  useEffect(() => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setHydrated(true);
      useGameStore.getState().ensureDailyMissions();
    };
    const unsubscribe = useGameStore.persist.onFinishHydration(finish);
    if (useGameStore.persist.hasHydrated()) finish();
    else void useGameStore.persist.rehydrate();
    const fallback = window.setTimeout(finish, 1600);
    return () => {
      window.clearTimeout(fallback);
      unsubscribe();
    };
  }, [setHydrated]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reducedMotion = String(settings.accessibility.reducedMotion);
    root.dataset.contrast = String(settings.accessibility.highContrast);
    root.style.setProperty('--ui-scale', String(settings.accessibility.uiScale));
    document.body.classList.toggle('high-contrast', settings.accessibility.highContrast);
  }, [settings.accessibility]);

  useEffect(() => {
    getAudioManager().setVolumes(settings.audio);
  }, [settings.audio]);

  useEffect(() => {
    const audio = getAudioManager();
    const onInteraction = () => {
      void audio.unlock();
    };
    window.addEventListener('pointerdown', onInteraction, { once: true, passive: true });
    window.addEventListener('keydown', onInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onInteraction);
      window.removeEventListener('keydown', onInteraction);
    };
  }, []);

  return null;
}
