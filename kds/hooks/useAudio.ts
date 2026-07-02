import { useCallback, useRef } from 'react';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ensure = () => {
    // Reuse audio element to avoid creating new ones on every order
    if (!audioRef.current) {
      audioRef.current = new Audio('/alert.wav');
    }
    return audioRef.current;
  };

  const playAlert = useCallback(() => {
    const audio = ensure();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // iOS requires user gesture to play audio.
      // First tap on the page will unlock it.
    });
  }, []);

  // Call from a user gesture: silently plays+pauses so later alerts are allowed
  const unlock = useCallback(() => {
    const audio = ensure();
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  }, []);

  return { playAlert, unlock };
};
