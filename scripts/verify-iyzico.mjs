import { createHmac, randomUUID } from "node:crypto";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function buildAuth({ apiKey, secretKey, randomKey, path, body }) {
  const signature = createHmac("sha256", secretKey)
    .update(`${randomKey}${path}${body}`)
    .digest("hex");

  const raw = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(raw).toString("base64")}`;
}

async function postIyzico({ apiKey, secretKey, baseUrl, path, payload }) {
  const body = JSON.stringify(payload);
  const randomKey = randomUUID();
  const authorization = buildAuth({
    apiKey,
    secretKey,
    randomKey,
    path,
    body,
  });

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": randomKey,
      "x-iyzi-client-version": "olgunsoy-verify-1.0",
    },
    body,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { parseError: "Response is not JSON" };
  }

  return { statusCode: response.status, ok: response.ok, data };
}

async function main() {
  const apiKey = required("IYZICO_API_KEY");
  const secretKey = required("IYZICO_SECRET_KEY");
  const baseUrl = process.env.IYZICO_BASE_URL?.trim() || "https://sandbox-api.iyzipay.com";
  const callbackBase = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  const conversationId = `verify_${Date.now()}`;
  const initPath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
  const detailPath = "/payment/iyzipos/checkoutform/auth/ecom/detail";

  const initPayload = {
    locale: "tr",
    conversationId,
    price: "1.00",
    paidPrice: "1.00",
    currency: "TRY",
    basketId: `basket_${conversationId}`,
    paymentGroup: "PRODUCT",
    callbackUrl: `${callbackBase}/odeme/basarili`,
    enabledInstallments: [1],
    buyer: {
      id: "verify-user",
      name: "Test",
      surname: "User",
      gsmNumber: "+905555555555",
      email: "test@example.com",
      identityNumber: process.env.IYZICO_IDENTITY_NUMBER?.trim() || "11111111111",
      registrationAddress: "Test Mahallesi",
      ip: "127.0.0.1",
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: "Test User",
      city: "Istanbul",
      country: "Turkey",
      address: "Test Mahallesi No:1",
      zipCode: "34000",
    },
    billingAddress: {
      contactName: "Test User",
      city: "Istanbul",
      country: "Turkey",
      address: "Test Mahallesi No:1",
      zipCode: "34000",
    },
    basketItems: [
      {
        id: "verify-item-1",
        name: "Test Urun",
        category1: "Test",
        itemType: "PHYSICAL",
        price: "1.00",
      },
    ],
  };

  console.log("[1/2] Initializing Iyzico checkout form...");
  const initResult = await postIyzico({
    apiKey,
    secretKey,
    baseUrl,
    path: initPath,
    payload: initPayload,
  });

  if (!initResult.ok || initResult.data?.status !== "success") {
    console.error("Init failed:", JSON.stringify(initResult, null, 2));
    process.exit(1);
  }

  const token = initResult.data.token;
  const paymentPageUrl = initResult.data.paymentPageUrl;
  if (!token) {
    console.error("Init succeeded but token missing:", JSON.stringify(initResult.data, null, 2));
    process.exit(1);
  }

  console.log("Init OK. Token:", token);
  console.log("Payment page:", paymentPageUrl);

  console.log("[2/2] Retrieving checkout form status...");
  const detailResult = await postIyzico({
    apiKey,
    secretKey,
    baseUrl,
    path: detailPath,
    payload: {
      locale: "tr",
      conversationId,
      token,
    },
  });

  if (!detailResult.ok || detailResult.data?.status !== "success") {
    console.error("Detail failed:", JSON.stringify(detailResult, null, 2));
    process.exit(1);
  }

  console.log("Detail OK. paymentStatus:", detailResult.data.paymentStatus || "N/A");
  console.log("Iyzico sandbox connectivity and signed request flow is working.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
