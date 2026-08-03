"use server";

import { revalidatePath } from "next/cache";

import {
  createService as createServiceMutation,
  updateService as updateServiceMutation,
  deleteService as deleteServiceMutation,
  toggleService as toggleServiceMutation,
} from "./lib/mutations";

import { serviceSchema } from "./schemas";

export async function createService(
  _: unknown,
  formData: FormData,
) {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description:
      formData.get("description") || undefined,
    durationMinutes: Number(
      formData.get("durationMinutes"),
    ),
    price: Number(formData.get("price")),
    color: formData.get("color") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      errors:
        parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createServiceMutation(parsed.data);

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message:
        "Ocurrió un error al crear el servicio.",
    };
  }
}

export async function updateService(
  id: string,
  _: unknown,
  formData: FormData,
) {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description:
      formData.get("description") || undefined,
    durationMinutes: Number(
      formData.get("durationMinutes"),
    ),
    price: Number(formData.get("price")),
    color: formData.get("color") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      errors:
        parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateServiceMutation({
      id,
      ...parsed.data,
    });

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message:
        "Ocurrió un error al actualizar el servicio.",
    };
  }
}

export async function deleteService(
  id: string,
) {
  try {
    await deleteServiceMutation(id);

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el servicio.",
    };
  }
}

export async function toggleService(
  id: string,
  active: boolean,
) {
  try {
    await toggleServiceMutation(id, active);

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message:
        "No fue posible actualizar el servicio.",
    };
  }
}