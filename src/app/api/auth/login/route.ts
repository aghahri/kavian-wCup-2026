import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setSessionUserId } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "نام باید حداقل ۲ حرف باشد" }, { status: 400 });
    }

    if (!/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۱۲۳۴۵۶۷)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { phone },
      update: { name },
      create: { name, phone },
    });

    await setSessionUserId(user.id);

    return NextResponse.json({
      user: { id: user.id, name: user.name, isAdmin: user.isAdmin },
    });
  } catch {
    return NextResponse.json({ error: "خطا در ورود" }, { status: 500 });
  }
}
