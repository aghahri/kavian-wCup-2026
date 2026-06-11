import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminMatchManager } from "@/components/AdminMatchManager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminMatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: "asc" },
    include: { _count: { select: { predictions: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">مدیریت بازی‌ها</h1>
          <p className="mt-1 text-sm text-white/70">افزودن بازی جدید یا ویرایش نتیجه</p>
        </div>
        <Link href="/admin" className="text-sm text-emerald-300 hover:underline">
          بازگشت
        </Link>
      </div>

      <AdminMatchManager initialMatches={matches} />
    </div>
  );
}
