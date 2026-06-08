import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-[#ff6b9d] hover:bg-[#ff5289] text-white shadow-sm shadow-[#ff6b9d]/30",
  secondary:
    "bg-white hover:bg-[#fff0f6] text-[#4a4a6a] border border-[#ffd6e8] hover:border-[#ffb3cc]",
  ghost:
    "bg-transparent hover:bg-[#ff6b9d]/10 text-[#4a4a6a] hover:text-[#ff6b9d]",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
