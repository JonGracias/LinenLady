/* ─────────────────────────────────────────────────────────────
   launch-blast.mjs — one-shot "we're open" email to every signup
   ─────────────────────────────────────────────────────────────
   Run ONCE on July 4. Pulls every Clerk user (each notify-signup is a
   Clerk user, so this is your early-access list) and emails them via
   Resend. No DB table, no backend endpoint — a throwaway script.

   Usage:
     CLERK_SECRET_KEY=sk_live_xxx \
     RESEND_API_KEY=re_xxx \
     node launch-blast.mjs

   Add --dry-run to print recipients without sending:
     node launch-blast.mjs --dry-run

   Safe to stop and re-run: it logs each send. If it dies halfway,
   re-running re-sends to everyone (Resend has no dedupe), so prefer
   running it through cleanly. For true resumability you'd track sent
   addresses — omitted here to keep it a one-shot.
───────────────────────────────────────────────────────────── */

import { createClerkClient } from "@clerk/backend";
import { Resend } from "resend";

const DRY_RUN = process.argv.includes("--dry-run");

const clerk  = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM    = "The Linen Lady <hello@noemithelinenlady.net>";
const SUBJECT = "We're open — The Linen Lady is live";
const SITE    = "https://noemithelinenlady.net";

function emailHtml(firstName) {
  const hi = firstName ? `Dear ${firstName},` : "Hello,";
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#1e1b1a;background:#f7f2eb;padding:40px 32px;">
    <p style="font-size:0.7rem;letter-spacing:0.25em;text-transform:uppercase;color:#804e4f;margin:0 0 24px;">The Linen Lady · Est. 1994</p>
    <h1 style="font-size:2rem;font-weight:400;margin:0 0 16px;color:#1e1b1a;">The doors are <em style="color:#804e4f;">open</em>.</h1>
    <p style="font-size:1rem;line-height:1.7;color:#4a3f38;">${hi}</p>
    <p style="font-size:1rem;line-height:1.7;color:#4a3f38;">
      After 30 years at the Georgetown Flea Market, our collection of antique linens,
      lace, and heritage textiles is now online — every piece one of a kind, each with
      its own story. Thank you for being on the list. You're among the first through the door.
    </p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${SITE}/shop"
         style="display:inline-block;background:#804e4f;color:#fff;text-decoration:none;
                font-family:Arial,sans-serif;font-size:0.72rem;font-weight:500;letter-spacing:0.15em;
                text-transform:uppercase;padding:14px 36px;border-radius:6px;">
        Shop the collection
      </a>
    </p>
    <p style="font-size:0.85rem;line-height:1.6;color:#8a7a70;font-style:italic;">
      Handpicked since 1994 · Washington D.C.
    </p>
  </div>`;
}

async function* allUsers() {
  const pageSize = 100;
  let offset = 0;
  for (;;) {
    const { data } = await clerk.users.getUserList({ limit: pageSize, offset });
    if (!data.length) return;
    yield* data;
    if (data.length < pageSize) return;
    offset += pageSize;
  }
}

let sent = 0, skipped = 0, failed = 0;

for await (const u of allUsers()) {
  const email = u.primaryEmailAddress?.emailAddress
    ?? u.emailAddresses?.[0]?.emailAddress;
  if (!email) { skipped++; continue; }

  if (DRY_RUN) {
    console.log(`would send → ${email} (${u.firstName ?? "—"})`);
    sent++;
    continue;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: SUBJECT,
      html: emailHtml(u.firstName),
    });
    sent++;
    console.log(`sent → ${email}`);
    // Gentle pacing so we stay under Resend's rate limit.
    await new Promise((r) => setTimeout(r, 600));
  } catch (err) {
    failed++;
    console.error(`FAILED → ${email}:`, err?.message ?? err);
  }
}

console.log(`\nDone. ${DRY_RUN ? "would send" : "sent"}: ${sent}, skipped (no email): ${skipped}, failed: ${failed}`);
