import { createHmac, randomUUID } from "node:crypto";

type IyzipayResult = {
  status?: string;
  errorMessage?: string;
  token?: string;
  paymentPageUrl?: string;
  paymentStatus?: string;
};

type IyzipayAddress = {
  contactName: string;
  city: string;
  country: string;
  address: string;
  zipCode: string;
};

type IyzipayBasketItem = {
  id: string;
  name: string;
  category1: string;
  itemType: "PHYSICAL" | "VIRTUAL";
  price: string;
};

export function normalizeIyzicoErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("api bilgileri bulunamad") || normalized.includes("api bilgileri bulunamadi")) {
    return "Iyzico API bilgileri bulunamadı. Vercel'de IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL ve IYZICO_IDENTITY_NUMBER değerlerini kontrol edin.";
  }

  if (normalized.includes("iyzico_api_key") || normalized.includes("iyzico_secret_key") || normalized.includes("iyzico_base_url")) {
    return "Iyzico kimlik bilgileri eksik. Vercel'de IYZICO_API_KEY, IYZICO_SECRET_KEY ve IYZICO_BASE_URL değerlerini doğrulayın.";
  }

  return message;
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getIyzicoConfigStatus() {
  const missingKeys: string[] = [];

  if (!process.env.IYZICO_API_KEY?.trim()) {
    missingKeys.push("IYZICO_API_KEY");
  }

  if (!process.env.IYZICO_SECRET_KEY?.trim()) {
    missingKeys.push("IYZICO_SECRET_KEY");
  }

  if (!process.env.IYZICO_BASE_URL?.trim()) {
    missingKeys.push("IYZICO_BASE_URL");
  }

  if (!process.env.IYZICO_IDENTITY_NUMBER?.trim()) {
    missingKeys.push("IYZICO_IDENTITY_NUMBER");
  }

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function isIyzicoConfigured() {
  return getIyzicoConfigStatus().configured;
}

function getIyzicoClient() {
  const apiKey = process.env.IYZICO_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim();
  const baseUrl = process.env.IYZICO_BASE_URL?.trim();

  if (!apiKey || !secretKey || !baseUrl) {
    const config = getIyzicoConfigStatus();
    const missing = config.missingKeys.join(", ");
    throw new Error(normalizeIyzicoErrorMessage(`Iyzico API bilgileri bulunamadı. Eksik değerler: ${missing}`));
  }

  return {
    apiKey,
    secretKey,
    baseUrl: process.env.IYZICO_BASE_URL?.trim() || "https://sandbox-api.iyzipay.com",
  };
}

function buildAuthorization(params: {
  apiKey: string;
  secretKey: string;
  randomKey: string;
  path: string;
  body: string;
}) {
  const signaturePayload = `${params.randomKey}${params.path}${params.body}`;
  const signature = createHmac("sha256", params.secretKey)
    .update(signaturePayload)
    .digest("hex");

  const authorizationRaw = `apiKey:${params.apiKey}&randomKey:${params.randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(authorizationRaw).toString("base64")}`;
}

async function postIyzico<T extends IyzipayResult>(path: string, payload: Record<string, unknown>) {
  const client = getIyzicoClient();
  const body = JSON.stringify(payload);
  const randomKey = randomUUID();

  const authorization = buildAuthorization({
    apiKey: client.apiKey,
    secretKey: client.secretKey,
    randomKey,
    path,
    body,
  });

  let response: Response;
  try {
    response = await fetch(`${client.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authorization,
        "x-iyzi-rnd": randomKey,
        "x-iyzi-client-version": "olgunsoy-nextjs-1.0",
      },
      body,
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Iyzico isteği ağ hatasıyla başarısız oldu: ${message}`);
  }

  let result: T;
  try {
    result = (await response.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Iyzico yanıtı çözülemedi: ${normalizeIyzicoErrorMessage(message)}`);
  }

  if (!response.ok) {
    const errorMessage = normalizeIyzicoErrorMessage(
      result?.errorMessage || result?.status || `Iyzico request failed: ${response.status}`,
    );
    throw new Error(`Iyzico hatası: ${errorMessage}`);
  }

  return result;
}

export async function createIyzicoCheckoutForm(input: {
  conversationId: string;
  basketId: string;
  email: string;
  fullName: string;
  userId: string;
  totalTry: number;
  callbackUrl: string;
  shippingAddress: IyzipayAddress;
  billingAddress: IyzipayAddress;
  basketItems: IyzipayBasketItem[];
}) {
  const identityNumber = process.env.IYZICO_IDENTITY_NUMBER || "11111111111";

  const requestPayload = {
    locale: "tr",
    conversationId: input.conversationId,
    price: input.totalTry.toFixed(2),
    paidPrice: input.totalTry.toFixed(2),
    currency: "TRY",
    basketId: input.basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: input.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: input.userId,
      name: input.fullName.split(" ")[0] || "Musteri",
      surname: input.fullName.split(" ").slice(1).join(" ") || "Musteri",
      gsmNumber: "+905555555555",
      email: input.email,
      identityNumber,
      registrationAddress: input.shippingAddress.address,
      ip: "127.0.0.1",
      city: input.shippingAddress.city,
      country: input.shippingAddress.country,
      zipCode: input.shippingAddress.zipCode,
    },
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    basketItems: input.basketItems,
  };

  const result = await postIyzico<IyzipayResult>(
    "/payment/iyzipos/checkoutform/initialize/auth/ecom",
    requestPayload,
  );

  if (result.status !== "success" || !result.token || !result.paymentPageUrl) {
    throw new Error(result.errorMessage || "Iyzico checkout form olusturulamadi.");
  }

  return {
    token: result.token,
    paymentPageUrl: result.paymentPageUrl,
  };
}

export async function retrieveIyzicoCheckoutForm(input: {
  token: string;
  conversationId: string;
}) {
  return postIyzico<IyzipayResult>(
    "/payment/iyzipos/checkoutform/auth/ecom/detail",
    {
      locale: "tr",
      token: input.token,
      conversationId: input.conversationId,
    },
  );
}
