import React from "react";

export interface LoadingStateProps {
  title?: string;
  description?: string;
  minHeight?: number | string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Carregando informações...",
  description = "Aguarde enquanto os dados são recuperados da base local.",
  minHeight = 220,
  className = "",
}) => {
  return (
    <div
      className={`state-container ${className}`}
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <div className="state-icon-wrapper state-icon-wrapper--loading">
        <svg
          className="spinner-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
      <h4 className="state-title">{title}</h4>
      {description && <p className="state-description">{description}</p>}
    </div>
  );
};