import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-mono", className)}>{children}</p>;
}

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("max-w-3xl text-3xl leading-[1.05] sm:text-4xl md:text-5xl", className)}>
      {children}
    </h2>
  );
}

export function SectionLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("max-w-2xl text-base leading-relaxed text-[var(--color-secondary-text)]", className)}>
      {children}
    </p>
  );
}

export function Section({
  id,
  surface = "cream",
  className,
  children,
}: {
  id?: string;
  surface?: "cream" | "sand" | "ink";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        surface === "ink"
          ? "surface-ink bg-[var(--color-ink)] text-[var(--color-cream)]"
          : surface === "sand"
          ? "surface-sand bg-[var(--color-sand)] text-[var(--color-ink)]"
          : "surface-cream bg-[var(--color-cream)] text-[var(--color-ink)]",
        "border-t border-[var(--color-line)]",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28">{children}</div>
    </section>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6", className)}>{children}</div>
  );
}

export function MonoValue({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono tabular", className)}>{children}</span>;
}

export function ButtonLink({
  href,
  to,
  variant = "solid",
  children,
  className,
}: {
  href?: string;
  to?: string;
  variant?: "solid" | "outline" | "lime";
  children: ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors";
  const variants = {
    solid: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
    lime: "bg-[var(--color-lime)] text-[var(--color-ink)] hover:opacity-85",
    outline: "border border-[var(--color-line-strong)] text-current hover:bg-[var(--color-surface-subtle)]",
  } as const;

  const cls = cn(base, variants[variant], className);

  if (to) {
    return <Link to={to} className={cls}>{children}</Link>;
  }

  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}
