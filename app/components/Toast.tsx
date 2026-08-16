import React, { useEffect, useRef } from 'react';
import { CheckCircle2, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // Auto-dismiss after duration (ms), 0 = no auto-dismiss
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  showCloseButton?: boolean;
  clickToClose?: boolean;
}

/**
 * Toast Notification Component with click-to-close functionality
 * 
 * Features:
 * - Click anywhere on toast to close (if clickToClose=true)
 * - Auto-dismiss after specified duration
 * - Different types (success, error, warning, info) with appropriate colors and icons
 * - Customizable position
 * - Smooth animations
 * 
 * Usage:
 * <Toast 
 *   message="Item berhasil ditambahkan!" 
 *   type="success" 
 *   isVisible={showToast} 
 *   onClose={closeToast}
 *   clickToClose={true}
 * />
 */
export default function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3500,
  position = 'bottom-right',
  showCloseButton = true,
  clickToClose = true
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss functionality
  useEffect(() => {
    if (!isVisible || duration <= 0) return;

    timerRef.current = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  // Icon mapping
  const iconMap = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  // Color mapping
  const colorMap = {
    success: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.2)',
      icon: '#22c55e',
      text: 'var(--ui-text-primary)'
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.2)',
      icon: '#ef4444',
      text: 'var(--ui-text-primary)'
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.2)',
      icon: '#f59e0b',
      text: 'var(--ui-text-primary)'
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.2)',
      icon: '#3b82f6',
      text: 'var(--ui-text-primary)'
    }
  };

  // Position mapping
  const positionMap = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'top-center': { top: 20, left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: 20, left: '50%', transform: 'translateX(-50%)' }
  };

  const Icon = iconMap[type];
  const colors = colorMap[type];
  const positionStyles = positionMap[position];

  const handleClick = () => {
    if (clickToClose) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        ...positionStyles,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 400,
        minWidth: 280,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        cursor: clickToClose ? 'pointer' : 'default',
        animation: isVisible ? 'toastSlideIn 0.3s ease-out' : 'toastSlideOut 0.2s ease-in',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Icon */}
      <Icon 
        size={20} 
        color={colors.icon} 
        style={{ flexShrink: 0 }} 
      />
      
      {/* Message */}
      <span 
        style={{ 
          flex: 1, 
          fontSize: 14, 
          fontWeight: 600, 
          color: colors.text, 
          lineHeight: 1.4 
        }}
      >
        {message}
      </span>
      
      {/* Close button */}
      {showCloseButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ui-text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <X size={16} />
        </button>
      )}

      <style>{`
        @keyframes toastSlideIn {
          from { 
            opacity: 0; 
            transform: translateX(100%) ${(positionStyles as any).transform || ''}; 
          }
          to { 
            opacity: 1; 
            transform: translateX(0) ${(positionStyles as any).transform || ''}; 
          }
        }
        
        @keyframes toastSlideOut {
          from { 
            opacity: 1; 
            transform: translateX(0) ${(positionStyles as any).transform || ''}; 
          }
          to { 
            opacity: 0; 
            transform: translateX(100%) ${(positionStyles as any).transform || ''}; 
          }
        }
      `}</style>
    </div>
  );
}