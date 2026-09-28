import React, { useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  error,
  id,
  className = "",
  ...rest
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const isInvalid = Boolean(error);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`form-select ${isInvalid ? "form-select--error" : ""} ${className}`}
        aria-invalid={isInvalid}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="form-helper-text form-helper-text--error" role="alert">
          {error}
        </span>
      ) : helperText ? (
        <span className="form-helper-text">{helperText}</span>
      ) : null}
    </div>
  );
};