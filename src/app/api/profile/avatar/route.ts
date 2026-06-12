import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";
import { getCurrentUser } from "@/lib/auth";
import { toClientUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  if (!ALLOWED.has(file.type) || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "INVALID_FILE" }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });

  const filename = `${user.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const avatarUrl = `/uploads/avatars/${filename}`;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  return NextResponse.json(
    { user: toClientUser(updated), avatarUrl },
    { headers: NO_STORE_HEADERS }
  );
}
