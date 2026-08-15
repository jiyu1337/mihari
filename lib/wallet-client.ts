export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export async function walletRequest<T>(
  request: Promise<unknown>,
  timeoutMessage: string,
  timeoutMs = 30_000,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([request, timeout]) as T;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function timedFetch(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("MIHARI did not receive a server response. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
