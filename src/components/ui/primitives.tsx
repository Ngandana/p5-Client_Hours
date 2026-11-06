import type { ButtonHTMLAttributes, ReactNode } from "react";

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

// ---------- Button ----------

const BUTTON_VARIANTS = {
  default: "border-line bg-surface text-ink hover:bg-surface-2",
  primary: "border-accent bg-accent text-accent-ink hover:border-accent-hover hover:bg-accent-hover",
  ok: "border-ok bg-ok text-surface hover:brightness-110",
  bad: "border-bad text-bad hover:bg-bad-soft",
  ghost: "border-transparent bg-transparent text-ink hover:bg-surface-2",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof BUTTON_VARIANTS;
}

export function Button({ variant = "default", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-[0.9375rem] font-semibold no-underline transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink transition-colors duration-200 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-35",
        className,
      )}
      {...props}
    />
  );
}

export const Buttons = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex flex-wrap gap-2.5", className)}>{children}</div>
);

// ---------- Layout ----------

export function Card({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("grid min-w-0 content-start gap-4 rounded-card border border-line bg-surface p-5", className)} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-2">{children}</div>;
}

export function PageHead({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {children && <p className="max-w-[62ch] text-muted">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export const Grid2 = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">{children}</div>
);

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-card border border-dashed border-line px-4 py-7 text-center text-muted">{children}</div>
);

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{children}</span>
);

export const Muted = ({ children }: { children: ReactNode }) => <span className="text-sm text-muted">{children}</span>;

// ---------- Forms ----------

export function Field({
  label,
  htmlFor,
  hint,
  hintId,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  hintId?: string;
  error?: string | null;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && (
        <span id={hintId} className="text-[0.8125rem] text-muted">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-[0.8125rem] font-semibold text-bad">
          {error}
        </span>
      )}
    </div>
  );
}

export const FormError = ({ message }: { message?: string | null }) =>
  message ? (
    <span role="alert" className="text-[0.8125rem] font-semibold text-bad">
      {message}
    </span>
  ) : null;

export const Row2 = ({ children, three }: { children: ReactNode; three?: boolean }) => (
  <div className={cn("grid gap-3 min-[560px]:grid-cols-2", three && "min-[560px]:grid-cols-3")}>{children}</div>
);

/** Moves focus to a form field after an error, once the error text has rendered. */
export function focusField(id?: string) {
  if (!id) return;
  requestAnimationFrame(() => document.getElementById(id)?.focus());
}

// ---------- Table ----------

export const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-lg border border-line">
    <table className="w-full border-collapse text-sm">{children}</table>
  </div>
);

// ---------- Pill ----------

const PILL_TONES = {
  approved: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
  rejected: "bg-bad-soft text-bad",
  manual: "bg-surface-2 text-muted",
  timer: "bg-accent-soft text-accent",
} as const;

export function Pill({ tone, children }: { tone: keyof typeof PILL_TONES; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-[9px] py-0.5 text-xs font-bold whitespace-nowrap", PILL_TONES[tone])}>
      {children}
    </span>
  );
}

export const Dot = ({ color, className }: { color: string; className?: string }) => (
  <span className={cn("inline-block size-2.5 flex-none rounded-full", className)} style={{ background: color }} />
);
