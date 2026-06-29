"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./ShareButton.module.css";

export interface ShareButtonProps {
  /** Tour id used to build /tour/:id and /embed/:id URLs. */
  tourId: string;
  /** Tour title — prefilled into social share text. */
  title?: string;
  /**
   * "floating" → a pill overlaid on the viewer (default).
   * "link"     → a bare button that inherits surrounding styles (card actions).
   */
  variant?: "floating" | "link";
}

/** Opens a share dialog (copy link, copy embed iframe, social links). */
export default function ShareButton({
  tourId,
  title,
  variant = "floating",
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "floating" ? (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setOpen(true)}
          aria-label="Share this tour"
        >
          <span aria-hidden>↗</span> Share
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)}>
          Share
        </button>
      )}
      {open && (
        <ShareDialog
          tourId={tourId}
          title={title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ShareDialog({
  tourId,
  title,
  onClose,
}: {
  tourId: string;
  title?: string;
  onClose: () => void;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Resolve the origin on the client so the snippet matches the current host.
  useEffect(() => setOrigin(window.location.origin), []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const link = `${origin}/tour/${tourId}`;
  const embedSrc = `${origin}/embed/${tourId}`;
  const iframe =
    `<iframe src="${embedSrc}" width="640" height="360" style="border:0;border-radius:8px" ` +
    `loading="lazy" allow="accelerometer; gyroscope; fullscreen; xr-spatial-tracking" ` +
    `allowfullscreen></iframe>`;

  const copy = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(
        () => setCopied((c) => (c === key ? null : c)),
        1500
      );
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }, []);

  const shareText = encodeURIComponent(title || "Check out this 360° tour");
  const shareUrl = encodeURIComponent(link);
  const socials = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      name: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    },
  ];

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share tour"
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className={styles.heading}>Share tour</h2>

        <label className={styles.label}>Link</label>
        <div className={styles.row}>
          <input
            className={styles.input}
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className={styles.copy}
            onClick={() => copy(link, "link")}
          >
            {copied === "link" ? "Copied" : "Copy"}
          </button>
        </div>

        <label className={styles.label}>Embed</label>
        <div className={styles.row}>
          <textarea
            className={styles.code}
            readOnly
            rows={3}
            value={iframe}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className={styles.copy}
            onClick={() => copy(iframe, "embed")}
          >
            {copied === "embed" ? "Copied" : "Copy"}
          </button>
        </div>
        <p className={styles.hint}>
          Paste into any site or CMS to embed an interactive viewer.
        </p>

        <label className={styles.label}>Social</label>
        <div className={styles.socials}>
          {socials.map((s) => (
            <a
              key={s.name}
              className={styles.social}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
