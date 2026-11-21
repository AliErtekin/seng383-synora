// Date helpers for the weekly schedule. All values are in the browser's local time.

function pad(n) {
  return String(n).padStart(2, '0');
}

export function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Monday 00:00 (local) of the week that contains `d`.
export function mondayOf(d = new Date()) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export function addDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

// Browser offset from UTC in minutes, east positive (Istanbul: 180).
export function tzOffsetMinutes(d = new Date()) {
  return -d.getTimezoneOffset();
}

// "2026-11-24" + "10:30" -> "2026-11-24T10:30:00+03:00"
export function localDateTimeWithOffset(date, time) {
  const local = new Date(`${date}T${time}:00`);
  const off = tzOffsetMinutes(local);
  const sign = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  return `${date}T${time}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function formatDay(d) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
