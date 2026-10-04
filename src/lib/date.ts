/** Formats a content date for display, e.g. "June 2026". */
export function formatMonth(date: Date): string {
  // Frontmatter dates are midnight UTC, so format in UTC to keep the day.
  return date.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formats a content date for display with its day, e.g. "June 12, 2026". */
export function formatDay(date: Date): string {
  return date.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
