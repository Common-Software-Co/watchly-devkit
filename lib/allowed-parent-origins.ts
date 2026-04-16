/** Serialized origin for production kiosk parent shell (no path; not `http://ui/`). */
export const DEFAULT_ALLOWED_PARENT_ORIGIN = "http://ui";

/**
 * Parses `NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS` (comma-separated origins).
 * When unset or empty/whitespace-only, returns `[DEFAULT_ALLOWED_PARENT_ORIGIN]`.
 */
export function parseAllowedParentOrigins(
  envValue: string | undefined,
): string[] {
  const trimmed = envValue?.trim();
  if (!trimmed) {
    return [DEFAULT_ALLOWED_PARENT_ORIGIN];
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
