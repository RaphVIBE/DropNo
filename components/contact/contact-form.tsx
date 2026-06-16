"use client";

import { useState } from "react";

export type ContactFormCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  reasonLabel: string;
  reasons: { value: string; label: string }[];
  nameLabel: string;
  emailLabel: string;
  subjectLabel: string;
  messageLabel: string;
  submit: string;
  submitting: string;
  success: string;
  privacyNote: string; // contient le lien, rendu sous le bouton
  privacyHref: string;
  privacyLinkText: string;
  errors: {
    invalid_name: string;
    invalid_email: string;
    invalid_subject: string;
    invalid_message: string;
    invalid_reason: string;
    rate_limited: string;
    generic: string;
  };
};

const FIELD =
  "w-full rounded-sm border border-input bg-card px-4 py-3 text-base outline-none transition-colors focus:border-champagne-deep focus:ring-2 focus:ring-ring";
const LABEL =
  "mb-2 block text-xs font-medium uppercase tracking-wider text-ink-2";

/**
 * Formulaire de contact. Poste en JSON vers /api/contact (validation +
 * honeypot + rate limit côté serveur). Honeypot `website` masqué visuellement
 * et aux lecteurs d'écran. États idle / sending / done / error.
 */
export function ContactForm({ copy }: { copy: ContactFormCopy }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("done");
        return;
      }
      const payload = await res.json().catch(() => ({}));
      const key = payload.error as keyof ContactFormCopy["errors"];
      setErrorMsg(copy.errors[key] ?? copy.errors.generic);
      setStatus("error");
    } catch {
      setErrorMsg(copy.errors.generic);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p
        role="status"
        className="font-display text-[clamp(1.75rem,3vw,2.5rem)] italic leading-tight text-ink"
      >
        {copy.success}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <span className="eyebrow">{copy.eyebrow}</span>
      <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] italic leading-tight">
        {copy.title}
      </h2>
      <p className="max-w-prose text-ink-2">{copy.intro}</p>

      {/* Honeypot : invisible, hors tabulation, masqué aux AT. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="contact-reason" className={LABEL}>
          {copy.reasonLabel}
        </label>
        <select id="contact-reason" name="reason" required defaultValue="" className={FIELD}>
          <option value="" disabled>
            —
          </option>
          {copy.reasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={LABEL}>
            {copy.nameLabel}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={LABEL}>
            {copy.emailLabel}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={LABEL}>
          {copy.subjectLabel}
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          minLength={3}
          maxLength={200}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={LABEL}>
          {copy.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={20}
          maxLength={3000}
          rows={6}
          className={`${FIELD} resize-y`}
        />
      </div>

      {status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        aria-busy={status === "sending"}
        className="bg-primary px-7 py-3 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {status === "sending" ? copy.submitting : copy.submit}
      </button>

      <p className="text-xs leading-relaxed text-ink-2">
        {copy.privacyNote}{" "}
        <a
          href={copy.privacyHref}
          className="rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copy.privacyLinkText}
        </a>
        .
      </p>
    </form>
  );
}
