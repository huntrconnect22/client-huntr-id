import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

/**
 * NotificationDemo Component
 * 
 * This is a demonstration component showing the enhanced notification functionality
 * with click-anywhere-to-close feature. This can be used for testing the notification
 * behavior in development or as a reference for similar components.
 */
export default function NotificationDemo() {
  const [showNotification, setShowNotification] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: "Welcome to Huntr.id!",
      body: "Your notification system now has enhanced click-anywhere-to-close functionality.",
      read_at: null,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: "Feature Update",
      body: "Notifications now close when you click anywhere outside the box or press Escape.",
      read_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  const closeNotification = () => {
    setShowNotification(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    closeNotification();
  };

  // Close on Escape key
  React.useEffect(() => {
    if (!showNotification) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeNotification();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNotification]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Demo Trigger Button */}
      <HuntrButton
        onClick={() => setShowNotification(!showNotification)}
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'var(--ui-toggle-bg)',
          border: '1px solid var(--ui-toggle-border)',
          color: showNotification ? '#fb923c' : 'var(--ui-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        aria-label="Toggle notification demo"
      >
        <Bell size={18} fill={showNotification ? 'rgba(249,115,22,0.2)' : 'none'} />
        {notifications.filter(n => !n.read_at).length > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            background: '#f59e0b',
            border: '2px solid var(--ui-bg-card)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px'
          }}>
            {notifications.filter(n => !n.read_at).length}
          </span>
        )}
      </HuntrButton>

      {/* Notification Dropdown */}
      {showNotification && (
        <>
          {/* Backdrop overlay - click anywhere to close */}
          <div 
            className="huntr-notif-backdrop"
            onClick={handleBackdropClick}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              zIndex: 99998,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(2px)',
              cursor: 'pointer'
            }} 
            aria-label="Close notifications"
          />
          
          {/* Notification Dropdown */}
          <HuntrSurface
            className="huntr-notif-dropdown"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 380,
              maxWidth: 'calc(100vw - 20px)',
              background: 'var(--ui-bg-card)', 
              borderRadius: 20, 
              border: '1px solid var(--ui-border)', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
              zIndex: 99999, 
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--ui-border-subtle)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ui-text-primary)' }}>
                  Demo Notifications
                </span>
                <span style={{ 
                  fontSize: 10, 
                  background: 'rgba(249,115,22,0.2)', 
                  color: '#fb923c', 
                  padding: '2px 8px', 
                  borderRadius: 10, 
                  fontWeight: 700 
                }}>
                  ENHANCED
                </span>
              </div>
              <HuntrButton
                onClick={closeNotification}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--ui-text-muted)', 
                  cursor: 'pointer', 
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close notifications"
              >
                <X size={14} />
              </HuntrButton>
            </div>
            
            {/* Content */}
            <div style={{ maxHeight: 350, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className="huntr-notif-item"
                  style={{ 
                    padding: '14px 20px', 
                    borderBottom: '1px solid var(--ui-border-subtle)', 
                    cursor: 'pointer', 
                    background: n.read_at ? 'transparent' : 'rgba(249,115,22,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: n.read_at ? 'transparent' : '#f59e0b',
                      marginTop: 6,
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: 'var(--ui-text-primary)', 
                        marginBottom: 4, 
                        lineHeight: 1.4 
                      }}>
                        {n.title}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: 'var(--ui-text-secondary)', 
                        marginBottom: 6, 
                        lineHeight: 1.4 
                      }}>
                        {n.body}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ui-text-muted)' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div style={{ 
              padding: '12px 20px', 
              borderTop: '1px solid var(--ui-border-subtle)', 
              background: 'var(--ui-bg-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: 11, 
                color: 'var(--ui-text-muted)',
                fontStyle: 'italic'
              }}>
                💡 Click anywhere outside this box to close, or press Escape key
              </div>
            </div>
          </HuntrSurface>
        </>
      )}
    </div>
  );
}
