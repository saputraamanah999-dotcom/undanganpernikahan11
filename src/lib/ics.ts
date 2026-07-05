// ============================================================
// ICS (iCalendar) helper — generates .ics files client-side
// for Google Calendar / Apple Calendar / Outlook import.
// ============================================================

export interface IcsEvent {
  title: string;
  /** ISO datetime string OR YYYY-MM-DD + HH:mm in WITA (UTC+8) */
  start: string;
  end?: string;
  description?: string;
  location?: string;
  url?: string;
}

/**
 * Convert a "YYYY-MM-DD" + "HH:mm" (WITA, UTC+8) pair OR an ISO string
 * into an iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function toIcsUtc(input: string): string {
  // If it's already an ISO string, parse directly
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}T/.test(input) || input.includes('T')) {
    d = new Date(input);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    // Date only — default to 08:00 WITA
    d = new Date(`${input}T08:00:00+08:00`);
  } else {
    d = new Date(input);
  }
  if (isNaN(d.getTime())) {
    // Fallback: now + 1 day
    d = new Date(Date.now() + 86400000);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcs(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Build a single-event ICS calendar payload.
 */
export function generateIcsEvent(ev: IcsEvent): string {
  const dtStart = toIcsUtc(ev.start);
  const dtEnd = ev.end ? toIcsUtc(ev.end) : (() => {
    // Default 90-minute event
    const d = new Date(toIcsUtc(ev.start).replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
    d.setMinutes(d.getMinutes() + 90);
    return toIcsUtc(d.toISOString());
  })();

  const dtStamp = toIcsUtc(new Date().toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bali Joint Wedding//Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Math.random().toString(36).slice(2)}-bali-wedding@invitation`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeIcs(ev.description)}` : '',
    ev.location ? `LOCATION:${escapeIcs(ev.location)}` : '',
    ev.url ? `URL:${escapeIcs(ev.url)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

/**
 * Trigger a client-side .ics file download.
 */
export function downloadIcs(filename: string, icsString: string) {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Parse a "YYYY-MM-DD" date + a "HH:mm - HH:mm WITA" time range into
 * proper ISO start/end strings in WITA timezone.
 */
export function parseWitaDateRange(dateStr: string, timeRange: string): { start: string; end: string } {
  // timeRange e.g. "08:00 - 09:30 WITA"
  const match = timeRange.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    return {
      start: `${dateStr}T08:00:00+08:00`,
      end: `${dateStr}T09:30:00+08:00`
    };
  }
  const [, sh, sm, eh, em] = match;
  return {
    start: `${dateStr}T${sh.padStart(2, '0')}:${sm}:00+08:00`,
    end: `${dateStr}T${eh.padStart(2, '0')}:${em}:00+08:00`
  };
}
