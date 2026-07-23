import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_10px_28px_rgba(13,122,95,0.25)] hover:bg-accent-deep active:scale-[0.98]",
  secondary:
    "bg-white text-ink border border-line hover:border-accent/35 hover:bg-mist/60 active:scale-[0.98]",
  ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-white/70",
  soft: "bg-accent-soft text-accent-deep hover:bg-accent-soft/80 active:scale-[0.98]",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-base font-semibold transition-all duration-200 disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: Variant;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-base font-semibold transition-all duration-200",
        styles[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
