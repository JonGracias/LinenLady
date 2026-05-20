"use client";

// src/components/contact/ContactForm.tsx
//
// Public "Contact Noemi" form.
//
// Primary action:   POST /api/contact (server-side send via Resend → Noemi).
// Secondary action: "Open in your mail app" — once the user has typed (or had
//                   pre-filled) their email, we infer their provider and offer
//                   a one-click handoff to their actual mail client.
//
// Clerk integration: when a signed-in user lands here, we pre-fill name and
// email from their Clerk profile. They can still edit either field — the form
// is the source of truth on submit, not the Clerk session — so a user could,
// say, send from their work address while signed in with their personal one.

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { ContactError } from "@/lib/contracts/contact";
import { submitContact } from "@/lib/contact/submitContact";
import {
  getMailProvider,
  providerLabel,
  type MailProvider,
} from "@/lib/contact/mailProvider";
import { buildMailUrl, isMobileDevice } from "@/lib/contact/mailUrl";

type FormStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; submissionId: number }
  | { kind: "error"; error: ContactError };

type FieldErrors = Partial<Record<"fromName" | "fromEmail" | "body", string>>;

export type ContactFormProps = {
  /** Optional product context — pre-populates SKU + nudges the subject line. */
  productSku?:  string;
  productName?: string;
  /** Recipient address shown in the secondary affordance. */
  recipientEmail?: string;
};

const NOEMI_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "jon.gracias@gmail.com";

export default function ContactForm({
  productSku,
  productName,
  recipientEmail = NOEMI_EMAIL,
}: ContactFormProps) {
  // ── Clerk integration ──────────────────────────────────────────────────
  // useUser is fine in a "use client" component. While Clerk is loading we
  // get { isLoaded: false }; once hydrated, isSignedIn / user become reliable.
  const { isLoaded, isSignedIn, user } = useUser();

  // ── Form state ─────────────────────────────────────────────────────────
  const [fromName,  setFromName]  = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [subject,   setSubject]   = useState(
    productName ? `About: ${productName}` : ""
  );
  const [body,      setBody]      = useState("");
  const [website,   setWebsite]   = useState("");           // honeypot
  const [status,    setStatus]    = useState<FormStatus>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isMobile,  setIsMobile]  = useState(false);

  // Track whether the user has manually edited the auto-filled fields. If they
  // have, we don't overwrite their edits on subsequent Clerk re-renders (e.g.
  // user object hydrates a second time with extra fields). Without this guard,
  // a user could edit "John" → "Jonathan" and have it snap back to "John" the
  // moment Clerk resolves a richer profile object.
  const [nameEdited,  setNameEdited]  = useState(false);
  const [emailEdited, setEmailEdited] = useState(false);

  useEffect(() => { setIsMobile(isMobileDevice()); }, []);

  // Pre-fill from Clerk once loaded. Runs on every change to the Clerk user
  // object but the `*Edited` guards prevent stomping on user input.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    if (!nameEdited) {
      const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      const fallback = user.username ?? "";
      const next = composed || fallback;
      if (next) setFromName(next);
    }

    if (!emailEdited) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      if (email) setFromEmail(email);
    }
  }, [isLoaded, isSignedIn, user, nameEdited, emailEdited]);

  // ── Provider inference for the secondary affordance ────────────────────
  const provider: MailProvider = useMemo(
    () => getMailProvider(fromEmail),
    [fromEmail]
  );

  const mailtoHref = useMemo(() => buildMailUrl(provider, isMobile, {
    to:      recipientEmail,
    subject: subject || (productName ? `About: ${productName}` : "Inquiry from LinenLady"),
    body:    body
      ? `${body}\n\n— ${fromName || "(your name)"}`
      : "",
  }), [provider, isMobile, recipientEmail, subject, productName, body, fromName]);

  // ── Validation ─────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!fromName.trim())             errs.fromName  = "Please enter your name.";
    if (fromName.length > 120)        errs.fromName  = "Name is too long.";
    if (!fromEmail.trim())            errs.fromEmail = "Please enter your email.";
    else if (!isPlausibleEmail(fromEmail))
                                      errs.fromEmail = "That doesn't look like a valid email.";
    if (!body.trim())                 errs.body      = "Please write a message.";
    else if (body.length > 4000)      errs.body      = "Message is too long (4000 chars max).";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "submitting") return;
    if (!validate()) return;

    setStatus({ kind: "submitting" });
    const result = await submitContact({
      fromName:   fromName.trim(),
      fromEmail:  fromEmail.trim(),
      subject:    subject.trim() || undefined,
      body:       body.trim(),
      productSku: productSku || undefined,
      website,                                   // honeypot — server checks
    });

    if (result.ok) {
      setStatus({ kind: "success", submissionId: result.data.submissionId });
    } else {
      setStatus({ kind: "error", error: result.error });
    }
  }

  // ── Success view ───────────────────────────────────────────────────────
  if (status.kind === "success") {
    return (
      <div className="text-center py-12">
        <p className="ll-display text-2xl mb-3" style={{ color: "var(--primary)" }}>
          Thank you.
        </p>
        <p
          className="ll-body text-base font-light leading-relaxed max-w-md mx-auto"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Your message has been sent. Noemi typically responds within a day or two —
          look for a reply from <span style={{ color: "var(--on-surface)" }}>{recipientEmail}</span>.
        </p>
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────
  const submitting = status.kind === "submitting";
  const topError   = status.kind === "error" ? status.error : null;

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-xl mx-auto">
      {/* Subtle "signed in as" hint — purely informational. The form still
          submits whatever's in the inputs; the Clerk identity is not implicit. */}
      {isLoaded && isSignedIn && !nameEdited && !emailEdited && (
        <p
          className="ll-label text-[0.6rem] uppercase tracking-[0.12em] mb-4 text-center"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Signed in — your name &amp; email are filled in below
        </p>
      )}

      {topError && <ErrorBanner error={topError} />}

      {/* Honeypot — invisible to humans, visible to most bots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10000px",
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label htmlFor="ll-website">Website (leave empty)</label>
        <input
          id="ll-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field
          id="ll-name"
          label="Your name"
          value={fromName}
          onChange={(v) => { setFromName(v); setNameEdited(true); }}
          error={fieldErrors.fromName}
          autoComplete="name"
          maxLength={120}
        />
        <Field
          id="ll-email"
          label="Email"
          type="email"
          value={fromEmail}
          onChange={(v) => { setFromEmail(v); setEmailEdited(true); }}
          error={fieldErrors.fromEmail}
          autoComplete="email"
          maxLength={254}
        />
      </div>

      <div className="mb-4">
        <Field
          id="ll-subject"
          label="Subject"
          hint="Optional"
          value={subject}
          onChange={setSubject}
          maxLength={200}
        />
      </div>

      <div className="mb-2">
        <FieldLabel htmlFor="ll-body" hint={`${body.length} / 4000`}>
          Message
        </FieldLabel>
        <textarea
          id="ll-body"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
          aria-invalid={!!fieldErrors.body}
          aria-describedby={fieldErrors.body ? "ll-body-error" : undefined}
          className="input-minimal w-full resize-y leading-relaxed"
          placeholder={
            productName
              ? `Tell Noemi what you'd like to know about the ${productName}…`
              : "What would you like to ask?"
          }
        />
        {fieldErrors.body && (
          <p id="ll-body-error" className="ll-label text-[0.65rem] mt-1" style={{ color: "var(--primary)" }}>
            {fieldErrors.body}
          </p>
        )}
      </div>

      {productSku && (
        <p className="ll-label text-[0.6rem] uppercase tracking-[0.12em] mb-4"
           style={{ color: "var(--on-surface-variant)" }}>
          About item: <span style={{ color: "var(--on-surface)" }}>{productSku}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ minWidth: "12rem", justifyContent: "center" }}
        >
          {submitting ? "Sending…" : "Send to Noemi →"}
        </button>

        {fromEmail && isPlausibleEmail(fromEmail) && (
          <a
            href={mailtoHref}
            className="ll-label text-[0.65rem] uppercase tracking-[0.12em] underline transition-opacity hover:opacity-60"
            style={{ color: "var(--on-surface-variant)" }}
            target={provider === "default" || provider === "icloud" || provider === "proton" ? undefined : "_blank"}
            rel="noopener noreferrer"
          >
            Or open in {providerLabel(provider)} ↗
          </a>
        )}
      </div>

      <p className="ll-body text-xs italic mt-6" style={{ color: "var(--outline)" }}>
        Your email is used only to reply to your message. We never share it.
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function Field(props: {
  id:        string;
  label:     string;
  value:     string;
  onChange:  (v: string) => void;
  error?:    string;
  hint?:     string;
  type?:     string;
  autoComplete?: string;
  maxLength?:    number;
}) {
  const {
    id, label, value, onChange, error, hint, type = "text",
    autoComplete, maxLength,
  } = props;
  return (
    <div>
      <FieldLabel htmlFor={id} hint={hint}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="input-minimal w-full"
      />
      {error && (
        <p id={`${id}-error`} className="ll-label text-[0.65rem] mt-1" style={{ color: "var(--primary)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function FieldLabel(props: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label
        htmlFor={props.htmlFor}
        className="ll-label text-[0.62rem] uppercase tracking-[0.12em]"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {props.children}
      </label>
      {props.hint && (
        <span
          className="ll-label text-[0.58rem]"
          style={{ color: "var(--outline)" }}
        >
          {props.hint}
        </span>
      )}
    </div>
  );
}

function ErrorBanner({ error }: { error: ContactError }) {
  const headline =
      error.kind === "rate_limited"  ? "You're sending a lot of messages."
    : error.kind === "validation"    ? "Please check your message."
    : error.kind === "provider_down" ? "We couldn't send your message just now."
    : "Something went wrong.";

  return (
    <div
      role="alert"
      className="mb-5 p-4 rounded-md"
      style={{
        background:  "var(--primary-container)",
        color:       "var(--on-primary-container)",
        border:      "1px solid rgba(128, 78, 79, 0.2)",
      }}
    >
      <p className="ll-label text-[0.7rem] uppercase tracking-[0.12em] mb-1">
        {headline}
      </p>
      <p className="ll-body text-sm font-light leading-relaxed">
        {error.message}
      </p>
    </div>
  );
}

function isPlausibleEmail(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}