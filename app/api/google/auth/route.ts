import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "No autorizado.",
      },
      { status: 401 }
    );
  }

  const authUrl = getGoogleAuthUrl();

  return NextResponse.redirect(authUrl);
}