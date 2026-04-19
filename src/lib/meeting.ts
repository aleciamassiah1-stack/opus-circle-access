// Helpers for generating Google Meet links and calendar files.
//
// We use https://meet.google.com/new — when the first participant clicks,
// Google creates a fresh room and gives the persistent link. Anyone with
// the calendar invite can then join. (Random "lookup/<token>" URLs are NOT
// valid — Google rejects unknown tokens, so we can't fabricate them client-side.)

export function generateMeetLookupUrl(): string {
  return "https://meet.google.com/new";
}

/**
 * Build a Google Calendar "create event" URL that pre-fills the date,
 * title, description, and location. Opens in a new tab — no download needed.
 */
export function googleCalendarUrl(p: {
  startISO: string;
  durationMinutes: number;
  title: string;
  description: string;
  location: string;
}): string {
  const start = new Date(p.startISO);
  const end = new Date(start.getTime() + p.durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, "0") +
    String(d.getUTCDate()).padStart(2, "0") +
    "T" +
    String(d.getUTCHours()).padStart(2, "0") +
    String(d.getUTCMinutes()).padStart(2, "0") +
    String(d.getUTCSeconds()).padStart(2, "0") +
    "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: p.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: p.description,
    location: p.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

/**
 * Returns true when two time ranges overlap. Each is defined by an ISO
 * start and a duration in minutes. Touching boundaries (one ends exactly
 * when the next starts) are NOT considered overlapping.
 */
export function slotsOverlap(
  a: { start: string; duration_minutes: number },
  b: { start: string; duration_minutes: number },
): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = aStart + a.duration_minutes * 60_000;
  const bStart = new Date(b.start).getTime();
  const bEnd = bStart + b.duration_minutes * 60_000;
  return aStart < bEnd && bStart < aEnd;
}
