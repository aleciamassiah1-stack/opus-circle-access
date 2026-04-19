// Helpers for generating Google Meet lookup links and .ics calendar files.
// We use the anonymous "lookup" URL pattern — first person to click creates the room.

export function generateMeetLookupUrl(): string {
  // 12 lowercase alphanumeric chars — Meet's lookup tokens are similar in shape.
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) {
    token += chars[arr[i] % chars.length];
  }
  return `https://meet.google.com/lookup/${token}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export interface IcsParams {
  uid: string;
  startISO: string;
  durationMinutes: number;
  title: string;
  description: string;
  location: string; // e.g. the meeting URL
  organizerEmail?: string;
  attendeeEmails?: string[];
}

export function buildIcs(p: IcsParams): string {
  const start = new Date(p.startISO);
  const end = new Date(start.getTime() + p.durationMinutes * 60_000);
  const now = new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Opulence Talent Collective//Interview//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${p.uid}@opulencetalentcollective.com`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(p.title)}`,
    `DESCRIPTION:${escapeIcs(p.description)}`,
    `LOCATION:${escapeIcs(p.location)}`,
  ];

  if (p.organizerEmail) {
    lines.push(`ORGANIZER:mailto:${p.organizerEmail}`);
  }
  for (const email of p.attendeeEmails ?? []) {
    lines.push(`ATTENDEE;RSVP=TRUE:mailto:${email}`);
  }

  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

/** Build a data: URL the user can click to download the .ics file. */
export function icsDataUrl(ics: string): string {
  // btoa requires latin1; .ics is ASCII so it's safe.
  const b64 = btoa(unescape(encodeURIComponent(ics)));
  return `data:text/calendar;charset=utf-8;base64,${b64}`;
}
