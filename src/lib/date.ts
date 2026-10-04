/** Formats a content date for display, e.g. "June 2026". */
export function formatMonth(date: Date): string {
  // Frontmatter dates are midnight UTC, so format in UTC to keep the day.
  return date.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
