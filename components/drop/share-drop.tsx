"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Link as LinkIcon, Mail, Share2 } from "lucide-react";

/**
 * Partage d'un drop : partage natif (mobile), copie du lien, et un mailto
 * pré-rempli pour s'envoyer (ou envoyer) les détails. 100% client, rien de
 * stocké côté serveur.
 */
export function ShareDrop({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  const t = useTranslations("dropDetail");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const action =
    "inline-flex items-center gap-2 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  async function share() {
    try {
      await navigator.share({ title, text: summary, url });
    } catch {
      /* annulé par l'utilisateur */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  }

  const mailto = `mailto:?subject=${encodeURIComponent(
    title
  )}&body=${encodeURIComponent(`${summary}\n\n${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-2">
      {canShare ? (
        <button type="button" onClick={share} className={action}>
          <Share2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
          {t("shareNative")}
        </button>
      ) : null}
      <button type="button" onClick={copy} className={action}>
        {copied ? (
          <Check className="size-4 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <LinkIcon className="size-4" strokeWidth={1.5} aria-hidden="true" />
        )}
        {copied ? t("linkCopied") : t("copyLink")}
      </button>
      <a href={mailto} className={action}>
        <Mail className="size-4" strokeWidth={1.5} aria-hidden="true" />
        {t("emailDetails")}
      </a>
    </div>
  );
}
