import Link from "next/link";
import type { ComponentProps } from "react";
import styles from "./ui.module.css";

type LinkTone = "default" | "primary" | "ghost" | "outline";
type LinkSize = "xs" | "sm" | "md" | "lg";

export interface ActionLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string;
  tone?: LinkTone;
  size?: LinkSize;
}

/** Shared internal navigation action with the same variants as ActionButton. */
export default function ActionLink({
  children,
  className,
  tone = "default",
  size,
  ...props
}: ActionLinkProps) {
  return (
    <Link
      className={[styles.action, styles[tone], size ? styles[size] : "", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Link>
  );
}
