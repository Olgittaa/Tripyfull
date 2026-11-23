// What the portal tells the chat about the user and the page they are on.
// It arrives by postMessage (see ChatLauncher.vue in the portal) and rides along with
// every /api/chat request: the token in the Authorization header, the page in the body.

export type PageContext = {
  /** Which screen: "trip-overview", "day", "bookings", "places-library", … */
  page: string;
  tripId: string | null;
  dayId: string | null;
};

export type PortalContext = PageContext & {
  /** The user's JWT for the Spring API. Kept in memory only, never in storage. */
  token: string | null;
};

export const PORTAL_ORIGIN = process.env.NEXT_PUBLIC_PORTAL_ORIGIN ?? "http://localhost:5173";

/** Validates a postMessage payload from the portal; null if it is not a context message. */
export function parseContextMessage(data: unknown): PortalContext | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.type !== "tripyfull-chat:context") return null;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    token: str(d.token),
    page: str(d.page) ?? "other",
    tripId: str(d.tripId),
    dayId: str(d.dayId),
  };
}
