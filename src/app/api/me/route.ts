import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { getCurrentUser } from "@/lib/auth";
import { toClientUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ user: toClientUser(user) }, { headers: NO_STORE_HEADERS });
}
