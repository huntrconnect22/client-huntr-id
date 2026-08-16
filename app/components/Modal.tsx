import React, { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: string | number;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  preventBackdropClose?: boolean;
}

/**
 * Universal Modal Component with click-anywhere-to-close functionality
 * 
 * Features:
 * - Click outside to close (can be disabled with preventBackdropClose)
 * - Press Escape to close
 * - Prevents body scroll when open
 * - Accessible focus management
 * - Customizable styling
 * 
 * Usage:
 * <Modal isOpen={showModal} onClose={closeModal} title="Modal Title">
 *   <p>Modal content here</p>
 * </Modal>
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  maxWidth = 600,
  showCloseButton = true,
  className = '',
  contentClassName = '',
  preventBackdropClose = false
}: ModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Enhanced modal functionality
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus the modal content for accessibility
    if (modalContentRef.current) {
      modalContentRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!preventBackdropClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      className={`huntr-modal-backdrop ${className}`}
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.8)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 1100, 
        padding: 20,
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <div 
        ref={modalContentRef}
        className={`huntr-modal-content ${contentClassName}`}
        style={{ 
          background: "var(--ui-bg-card)", 
          border: "1px solid var(--ui-border)", 
          borderRadius: 32, 
          width: "100%", 
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          maxHeight: "90vh", 
          overflow: "hidden", 
          display: "flex", 
          flexDirection: "column", 
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          animation: "modalSlideIn 0.3s ease-out",
          outline: "none"
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div style={{ 
            padding: "24px 32px", 
            borderBottom: "1px solid var(--ui-border)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            {title && (
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--ui-text-primary)" }}>
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ui-text-muted)", fontWeight: 600 }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {showCloseButton && (
              <button 
                onClick={onClose} 
                aria-label="Close modal"
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "var(--ui-text-muted)", 
                  cursor: "pointer",
                  padding: 8,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: "auto",
          padding: (title || showCloseButton) ? 0 : "24px 32px"
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
          from { 
            opacity: 0; 
            transform: translateY(-20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        .huntr-modal-backdrop {
          backdrop-filter: none !important;
        }
        
        .huntr-modal-content:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}