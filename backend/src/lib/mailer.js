// Lightweight transactional email via Resend's HTTP API (no extra dependency).
// If RESEND_API_KEY is not configured the calls become no-ops so the app keeps
// working in dev — emails are simply logged and skipped.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'SeaSide Jobs <onboarding@resend.dev>';
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');

export async function sendEmail({ to, subject, html }) {
  if (!to) return;
  if (!RESEND_API_KEY) {
    console.log(`[mailer] RESEND_API_KEY not set — skipping email to ${to} ("${subject}")`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: MAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[mailer] send failed:', res.status, await res.text());
    }
  } catch (e) {
    console.error('[mailer] error:', e.message);
  }
}

function shell(title, body) {
  const link = APP_URL
    ? `<p style="margin:24px 0 0"><a href="${APP_URL}/dashboard" style="background:#e85d2f;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open SeaSide Jobs</a></p>`
    : '';
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
    <h2 style="color:#e85d2f;margin:0 0 12px">SeaSide Jobs</h2>
    <h3 style="margin:0 0 8px">${title}</h3>
    <div style="font-size:14px;line-height:1.6;color:#444">${body}</div>
    ${link}
  </div>`;
}

// New application landed on a hotel's listing.
export function newApplicationEmail({ hotelEmail, applicantName, jobTitle }) {
  return {
    to: hotelEmail,
    subject: `New application: ${jobTitle}`,
    html: shell('You have a new application', `<strong>${applicantName}</strong> just applied for <strong>${jobTitle}</strong>. Open your dashboard to review them.`),
  };
}

// Applicant was accepted or rejected.
export function applicationDecisionEmail({ applicantEmail, status, jobTitle, hotelName }) {
  const accepted = status === 'accepted';
  return {
    to: applicantEmail,
    subject: accepted ? `You've been accepted: ${jobTitle}` : `Update on your application: ${jobTitle}`,
    html: shell(
      accepted ? 'Congratulations! 🎉' : 'Application update',
      accepted
        ? `<strong>${hotelName}</strong> accepted your application for <strong>${jobTitle}</strong>. They may reach out to you via messages.`
        : `<strong>${hotelName}</strong> has reviewed your application for <strong>${jobTitle}</strong>. Unfortunately you were not selected this time — keep applying!`
    ),
  };
}
