import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";

export async function GET(request: Request) {
  const context = getRequestContext(request, "/api/addresses");
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiError(context, 401, "UNAUTHORIZED", "Giris yapmalisiniz");
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    logApiEvent(context, "addresses.listed", { userId: user.id, count: addresses.length });
    return apiJson(context, { addresses });
  } catch (error) {
    logApiError(context, "addresses.list_failed", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Adresler yuklenmedi");
  }
}

export async function POST(request: Request) {
  const context = getRequestContext(request, "/api/addresses");
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiError(context, 401, "UNAUTHORIZED", "Giris yapmalisiniz");
    }

    const body = await request.json();
    const { fullName, phone, city, district, address, postalCode, isDefault } = body;

    if (!fullName?.trim() || !phone?.trim() || !city?.trim() || !district?.trim() || !address?.trim()) {
      return apiError(context, 400, "VALIDATION_ERROR", "Tum alanlar zorunludur");
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        postalCode: postalCode?.trim() || null,
        isDefault: isDefault || false,
      },
    });

    logApiEvent(context, "address.created", { userId: user.id, addressId: newAddress.id });
    return apiJson(context, { address: newAddress }, { status: 201 });
  } catch (error) {
    logApiError(context, "address.create_failed", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Adres eklenemedi");
  }
}
