import { X } from 'lucide-react';
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { BADGE_TONE } from '../lib/constants';
import { classNames } from '../lib/format';

const buttonStyles = {
  primary:
    'bg-forest text-lime hover:bg-ink shadow-[0_10px_24px_-12px_rgba(22,53,40,0.7)]',
  ghost: 'bg-white/70 text-forest hover:bg-white border border-forest/10',
  outline: 'bg-transparent text-forest border border-forest/20 hover:bg-white',
  danger: 'bg-rose text-white hover:bg-rose/90',
  lime: 'bg-lime text-ink hover:bg-lime/90',
};

export function Button({
  children,
  variant = 'primary',
  className,
  type = 'button',
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss motion-reduce:active:scale-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-mist disabled:text-ink/45 disabled:border-transparent disabled:shadow-none disabled:active:scale-100',
        buttonStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}

const tones = {
  ok: 'bg-moss/12 text-moss',
  warn: 'bg-clay/12 text-clay',
  danger: 'bg-rose/10 text-rose',
  info: 'bg-leaf/12 text-leaf',
  muted: 'bg-ink/8 text-ink/70',
};

export function Badge({ value, map, className }) {
  const tone = tones[BADGE_TONE[value] || 'muted'] || tones.muted;
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        tone,
        className
      )}
    >
      {map?.[value] || value || '—'}
    </span>
  );
}

export function Card({ children, className }) {
  return (
    <div
      className={classNames(
        'rounded-3xl border border-forest/8 bg-paper/90 p-5 shadow-[0_16px_40px_-28px_rgba(16,35,26,0.45)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-moss uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-ink/65">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({ label, hint, error, required, children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-medium tracking-wide text-ink/60 uppercase"
      >
        {label}
        {required ? (
          <span className="text-rose" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="text-xs text-ink/50">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  'w-full rounded-2xl border border-forest/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-moss/40 focus:ring-4 focus:ring-lime/40 aria-[invalid=true]:border-rose/50 disabled:cursor-not-allowed disabled:bg-mist/60 disabled:text-ink/50';

export function Input(props) {
  return <input className={controlClass} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={controlClass} {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={`${controlClass} min-h-28 resize-y`} {...props} />;
}

export function Spinner({ label = 'Đang tải…', className }) {
  return (
    <div
      role="status"
      className={classNames('flex items-center justify-center py-16', className)}
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-forest/15 border-t-moss"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-forest/15 bg-white/40 px-6 py-14 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {description ? <p className="mt-2 text-sm text-ink/60">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorBox({ error, onRetry, className }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={classNames(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose/20 bg-rose/8 px-4 py-3 text-sm text-rose',
        className
      )}
    >
      <span>{error.message || 'Đã xảy ra lỗi'}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-full border border-rose/30 px-4 text-xs font-medium text-rose transition hover:bg-rose/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose"
        >
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function Table({ columns, rows, rowKey, compact, label }) {
  return (
    <div className="overflow-x-auto">
      <table
        aria-label={label}
        className={classNames('w-full text-left text-sm', compact ? '' : 'min-w-[640px]')}
      >
        <thead>
          <tr className="border-b border-forest/10 text-xs tracking-wide text-ink/50 uppercase">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={classNames('px-3 py-3 font-medium', col.className)}
              >
                {col.header ? (
                  col.header
                ) : (
                  <span className="sr-only">{col.ariaLabel || 'Thao tác'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-forest/6 last:border-0 hover:bg-mist/50">
              {columns.map((col) => (
                <td key={col.key} className={classNames('px-3 py-3 align-middle', col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, title, onClose, children, wide }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previousActive = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panelRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActive instanceof HTMLElement) previousActive.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={classNames(
          'animate-modal-in relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-paper p-5 shadow-2xl outline-none',
          wide ? 'max-w-4xl' : 'max-w-lg'
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="rounded-full p-2 text-ink/50 transition hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <Card className="min-w-0">
      <p className="text-xs font-medium tracking-[0.16em] text-moss uppercase">{label}</p>
      <p className="font-display mt-3 text-3xl tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink/55">{hint}</p> : null}
    </Card>
  );
}

export function FilterSelect({ value, onChange, options, allLabel = 'Tất cả', label = 'Bộ lọc' }) {
  return (
    <Select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={classNames('animate-pulse rounded-2xl bg-forest/8', className)} />;
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <Card>
      <div role="status" className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-3">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton key={colIndex} className={colIndex === 0 ? 'h-4 flex-[2]' : 'h-4 flex-1'} />
            ))}
          </div>
        ))}
        <span className="sr-only">Đang tải dữ liệu…</span>
      </div>
    </Card>
  );
}

export function DataState({
  loading,
  error,
  isEmpty,
  onRetry,
  skeleton,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}) {
  if (loading) return skeleton || <Spinner />;
  if (error) return <ErrorBox error={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  return children;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      {description ? <p className="text-sm text-ink/70">{description}</p> : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function ImageUpload({ value, onChange, onRemove, accept = "image/*", label = "Upload ảnh" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    // If value is a URL (from backend), show it
    // If value is a File object, create local preview
    if (!value) {
      setPreview(null);
      setFile(null);
      return;
    }

    if (value instanceof File) {
      setFile(value);
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    // It's a URL string
    setPreview(value);
    setFile(null);
  }, [value]);

  function handleFile(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    onChange?.(selectedFile); // Return File object, not URL

    if (inputRef.current) inputRef.current.value = '';
  }

  function handleRemove() {
    setPreview(null);
    setFile(null);
    onChange?.(null);
    onRemove?.();
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
        aria-label={label}
      />
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-2xl border border-forest/10"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 rounded-full bg-rose text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Xoá ảnh"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-48 rounded-2xl border-2 border-dashed border-forest/20 bg-forest/5 hover:bg-forest/10 hover:border-forest/40 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-8 h-8 text-forest/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-forest/60 font-medium">{label}</span>
        </button>
      )}
    </div>
  );
}
