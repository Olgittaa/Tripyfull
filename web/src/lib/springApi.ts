// Calls to the Tripyfull Spring API on behalf of the signed-in user. Server-side only:
// the user's JWT goes from here to Spring and nowhere else — never to the model.

const API_URL = process.env.SPRING_API_URL ?? "http://localhost:8080";

/**
 * GET a Spring endpoint as the user. Errors carry a short message that is safe to show
 * the model (it may repeat it): no host names, no stack traces.
 */
export async function springGet<T>(path: string, token: string | null): Promise<T> {
  if (!token) throw new Error("The user is not signed in, so their trips cannot be read.");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (err) {
    console.error("Spring API unreachable", err);
    throw new Error("The trip service is unavailable right now.");
  }

  if (res.status === 401) throw new Error("The user's session has expired; they need to sign in again.");
  // Spring answers 404 both for a missing record and for someone else's — by design.
  if (res.status === 404) throw new Error("Not found, or it does not belong to this user.");
  if (!res.ok) {
    console.error("Spring API error", res.status, path);
    throw new Error("The trip service returned an error.");
  }
  return (await res.json()) as T;
}
