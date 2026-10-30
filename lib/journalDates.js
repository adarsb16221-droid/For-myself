// Journal dates are local YYYY-MM-DD strings, so "today" matches the user's clock, not UTC

export function toDateStr(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function offsetDate(dateStr, days) {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}
