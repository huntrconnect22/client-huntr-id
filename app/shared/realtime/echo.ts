import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { SessionManager } from '~/shared/auth/session';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

let echo: Echo<any> | null = null;
let sessionInstalled = false;
let connectionState: 'disconnected' | 'connecting' | 'connected' | 'failed' | 'disabled' = 'disconnected';
let connectionRetryCount = 0;
const maxConnectionRetries = 2; // Reduced from 5 to 2
let gracefulFailure = false; // New: track if we should stop trying

function getConfig() {
  const key = import.meta.env.VITE_REVERB_APP_KEY;
  const host = import.meta.env.VITE_REVERB_HOST;
  const port = import.meta.env.VITE_REVERB_PORT;
  const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

  if (!key || !host) return null;

  const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return {
    key,
    host,
    port: port ? parseInt(port) : 8080,
    scheme,
    authEndpoint: apiUrl ? `${apiUrl}/api/broadcasting/auth` : '/api/broadcasting/auth',
  };
}

function destroyEcho() {
  if (echo) {
    try {
      echo.disconnect();
    } catch (e) {
      // Silent cleanup
    }
    echo = null;
  }
  connectionState = 'disconnected';
}

function installSessionWatcher() {
  if (sessionInstalled) return;
  sessionInstalled = true;

  SessionManager.subscribe(() => {
    const token = SessionManager.getToken();

    if (!token) {
      destroyEcho();
      return;
    }

    // Only reconnect if we haven't failed gracefully
    if (!gracefulFailure && echo && connectionState === 'connected') {
      try {
        (echo as any).options.auth.headers.Authorization = `Bearer ${token}`;
        return;
      } catch (e) {
        destroyEcho();
      }
    }

    // Don't retry if we're in graceful failure mode
    if (!gracefulFailure) {
      ensureEcho();
    }
  });
}

export function ensureEcho(): Echo<any> | null {
  if (typeof window === 'undefined') return null;

  const config = getConfig();
  const token = SessionManager.getToken();

  if (!config || !token) {
    return null;
  }

  // Return existing connection if valid
  if (echo && connectionState === 'connected') {
    return echo;
  }

  // Prevent multiple simultaneous connection attempts
  if (connectionState === 'connecting') {
    return null;
  }

  // If we've failed gracefully, don't try again
  if (gracefulFailure || connectionRetryCount >= maxConnectionRetries) {
    if (!gracefulFailure) {
      // Only log in development
      if (import.meta.env.DEV) {
        console.log('💡 WebSocket unavailable - running in polling mode');
      }
      gracefulFailure = true;
    }
    connectionState = 'disabled';
    return null;
  }

  connectionState = 'connecting';
  connectionRetryCount++;

  try {
    // Ensure Pusher is available globally
    window.Pusher = Pusher;
    
    // Disable ALL Pusher logging in production, even warnings
    Pusher.logToConsole = false;
    
    // Disable stats collection
    if (window.Pusher && (window.Pusher as any).Runtime) {
      (window.Pusher as any).Runtime.enableStats = false;
    }

    // Always use Reverb configuration if host is provided
    const isReverb = !!config.host;

    let echoConfig: any;

    if (isReverb) {
      // Reverb configuration - very conservative for production
      echoConfig = {
        broadcaster: 'reverb',
        key: config.key,
        wsHost: config.host,
        wsPort: config.port,
        wssPort: config.port,
        forceTLS: config.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        enableStats: false,
        enableLogging: false,
        // Relative path → melewati Vite proxy → tidak ada CORS/SSL issue
        authEndpoint: config.authEndpoint,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
        // Very conservative timeouts for production
        wsTimeout: 3000, // Reduced to 3s - fail fast
        activityTimeout: 30000,
        pongTimeout: 5000, // Reduced to 5s
        // Disable all debugging
        disableStats: true,
        cluster: undefined, // Disable cluster for Reverb
      };
    } else {
      // Production Pusher configuration fallback
      echoConfig = {
        broadcaster: 'pusher',
        key: config.key,
        cluster: 'ap1',
        forceTLS: true,
        enableStats: false,
        enableLogging: false,
        // Relative path → melewati Vite proxy
        authEndpoint: config.authEndpoint,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
        activityTimeout: 30000,
        pongTimeout: 5000,
      };
    }

    echo = new Echo(echoConfig);

    // Set up connection event handlers - completely silent in production
    if (echo.connector && echo.connector.pusher) {
      const pusher = echo.connector.pusher;

      pusher.connection.bind('connected', () => {
        connectionState = 'connected';
        connectionRetryCount = 0;
        gracefulFailure = false;
      });

      pusher.connection.bind('disconnected', () => {
        connectionState = 'disconnected';
      });

      // All error handlers are completely silent
      pusher.connection.bind('error', () => {
        connectionState = 'failed';
      });

      pusher.connection.bind('unavailable', () => {
        connectionState = 'failed';
      });

      pusher.connection.bind('failed', () => {
        connectionState = 'failed';
      });

      // Add timeout for connection attempt
      setTimeout(() => {
        if (connectionState === 'connecting') {
          connectionState = 'failed';
          gracefulFailure = true;
        }
      }, 5000); // 5 second timeout
    }

    installSessionWatcher();
    
    return echo;
  } catch (e) {
    connectionState = 'failed';
    echo = null;
    
    // No retries in production if server is returning 502
    if (connectionRetryCount >= maxConnectionRetries) {
      gracefulFailure = true;
      connectionState = 'disabled';
    } else {
      // Only retry once more with a delay
      setTimeout(() => {
        connectionState = 'disconnected';
        ensureEcho();
      }, 5000); // Fixed 5 second delay
    }
    
    return null;
  }
}

// Initialize on client-side only
if (typeof window !== 'undefined') {
  installSessionWatcher();
}

export function getEcho(): Echo<any> | null {
  return echo;
}

export function getConnectionState(): string {
  return connectionState;
}

export function resetConnection(): void {
  connectionRetryCount = 0;
  connectionState = 'disconnected';
  gracefulFailure = false; // Reset graceful failure
  destroyEcho();
  ensureEcho();
}

export default echo;
