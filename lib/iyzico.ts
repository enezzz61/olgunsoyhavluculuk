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

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function isIyzicoConfigured() {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}

function getIyzicoClient() {
  const apiKey = process.env.IYZICO_API_KEY?.trim();
  const secretKey = process.env.IYZICO_SECRET_KEY?.trim();

  if (!apiKey || !secretKey) {
    throw new Error("IYZICO_API_KEY veya IYZICO_SECRET_KEY tanimli degil.");
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

  const response = await fetch(`${client.baseUrl}${path}`, {
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

  const result = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(result.errorMessage || `Iyzico request failed: ${response.status}`);
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
