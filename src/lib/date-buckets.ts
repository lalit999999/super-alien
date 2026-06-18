function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d);
}

export function isToday(date: string | Date): boolean {
  const d = toDate(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function isTomorrow(date: string | Date): boolean {
  const d = toDate(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
}

// 2–7 days from today
export function isThisWeek(date: string | Date): boolean {
  const d = toDate(date);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + 2);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

// > 7 days out
export function isUpcoming(date: string | Date): boolean {
  const d = toDate(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 7);
  cutoff.setHours(23, 59, 59, 999);
  return d > cutoff;
}
