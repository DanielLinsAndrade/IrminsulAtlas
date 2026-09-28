import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  minHeight?: number | string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  minHeight = 240,
  className = "",
}) => {
  return (
    <div className={`state-container ${className}`} style={{ minHeight }}>
      <div className="state-icon-wrapper state-icon-wrapper--empty">
        {icon || (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m3 9 2.45-1.84a2 2 0 0 1 2.5 0L12 10.5l4.05-3.34a2 2 0 0 1 2.5 0L21 9" />
            <path d="M12 11v6" />
          </svg>
        )}
      </div>
      <h4 className="state-title">{title}</h4>
      {description && <p className="state-description">{description}</p>}
      {actionLabel && onAction && (
        <div className="state-action">
          <Button variant="secondary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};