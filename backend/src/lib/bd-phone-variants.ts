/**
 * Bangladesh-style mobile variants for login lookup (DB may store 01… or +880…).
 */
export function bdPhoneLoginVariants(raw: string): string[] {
  const t = raw.trim();
  if (!t) {
    return [];
  }
  const out = new Set<string>([t]);
  if (t.startsWith("0") && t.length >= 10) {
    out.add(`+880${t.slice(1)}`);
    out.add(`880${t.slice(1)}`);
  }
  if (t.startsWith("+880")) {
    out.add(`0${t.slice(4)}`);
    const rest = t.slice(4);
    out.add(`880${rest}`);
  }
  if (t.startsWith("880") && t.length > 3) {
    out.add(`+${t}`);
    out.add(`0${t.slice(3)}`);
  }
  return [...out];
}
