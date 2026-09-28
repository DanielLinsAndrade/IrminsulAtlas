import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DecorativeStar } from './DecorativeStar';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  ariaLabelledBy?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon = <DecorativeStar />,
  children,
  footer,
  maxWidth = '520px',
  ariaLabelledBy,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();
  const titleId = ariaLabelledBy ?? generatedTitleId;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const first = dialogRef.current?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]');
    first?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Bloqueia o scroll do corpo da aplicação enquanto o modal estiver ativo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Garante que o backdrop e o dialog estejam perfeitamente alinhados ao topo
    if (backdropRef.current) {
      backdropRef.current.scrollTop = 0;
    }
    if (dialogRef.current) {
      dialogRef.current.scrollTop = 0;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('.modal-backdrop[role="dialog"]');
      if (e.key === 'Escape' && dialogs[dialogs.length - 1] === backdropRef.current) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        event.stopPropagation();
        const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') ?? [])].filter(element => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" id={titleId}>
            {icon}
            <span>{title}</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>
          </button>
        </div>

        {children}

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  // Renderização através de React Portal em document.body para isolamento estrutural
  // contra transform, backdrop-filter, overflow e stacking contexts da árvore principal
  if (typeof document !== 'undefined') {
    return createPortal(modalElement, document.body);
  }

  return modalElement;
};

export const ModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div ref={bodyRef} className={`modal-body ${className}`} style={style}>
      {children}
    </div>
  );
};

export const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style }) => {
  return (
    <div className={`modal-footer ${className}`} style={style}>
      {children}
    </div>
  );
};
