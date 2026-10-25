'use client';

import { useEffect } from 'react';
import { getAudioManager } from '@/lib/audio/AudioManager';

/**
 * Plays the shared menu music. The AudioContext is only resumed after a real
 * user gesture, so browser autoplay policies are respected.
 */
export function useMenuAudio(
  style: 'menu' | 'sunrise' | 'night' | 'desert' | 'coast' | 'frost' | 'forest' | 'neon' = 'menu',
  ambience?: 'mountain' | 'city' | 'desert' | 'coastal' | 'snow' | 'forest' | 'neon',
  enabled = true,
) {
  useEffect(() => {
    const audio = getAudioManager();
    if (!enabled) {
      audio.stopMusic();
      audio.stopAmbience();
      return;
    }
    let active = true;
    const start = () => {
      if (!active) return;
      audio.playMusic(style);
      if (ambience) audio.playAmbience(ambience);
    };
    // Never create an AudioContext before a gesture. If it is already running
    // (for example after returning from a race), resume menu audio immediately.
    if (audio.isUnlocked) start();
    const onFirst = () => {
      void audio.unlock().then((ok) => {
        if (ok) start();
      });
    };
    window.addEventListener('pointerdown', onFirst, { once: true, passive: true });
    window.addEventListener('keydown', onFirst, { once: true });
    return () => {
      active = false;
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
      audio.stopMusic();
      audio.stopAmbience();
    };
  }, [style, ambience, enabled]);
}
