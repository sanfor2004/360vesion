import type { ReactNode } from "react";
import styles from "./ui.module.css";

export interface EmptyStateProps {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}

/** A clear, accessible empty state with one optional next action. */
export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className={styles.emptyState} aria-labelledby="empty-state-title">
      <h2 id="empty-state-title" className={styles.emptyTitle}>{title}</h2>
      <div className={styles.emptyDescription}>{description}</div>
      {action && <div className={styles.emptyActions}>{action}</div>}
    </section>
  );
}
