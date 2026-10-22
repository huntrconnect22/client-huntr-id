import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { ensureEcho, getEcho, getConnectionState, resetConnection } from './echo';
import { SessionManager } from './session';

export interface NotificationEvent {
  type: string;
  data: any;
}

interface EventBusContextType {
  lastEvent: NotificationEvent | null;
  emit: (event: NotificationEvent) => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed' | 'disabled';
  reconnect: () => void;
}

const EventBusContext = createContext<EventBusContextType | null>(null);

export function EventBusProvider({ children }: { children: React.ReactNode }) {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed' | 'disabled'>('disconnected');

  const currentUserId = useRef<string | number | null>(null);
  const currentCompanyId = useRef<string | number | null>(null);
  const publicBound = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const channelsRef = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);

  const emit = useCallback((event: NotificationEvent) => {
    setLastEvent(event);

    window.dispatchEvent(
      new CustomEvent('huntr:notification_received', {
        detail: event,
      })
    );
  }, []);

  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested');
    retryCount.current = 0;
    publicBound.current = false;
    currentUserId.current = null;
    currentCompanyId.current = null;
    channelsRef.current.clear();
    
    resetConnection();
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      bindPrivate();
    }, 100);
  }, []);

  /**
   * PUBLIC CHANNEL
   */
  const bindPublic = useCallback((echo: any) => {
    if (!echo || publicBound.current) return;

    try {
      console.log('Binding to public channel...');
      
      const channel = echo.channel('test-channel');

      if (channel && typeof channel.listen === 'function') {
        channel.listen('.communication.websocket.broadcast', (payload: any) => {
          console.log('Public channel message received:', payload);
          emit({
            type: payload?.data?.type || 'unknown',
            data: payload,
          });
        });

        channelsRef.current.add('test-channel');
        publicBound.current = true;
        console.log('Public channel bound successfully');
      } else {
        console.warn('Public channel or listen method not available');
        throw new Error('Invalid channel object');
      }
    } catch (err) {
      console.error('Public bind failed:', err);
      publicBound.current = false;
      throw err;
    }
  }, [emit]);

  /**
   * SAFE CHANNEL OPERATIONS
   */
  const safeChannelOperation = useCallback((operation: () => void, description: string) => {
    try {
      operation();
    } catch (err) {
      console.error(`${description} failed:`, err);
      
      // If we get pusher.subscribe errors, try to reinitialize
      if (err instanceof TypeError && err.message.includes('subscribe')) {
        console.warn('Channel subscription error detected, attempting reconnect...');
        reconnect();
      }
      
      throw err;
    }
  }, [reconnect]);

  /**
   * FALLBACK MECHANISM - when WebSocket is not available
   */
  const enablePollingFallback = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('🔄 WebSocket unavailable, notifications will use regular API polling');
    }
    
    // Simple polling fallback for critical notifications
    const pollInterval = setInterval(async () => {
      try {
        const user = SessionManager.getUser();
        const company = SessionManager.getCompany();
        if (!user?.id || !company?.id) return;
        
        // Check for new notifications via API (this already happens in _app.tsx)
        // We don't need to duplicate the polling here, just ensure the user knows
        // the app is still working without WebSocket
        
      } catch (error) {
        // Silent failure for polling
      }
    }, 60000); // Poll every 60 seconds (less frequent)

    return () => clearInterval(pollInterval);
  }, []);

  /**
   * PRIVATE CHANNELS - Much more conservative approach
   */
  const bindPrivate = useCallback(() => {
    if (retryCount.current >= maxRetries) {
      if (import.meta.env.DEV) {
        console.log('💡 WebSocket connection attempts exhausted - app works normally without real-time updates');
      }
      setConnectionStatus('disabled');
      
      // Enable polling fallback when WebSocket fails completely
      const cleanup = enablePollingFallback();
      
      return cleanup;
    }

    setConnectionStatus('connecting');
    
    const echo = ensureEcho();
    if (!echo) {
      // Don't spam logs or retry aggressively
      setConnectionStatus('failed');
      
      // Only retry if we haven't hit max retries
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        
        // Use a fixed delay instead of exponential backoff
        setTimeout(() => {
          bindPrivate();
        }, 5000); // Fixed 5 second delay
      } else {
        // Enter graceful failure mode
        setConnectionStatus('disabled');
        enablePollingFallback();
      }
      return;
    }

    // Reset retry count on successful echo instance
    retryCount.current = 0;
    
    // Check actual connection state from echo
    const echoConnectionState = getConnectionState();
    if (echoConnectionState === 'failed') {
      console.warn('Echo connection is in failed state');
      setConnectionStatus('failed');
      return;
    }
    
    setConnectionStatus('connected');

    const user = SessionManager.getUser();
    const company = SessionManager.getCompany();

    const userId = user?.id ?? null;
    const companyId = company?.id ?? null;

    // Bind public channel first
    safeChannelOperation(() => {
      bindPublic(echo);
    }, 'Public channel binding');

    // USER CHANNEL
    if (userId !== currentUserId.current) {
      // Leave previous user channel
      if (currentUserId.current) {
        safeChannelOperation(() => {
          const oldChannelName = `App.Models.User.${currentUserId.current}`;
          echo.leave(oldChannelName);
          channelsRef.current.delete(oldChannelName);
          console.log(`Left previous user channel: ${oldChannelName}`);
        }, 'Leave previous user channel');
      }

      // Join new user channel
      if (userId) {
        safeChannelOperation(() => {
          const channelName = `App.Domain.Auth.Models.User.${userId}`;
          console.log(`Joining user channel: ${channelName}`);
          
          const privateChannel = echo.private(channelName);
          
          if (privateChannel && typeof privateChannel.listen === 'function') {
            privateChannel.listen(
              '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
              (data: any) => {
                console.log('User notification received:', data);
                emit({
                  type: data?.data?.type || data?.type || 'unknown',
                  data,
                });
              }
            );
            
            channelsRef.current.add(channelName);
            console.log(`User channel joined successfully: ${channelName}`);
          } else {
            throw new Error('User private channel not properly initialized');
          }
        }, 'User channel binding');
      }

      currentUserId.current = userId;
    }

    // COMPANY CHANNEL
    if (companyId !== currentCompanyId.current) {
      // Leave previous company channel
      if (currentCompanyId.current) {
        safeChannelOperation(() => {
          const oldChannelName = `App.Domain.Company.Models.Company.${currentCompanyId.current}`;
          echo.leave(oldChannelName);
          channelsRef.current.delete(oldChannelName);
          console.log(`Left previous company channel: ${oldChannelName}`);
        }, 'Leave previous company channel');
      }

      // Join new company channel
      if (companyId) {
        safeChannelOperation(() => {
          const channelName = `App.Domain.Company.Models.Company.${companyId}`;
          console.log(`Joining company channel: ${channelName}`);
          
          const companyChannel = echo.private(channelName);
          
          if (companyChannel && typeof companyChannel.listen === 'function') {
            companyChannel.listen(
              '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
              (data: any) => {
                console.log('Company notification received:', data);
                emit({
                  type: data?.data?.type || data?.type || 'unknown',
                  data,
                });
              }
            );
            
            channelsRef.current.add(channelName);
            console.log(`Company channel joined successfully: ${channelName}`);
          } else {
            throw new Error('Company private channel not properly initialized');
          }
        }, 'Company channel binding');
      }

      currentCompanyId.current = companyId;
    }

    console.log(`EventBus initialized. Active channels: ${Array.from(channelsRef.current).join(', ')}`);
    
  }, [bindPublic, emit, safeChannelOperation]);

  /**
   * CONNECTION STATUS MONITORING
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const echoState = getConnectionState();
      if (echoState !== connectionStatus) {
        setConnectionStatus(echoState as any);
        
        if (echoState === 'disconnected' || echoState === 'failed') {
          // Reset channel state
          publicBound.current = false;
          currentUserId.current = null;
          currentCompanyId.current = null;
          channelsRef.current.clear();
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [connectionStatus]);

  /**
   * INITIALIZATION
   */
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    try {
      bindPrivate();
    } catch (e) {
      console.error('Failed to initialize private channels:', e);
      setConnectionStatus('failed');
    }

    const unsubscribe = SessionManager.subscribe(() => {
      const token = SessionManager.getToken();

      if (!token) {
        console.log('No token available, disconnecting echo...');
        
        const e = getEcho();
        if (e) {
          try {
            // Leave all channels
            channelsRef.current.forEach(channelName => {
              try {
                e.leave(channelName);
              } catch (err) {
                console.warn(`Failed to leave channel ${channelName}:`, err);
              }
            });
            
            e.disconnect();
          } catch (err) {
            console.warn('Failed to disconnect echo:', err);
          }
        }

        currentUserId.current = null;
        currentCompanyId.current = null;
        publicBound.current = false;
        channelsRef.current.clear();
        setConnectionStatus('disconnected');

        return;
      }

      try {
        console.log('Session changed, reinitializing channels...');
        ensureEcho();
        bindPrivate();
      } catch (err) {
        console.error('Failed to reinitialize channels on session change:', err);
        setConnectionStatus('failed');
      }
    });

    return unsubscribe;
  }, [bindPrivate]);

  return (
    <EventBusContext.Provider value={{ lastEvent, emit, connectionStatus, reconnect }}>
      {children}
    </EventBusContext.Provider>
  );
}

export function useEventBus() {
  const ctx = useContext(EventBusContext);
  if (!ctx) throw new Error('useEventBus must be inside provider');
  return ctx;
}

/**
 * 🔥 FIX ERROR BUILD: INI WAJIB ADA
 */
export function useEventBusListener(
  types: string[],
  handler: (event: NotificationEvent) => void
) {
  const { lastEvent } = useEventBus();
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!lastEvent) return;

    const id = lastEvent.data?.id;

    if (types.includes(lastEvent.type) && id !== lastId.current) {
      lastId.current = id;
      handler(lastEvent);
    }
  }, [lastEvent, types, handler]);
}
