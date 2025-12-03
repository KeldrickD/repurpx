import clsx from "clsx";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-magenta/40 focus-visible:ring-offset-midnight";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-magenta text-white shadow-[0_0_15px_rgba(255,29,206,0.25)] hover:bg-magenta-dark hover:shadow-[0_0_20px_rgba(255,29,206,0.4)] border border-transparent",
  secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
  ghost: "bg-transparent text-silver hover:text-white hover:bg-white/5",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {icon && <span className="mr-2 inline-flex">{icon}</span>}
      {children}
    </button>
  );
}

