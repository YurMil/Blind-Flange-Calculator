import {useEffect, useMemo, useState} from 'react';
import type {InputHTMLAttributes} from 'react';

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'onKeyDown'
> & {
  value: number | undefined;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  format?: (value: number) => string;
  normalize?: (value: number) => number;
};

const defaultFormat = (value: number) => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
};

const parseDraft = (draft: string) => {
  const normalized = draft.trim().replace(',', '.');
  if (!normalized || normalized === '-' || normalized === '.' || normalized === '-.') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function CommittedNumberInput({
  value,
  onCommit,
  min,
  max,
  format = defaultFormat,
  normalize,
  inputMode = 'decimal',
  ...props
}: Props) {
  const committedText = useMemo(() => (value === undefined ? '' : format(value)), [format, value]);
  const [draft, setDraft] = useState(committedText);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(committedText);
    }
  }, [committedText, isEditing]);

  const revert = () => {
    setDraft(committedText);
    setIsEditing(false);
  };

  const commit = () => {
    const parsed = parseDraft(draft);
    if (parsed === null) {
      revert();
      return;
    }

    const clamped = Math.min(Math.max(parsed, min ?? -Infinity), max ?? Infinity);
    const nextValue = normalize ? normalize(clamped) : clamped;
    setDraft(format(nextValue));
    setIsEditing(false);

    if (value === undefined || nextValue !== value) {
      onCommit(nextValue);
    }
  };

  return (
    <input
      {...props}
      type="text"
      inputMode={inputMode}
      value={draft}
      onFocus={() => setIsEditing(true)}
      onChange={(event) => {
        setIsEditing(true);
        setDraft(event.target.value);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          revert();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
