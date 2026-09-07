import type { ButtonHTMLAttributes } from "react";
import styles from "./ui.module.css";

export type ButtonTone = "default" | "primary" | "ghost" | "outline" | "error";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ButtonSize;
}

/**
 * Shared button primitive for client actions. It keeps daisyUI semantics and
 * native button behavior while making the common visual variants discoverable.
 */
export default function ActionButton({
  children,
  className,
  tone = "default",
  size,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={[styles.action, styles[tone], size ? styles[size] : "", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
