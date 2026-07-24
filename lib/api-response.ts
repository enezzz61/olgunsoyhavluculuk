export async function readApiErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.clone().json();
    const message = typeof data?.message === "string" ? data.message : "";
    if (message) {
      return message;
    }
  } catch {
    // Ignore invalid JSON and fall back to the generic message.
  }

  return fallback;
}
