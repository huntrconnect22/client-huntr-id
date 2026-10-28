import React, { useEffect, useRef } from 'react';
import { useEventBus } from '../lib/EventBus';

export default function NotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { lastEvent } = useEventBus();
  const lastPlayedId = useRef<string | null>(null);
  // Record when this component mounted — only play sounds for events that arrive AFTER mount.
  // This prevents the sound from firing when navigating between pages (which re-mounts this
  // component) because lastEvent in EventBus persists across navigations.
  const mountedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!lastEvent) return;

    const eventId = lastEvent.data?.id ?? lastEvent.data?.data?.id;
    // Skip: already played, or event arrived before this component mounted
    const eventTime = lastEvent.data?.created_at
      ? new Date(lastEvent.data.created_at).getTime()
      : null;

    if (eventId === lastPlayedId.current) return;
    if (eventTime !== null && eventTime < mountedAt.current) return;

    lastPlayedId.current = eventId ?? null;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.warn('Audio playback failed (interaction required?):', err);
      });
    }
  }, [lastEvent]);

  return (
    <audio
      ref={audioRef}
      src="/assets/notification-sound/notif-tone.mp3"
      preload="auto"
    />
  );
}
