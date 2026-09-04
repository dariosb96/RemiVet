export function isGoogleInvalidGrant(
  error: unknown
): boolean {
  if (!error) {
    return false;
  }

  const candidate = error as {
    code?: unknown;

    response?: {
      data?: {
        error?: unknown;
      };
    };

    cause?: {
      message?: unknown;
    };

    message?: unknown;
  };

  if (
    candidate.code === 400 &&
    candidate.response?.data?.error ===
      "invalid_grant"
  ) {
    return true;
  }

  if (
    candidate.response?.data?.error ===
    "invalid_grant"
  ) {
    return true;
  }

  if (
    typeof candidate.cause?.message ===
      "string" &&
    candidate.cause.message.includes(
      "invalid_grant"
    )
  ) {
    return true;
  }

  if (
    typeof candidate.message === "string" &&
    candidate.message.includes(
      "invalid_grant"
    )
  ) {
    return true;
  }

  return false;
}