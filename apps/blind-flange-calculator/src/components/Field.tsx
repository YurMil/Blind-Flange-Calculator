import type {ReactNode} from 'react';

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Labeled control wrapper. Pass the same `id` to the nested input/select
 * so assistive tech associates the caption with the control.
 */
export default function Field({id, label, hint, children, className = 'space-y-2'}: FieldProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
