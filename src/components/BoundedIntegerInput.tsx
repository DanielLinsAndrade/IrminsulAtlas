import React, { useId, useState, useRef } from 'react';

export interface BoundedIntegerInputProps {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  min: number;
  max: number;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  optional?: boolean;
  presets?: readonly number[] | number[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
  ariaLabel?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md';
}

/**
 * Normaliza uma sequência de dígitos removendo zeros à esquerda redundantes.
 * Ex: "020" -> "20", "00" -> "0", "0" -> "0", "" -> ""
 */
function normalizeLeadingZeros(raw: string, min: number): string {
  if (raw === '') return '';
  // Se for apenas zeros
  if (/^0+$/.test(raw)) {
    return min <= 0 ? '0' : '';
  }
  // Remove zeros à esquerda
  return raw.replace(/^0+/, '');
}

export const BoundedIntegerInput: React.FC<BoundedIntegerInputProps> = ({
  id,
  label,
  helperText,
  error: externalError,
  min,
  max,
  value,
  onChange,
  optional = false,
  presets,
  disabled = false,
  placeholder,
  className = '',
  style,
  inputStyle,
  prefixElement,
  suffixElement,
  ariaLabel,
  autoFocus = false,
  onBlur,
  onKeyDown,
  size = 'md',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  // Estado rascunho de texto para permitir edição fluida (ex.: apagar temporariamente)
  const [draft, setDraft] = useState<string>(() => {
    if (value === null || value === undefined) return '';
    return String(value);
  });

  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [prevValue, setPrevValue] = useState<number | null | undefined>(value);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincroniza estado rascunho com o valor da prop quando ele for alterado externamente
  if (value !== prevValue) {
    setPrevValue(value);
    if (!isFocused) {
      if (value === null || value === undefined) {
        setDraft('');
        setLocalError(null);
      } else {
        setDraft(String(value));
        setLocalError(null);
      }
    }
  }

  const maxDigits = Math.max(String(max).length + 2, 12);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Filtra exclusivamente caracteres numéricos
    raw = raw.replace(/[^\d]/g, '');

    // Protege contra overflow e números gigantescos
    if (raw.length > maxDigits) {
      raw = raw.slice(0, maxDigits);
    }

    // Normaliza zeros à esquerda para evitar comportamento "0" + "20" = "020"
    const normalized = normalizeLeadingZeros(raw, min);
    setDraft(normalized);

    if (normalized === '') {
      if (optional) {
        setLocalError(null);
        onChange(null);
      } else {
        // Enquanto o usuário está no meio da digitação, permitimos o campo vazio
        // mas NÃO propagamos valor inválido / NaN para o estado de cálculo do formulário
        setLocalError(`Valor obrigatório (entre ${min} e ${max})`);
      }
      return;
    }

    const parsed = Number(normalized);
    if (!Number.isSafeInteger(parsed)) {
      setLocalError(`Número excede o limite seguro`);
      return;
    }

    if (parsed < min || parsed > max) {
      setLocalError(`Valor deve estar entre ${min} e ${max}`);
      // Não propaga valor transitório fora dos limites para o pai
      return;
    }

    // Valor válido dentro dos limites
    setLocalError(null);
    onChange(parsed);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text') || '';
    let raw = pasted.replace(/[^\d]/g, '');
    if (raw.length > maxDigits) {
      raw = raw.slice(0, maxDigits);
    }
    const normalized = normalizeLeadingZeros(raw, min);
    setDraft(normalized);

    if (normalized === '') {
      if (optional) {
        setLocalError(null);
        onChange(null);
      } else {
        setLocalError(`Valor obrigatório (entre ${min} e ${max})`);
      }
      return;
    }

    const parsed = Number(normalized);
    if (!Number.isSafeInteger(parsed)) {
      setLocalError('Número excede o limite seguro');
      return;
    }

    if (parsed < min || parsed > max) {
      setLocalError(`Valor deve estar entre ${min} e ${max}`);
      return;
    }

    setLocalError(null);
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = value != null ? value : (draft !== '' ? Number(draft) : min - 1);
      const next = Math.min(max, Number.isNaN(current) ? min : current + 1);
      setDraft(String(next));
      setLocalError(null);
      onChange(next);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = value != null ? value : (draft !== '' ? Number(draft) : min + 1);
      const next = Math.max(min, Number.isNaN(current) ? min : current - 1);
      setDraft(String(next));
      setLocalError(null);
      onChange(next);
      return;
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (draft === '') {
      if (optional) {
        setLocalError(null);
        onChange(null);
      } else {
        // Se obrigatório e vazio, define para o valor mínimo
        const fallback = min;
        setDraft(String(fallback));
        setLocalError(null);
        onChange(fallback);
      }
    } else {
      const parsed = Number(draft);
      if (Number.isNaN(parsed) || parsed < min) {
        setDraft(String(min));
        setLocalError(null);
        onChange(min);
      } else if (parsed > max) {
        setDraft(String(max));
        setLocalError(null);
        onChange(max);
      } else {
        setDraft(String(parsed));
        setLocalError(null);
        onChange(parsed);
      }
    }

    if (onBlur) {
      onBlur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handlePresetClick = (presetVal: number) => {
    if (disabled) return;
    const clamped = Math.max(min, Math.min(max, presetVal));
    setDraft(String(clamped));
    setLocalError(null);
    onChange(clamped);
    inputRef.current?.focus();
  };

  const activeError = externalError || localError;
  const isInvalid = Boolean(activeError);

  const formatPresetLabel = (preset: number): string => {
    if (min === 0 && max <= 20) {
      return `+${preset}`;
    }
    return String(preset);
  };

  return (
    <div className={`form-group ${className}`} style={style}>
      {label && (
        <label htmlFor={inputId} className="form-label" style={{ fontSize: size === 'sm' ? '11px' : undefined }}>
          {label}
        </label>
      )}

      <div className="form-input-wrapper">
        {prefixElement && <span className="form-prefix">{prefixElement}</span>}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={draft}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`form-input ${isInvalid ? 'form-input--error' : ''}`}
          style={{
            height: size === 'sm' ? '32px' : undefined,
            padding: size === 'sm' ? '4px 8px' : undefined,
            fontSize: size === 'sm' ? '12px' : undefined,
            ...inputStyle,
          }}
          aria-label={ariaLabel || label}
          aria-invalid={isInvalid}
          role="spinbutton"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
        />
        {suffixElement && <span className="form-suffix">{suffixElement}</span>}
      </div>

      {/* Presets opcionais de seleção rápida (ex.: [0, 4, 8, 12, 16, 20]) */}
      {presets && presets.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginTop: '4px',
          }}
        >
          {presets.map((preset) => {
            const isOutOfRange = preset < min || preset > max;
            const isBtnDisabled = disabled || isOutOfRange;
            const isSelected = value === preset;
            return (
              <button
                key={preset}
                type="button"
                disabled={isBtnDisabled}
                onClick={() => !isBtnDisabled && handlePresetClick(preset)}
                style={{
                  background: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#ffffff' : isOutOfRange ? 'var(--text-muted)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: isBtnDisabled ? 'not-allowed' : 'pointer',
                  opacity: isOutOfRange ? 0.4 : 1,
                  transition: 'all var(--transition-fast)',
                }}
                title={isOutOfRange ? `Fora dos limites (${min} a ${max})` : `Definir como ${preset}`}
              >
                {formatPresetLabel(preset)}
              </button>
            );
          })}
        </div>
      )}

      {activeError ? (
        <span className="form-helper-text form-helper-text--error" role="alert" style={{ fontSize: '11px' }}>
          {activeError}
        </span>
      ) : helperText ? (
        <span className="form-helper-text" style={{ fontSize: '11px' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
