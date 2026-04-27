const ONVO_API_BASE = "https://api.onvopay.com/v1";

type OnvoKeyMode = "test" | "live" | "unknown";

type OnvoRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export type OnvoPaymentIntent = {
  id: string;
  status: string;
  customerId?: string | null;
  metadata?: Record<string, string> | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  lastPaymentError?: {
    code?: string | null;
    message?: string | null;
    failureMessage?: string | null;
  } | null;
};

export type OnvoCustomer = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

function detectOnvoKeyMode(key: string): OnvoKeyMode {
  if (key.startsWith("onvo_test_")) return "test";
  if (key.startsWith("onvo_live_")) return "live";
  return "unknown";
}

function ensureOnvoKeysCompatibility(secretKey: string, publicKey: string): void {
  const secretMode = detectOnvoKeyMode(secretKey);
  const publicMode = detectOnvoKeyMode(publicKey);

  if (secretMode === "unknown") {
    throw new Error("ONVO secret key format is invalid");
  }

  if (publicMode === "unknown") {
    throw new Error("ONVO public key format is invalid");
  }

  if (secretMode !== publicMode) {
    throw new Error(
      `ONVO key mode mismatch: secret key is ${secretMode}, public key is ${publicMode}`,
    );
  }
}

function formatOnvoErrorPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as Record<string, unknown>;
  const message =
    (typeof record.message === "string" && record.message.trim()) ||
    (typeof (record.error as Record<string, unknown> | undefined)?.message === "string" &&
      String((record.error as Record<string, unknown>).message).trim()) ||
    "";

  const code =
    (typeof record.code === "string" && record.code.trim()) ||
    (typeof (record.error as Record<string, unknown> | undefined)?.code === "string" &&
      String((record.error as Record<string, unknown>).code).trim()) ||
    "";

  if (message && code) return `${message} (code: ${code})`;
  if (message) return message;
  if (code) return `ONVO error code: ${code}`;

  return JSON.stringify(payload);
}

function getOnvoSecretKey(): string {
  const key = String(process.env.ONVO_SECRET_KEY ?? "").trim();
  if (!key) {
    throw new Error("ONVO secret key is not configured");
  }
  return key;
}

async function onvoRequest<T>(path: string, options: OnvoRequestOptions = {}): Promise<T> {
  const secretKey = getOnvoSecretKey();
  const response = await fetch(`${ONVO_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = formatOnvoErrorPayload(payload, response.statusText);
    throw new Error(`ONVO request failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as T;
}

export async function createOnvoPaymentIntent(input: {
  amount: number;
  currency: "USD" | "CRC";
  description: string;
  metadata: Record<string, string>;
  customerId?: string;
}): Promise<OnvoPaymentIntent> {
  return onvoRequest<OnvoPaymentIntent>("/payment-intents", {
    method: "POST",
    body: {
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      metadata: input.metadata,
      customerId: input.customerId,
    },
  });
}

export async function createOnvoCustomer(input: {
  name: string;
  email: string;
  phone?: string;
}): Promise<OnvoCustomer> {
  return onvoRequest<OnvoCustomer>("/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone,
    },
  });
}

export async function getOnvoPaymentIntent(id: string): Promise<OnvoPaymentIntent> {
  return onvoRequest<OnvoPaymentIntent>(`/payment-intents/${encodeURIComponent(id)}`);
}

export function getOnvoPublishableKey(): string {
  const key = String(process.env.ONVO_PUBLIC_KEY ?? "").trim();
  if (!key) {
    throw new Error("ONVO public key is not configured");
  }

  ensureOnvoKeysCompatibility(getOnvoSecretKey(), key);

  return key;
}
