import type { ReactNode } from "react";
import styles from "./ui.module.css";

type NoticeTone = "info" | "success" | "warning" | "error";

export interface StatusNoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
}

/** Accessible inline feedback for loading, success, warning, and error states. */
export default function StatusNotice({
  tone = "info",
  title,
  children,
}: StatusNoticeProps) {
  return (
    <div role="alert" className={`${styles.notice} ${styles[tone]}`}>
      <div>
        {title && <h2 className={styles.noticeTitle}>{title}</h2>}
        <div>{children}</div>
      </div>
    </div>
  );
}
