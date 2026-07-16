import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { apiError, apiJson, getRequestContext, logApiError, logApiEvent } from "@/lib/api-observability";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getRequestContext(request, "/api/addresses/[id]");
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiError(context, 401, "UNAUTHORIZED", "Giris yapmalisiniz");
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, city, district, address, postalCode, isDefault } = body;

    // Verify ownership
    const existingAddress = await prisma.address.findUnique({ where: { id } });
    if (!existingAddress || existingAddress.userId !== user.id) {
      return apiError(context, 404, "NOT_FOUND", "Adres bulunamadi");
    }

    if (!fullName?.trim() || !phone?.trim() || !city?.trim() || !district?.trim() || !address?.trim()) {
      return apiError(context, 400, "VALIDATION_ERROR", "Tum alanlar zorunludur");
    }

    // If setting as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        district: district.trim(),
        address: address.trim(),
        postalCode: postalCode?.trim() || null,
        isDefault,
      },
    });

    logApiEvent(context, "address.updated", { userId: user.id, addressId: id });
    return apiJson(context, { address: updatedAddress });
  } catch (error) {
    logApiError(context, "address.update_failed", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Adres guncellenemedi");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getRequestContext(request, "/api/addresses/[id]");
  try {
    const user = await getSessionUser();
    if (!user) {
      return apiError(context, 401, "UNAUTHORIZED", "Giris yapmalisiniz");
    }

    const { id } = await params;

    // Verify ownership
    const existingAddress = await prisma.address.findUnique({ where: { id } });
    if (!existingAddress || existingAddress.userId !== user.id) {
      return apiError(context, 404, "NOT_FOUND", "Adres bulunamadi");
    }

    await prisma.address.delete({ where: { id } });

    logApiEvent(context, "address.deleted", { userId: user.id, addressId: id });
    return apiJson(context, { success: true });
  } catch (error) {
    logApiError(context, "address.delete_failed", error);
    return apiError(context, 500, "INTERNAL_ERROR", "Adres silinemedi");
  }
}
