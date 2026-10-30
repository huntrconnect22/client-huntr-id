import { Button as HuntrButton } from "~/shared/ui/Button";
import React, { useState, useEffect, useRef } from 'react';
import { useEventBus } from '../lib/EventBus';
import { getConnectionState } from '../lib/echo';

export default function WebSocketDebug() {
  const { connectionStatus, reconnect } = useEventBus();
  const echoState = getConnectionState();
  const [isExpanded, setIsExpanded] = useState(false);
  const debugPanelRef = useRef<HTMLDivElement>(null);

  // Click outside to close functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && debugPanelRef.current && !debugPanelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isExpanded]);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'disabled': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusMessage = () => {
    if (connectionStatus === 'failed' || echoState === 'failed') {
      return (
        <div className="text-xs text-red-600 mt-1">
          <div>❌ WebSocket server unavailable</div>
          <div className="text-gray-500">
            Start Reverb server: <code className="bg-gray-100 px-1 rounded">php artisan reverb:start --host=0.0.0.0 --port=8080</code>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      ref={debugPanelRef}
      className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg border z-50 max-w-xs"
    >
      <div 
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`}></div>
          <div className="text-xs">
            <div className={`font-medium ${getStatusColor(connectionStatus)}`}>
              WS: {connectionStatus}
            </div>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '−' : '+'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 text-xs border-t">
          <div className="mb-2">
            <div className="text-gray-500">Echo State: <span className={getStatusColor(echoState)}>{echoState}</span></div>
            <div className="text-gray-500">Config: Reverb @ localhost:8080</div>
          </div>
          
          {getStatusMessage()}
          
          <div className="flex gap-2 mt-2">
            {(connectionStatus === 'failed' || connectionStatus === 'disconnected') && (
              <HuntrButton
                onClick={(e) => {
                  e.stopPropagation();
                  reconnect();
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Reconnect
              </HuntrButton>
            )}
            <HuntrButton
              onClick={(e) => {
                e.stopPropagation();
                console.log('WebSocket Debug Info:', {
                  connectionStatus,
                  echoState,
                  env: import.meta.env
                });
              }}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Log Info
            </HuntrButton>
          </div>
        </div>
      )}
    </div>
  );
}
