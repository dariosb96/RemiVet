import { Prisma } from "@prisma/client";

export function serialize<T, R>(
  data: T
): R {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (value instanceof Prisma.Decimal) {
        return value.toNumber();
      }

      if (
        typeof value === "object" &&
        value !== null &&
        "toNumber" in value &&
        typeof value.toNumber === "function"
      ) {
        return value.toNumber();
      }

      return value;
    })
  ) as R;
}