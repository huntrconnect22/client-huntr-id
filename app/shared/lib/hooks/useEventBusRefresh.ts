import { useEffect, useRef } from 'react';
import { useEventBus } from '../EventBus';
import type { NotificationEvent } from '../EventBus';

export function useEventBusRefresh(
  eventTypes: NotificationEvent['type'][],
  refreshFn: () => void
) {
  const { lastEvent } = useEventBus();
  const lastProcessedId = useRef<string | null>(null);

  useEffect(() => {
    if (
      lastEvent && 
      eventTypes.includes(lastEvent.type) && 
      lastEvent.data?.id !== lastProcessedId.current
    ) {
      lastProcessedId.current = lastEvent.data?.id;
      console.log('useEventBusRefresh: Refreshing data for event:', lastEvent);
      refreshFn();
    }
  }, [lastEvent, eventTypes, refreshFn]);
}
