import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";

// Default ambient study music (public domain lofi)
const DEFAULT_MUSIC_URL = "https://cdn.pixabay.com/audio/2022/03/23/audio_8d0c6fbcb8.mp3";

export function useFocusMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const focusMusicEnabled = useAppStore((state) => state.focusMusicEnabled);
  const strictFocusMode = useAppStore((state) => state.strictFocusMode);
  const timer = useAppStore((state) => state.timer);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(DEFAULT_MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
      audioRef.current.preload = "auto";
    }
  }, []);

  // Play/pause based on focusMusicEnabled and active session
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const isActive = timer.activeSessionId && !timer.isPaused;
    const shouldPlay = focusMusicEnabled && (strictFocusMode ? isActive : true);

    if (shouldPlay) {
      void audio.play().catch((err) => {
        console.warn("Failed to play focus music:", err);
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [focusMusicEnabled, strictFocusMode, timer.activeSessionId, timer.isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying: focusMusicEnabled && (strictFocusMode ? timer.activeSessionId && !timer.isPaused : true),
    toggle: () => {
      const enabled = !focusMusicEnabled;
      useAppStore.getState().setFocusMusicEnabled(enabled);
    },
  };
}