"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";

import {
  createService as createServiceMutation,
  updateService as updateServiceMutation,
  deleteService as deleteServiceMutation,
  toggleService as toggleServiceMutation,
} from "./lib/mutations";

import { serviceSchema } from "./schemas";

async function requireAdmin() {
  const session =
    await getServerSession(authOptions);

  if (
    !session?.user ||
    session.user.role !== "ADMIN"
  ) {
    throw new Error("UNAUTHORIZED");
  }
}

function getStringValue(
  value: FormDataEntryValue | null,
) {
  return typeof value === "string"
    ? value
    : "";
}

function getOptionalString(
  value: FormDataEntryValue | null,
) {
  const stringValue =
    getStringValue(value).trim();

  return stringValue || undefined;
}

export async function createService(
  _: unknown,
  formData: FormData,
) {
  try {
    await requireAdmin();

    const parsed =
      serviceSchema.safeParse({
        name: getStringValue(
          formData.get("name"),
        ),

        description:
          getOptionalString(
            formData.get("description"),
          ),

        durationMinutes: Number(
          formData.get(
            "durationMinutes",
          ),
        ),

        price: Number(
          formData.get("price"),
        ),

        color:
          getOptionalString(
            formData.get("color"),
          ),
      });

    if (!parsed.success) {
      return {
        success: false,
        errors:
          parsed.error.flatten()
            .fieldErrors,
      };
    }

    await createServiceMutation(
      parsed.data,
    );

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[createService]",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No tienes permisos para realizar esta acción.",
      };
    }

    return {
      success: false,
      message:
        "Ocurrió un error al crear el servicio.",
    };
  }
}

export async function updateService(
  _: unknown,
  formData: FormData,
) {
  try {
    await requireAdmin();

    const id =
      getStringValue(
        formData.get("id"),
      ).trim();

    if (!id) {
      return {
        success: false,
        message:
          "Servicio inválido.",
      };
    }

    const parsed =
      serviceSchema.safeParse({
        name: getStringValue(
          formData.get("name"),
        ),

        description:
          getOptionalString(
            formData.get("description"),
          ),

        durationMinutes: Number(
          formData.get(
            "durationMinutes",
          ),
        ),

        price: Number(
          formData.get("price"),
        ),

        color:
          getOptionalString(
            formData.get("color"),
          ),
      });

    if (!parsed.success) {
      return {
        success: false,
        errors:
          parsed.error.flatten()
            .fieldErrors,
      };
    }

    await updateServiceMutation({
      id,
      ...parsed.data,
    });

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[updateService]",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No tienes permisos para realizar esta acción.",
      };
    }

    if (
      error instanceof Error &&
      error.message.includes(
        "No record was found",
      )
    ) {
      return {
        success: false,
        message:
          "El servicio ya no existe.",
      };
    }

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
    await requireAdmin();

    if (!id?.trim()) {
      return {
        success: false,
        message:
          "Servicio inválido.",
      };
    }

    await deleteServiceMutation(
      id,
    );

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[deleteService]",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No tienes permisos para realizar esta acción.",
      };
    }

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
    await requireAdmin();

    if (!id?.trim()) {
      return {
        success: false,
        message:
          "Servicio inválido.",
      };
    }

    await toggleServiceMutation(
      id,
      active,
    );

    revalidatePath("/servicios");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[toggleService]",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No tienes permisos para realizar esta acción.",
      };
    }

    return {
      success: false,
      message:
        "No fue posible actualizar el servicio.",
    };
  }
}