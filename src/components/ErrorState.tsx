import React from "react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  error?: string | Error;
  onRetry?: () => void;
  retryLabel?: string;
  minHeight?: number | string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Ocorreu um erro inesperado",
  error,
  onRetry,
  retryLabel = "Tentar novamente",
  minHeight = 240,
  className = "",
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={`state-container ${className}`} style={{ minHeight }} role="alert">
      <div className="state-icon-wrapper state-icon-wrapper--error">
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
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h4 className="state-title">{title}</h4>
      {errorMessage && (
        <p className="state-description text-danger font-mono" style={{ fontSize: "12px" }}>
          {errorMessage}
        </p>
      )}
      {onRetry && (
        <div className="state-action">
          <Button variant="danger" size="md" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};