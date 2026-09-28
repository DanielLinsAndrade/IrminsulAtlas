import React, { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  prefixElement,
  suffixElement,
  id,
  className = "",
  ...rest
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isInvalid = Boolean(error);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <div className="form-input-wrapper">
        {prefixElement && <span className="form-prefix">{prefixElement}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`form-input ${isInvalid ? "form-input--error" : ""} ${className}`}
          aria-invalid={isInvalid}
          {...rest}
        />
        {suffixElement && <span className="form-suffix">{suffixElement}</span>}
      </div>
      {error ? (
        <span className="form-helper-text form-helper-text--error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className="form-helper-text">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";