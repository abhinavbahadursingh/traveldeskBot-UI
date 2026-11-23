/** "Abhinav Singh" → "AS"; one word → its first letter. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0], last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** "Abhinav Singh" → "Abhinav". */
export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
