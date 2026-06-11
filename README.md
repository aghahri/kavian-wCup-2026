# کاویان — پیش‌بینی جام جهانی ۲۰۲۶

یک وب‌سایت ساده و فارسی (RTL) برای پیش‌بینی بازی‌های جام جهانی ۲۰۲۶، طراحی‌شده برای کاویان (پایه هفتم) تا آن را مدیریت کند.

## امکانات

- صفحه اصلی با معرفی و بازی‌های نزدیک
- برنامه کامل بازی‌ها
- فرم پیش‌بینی امتیاز
- جدول امتیازات
- ورود ساده با نام + شماره موبایل
- پنل مدیریت برای کاویان (افزودن/ویرایش بازی، ثبت نتیجه، مشاهده پیش‌بینی‌ها)
- طراحی موبایل‌اول
- داده نمونه جام جهانی ۲۰۲۶

## فناوری‌ها

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- SQLite + Prisma ORM

## راه‌اندازی محلی

```bash
cd kavian-worldcup
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

سایت روی [http://localhost:3000](http://localhost:3000) باز می‌شود.

## ورود مدیر (کاویان)

پس از seed:

- **نام:** کاویان
- **شماره:** `09120000000`

## قوانین امتیازدهی

| نوع پیش‌بینی | امتیاز |
|-------------|--------|
| امتیاز دقیق | ۵ |
| نتیجه درست (برد/مساوی/باخت) | ۲ |
| اشتباه | ۰ |

## ساختار پروژه

```
kavian-worldcup/
├── prisma/           # schema، seed و دیتابیس SQLite
├── src/
│   ├── app/          # صفحات و API routes
│   ├── components/   # کامپوننت‌های UI
│   └── lib/          # prisma، auth، scoring
└── README.md
```

## استقرار روی Vercel

1. پروژه را در Vercel import کنید (ریشه: `kavian-worldcup`)
2. متغیرهای محیطی را تنظیم کنید:
   - `DATABASE_URL` — برای production پیشنهاد می‌شود از [Turso](https://turso.tech) (رایگان) استفاده کنید
   - `SESSION_SECRET` — یک رشته تصادفی طولانی
3. Deploy کنید

> **نکته:** SQLite فایل‌محور روی Vercel Serverless به‌صورت پایدار ذخیره نمی‌شود. برای production روی Vercel از Turso (libSQL) یا استقرار روی Railway/Render با دیسک پایدار استفاده کنید. برای توسعه و دمو محلی، SQLite کافی است.

### دستورات مفید

```bash
npm run db:push    # اعمال schema
npm run db:seed    # پر کردن داده نمونه
npm run build      # ساخت production
npm run lint       # بررسی کد
```

## مجوز

پروژه آموزشی — آزاد برای استفاده شخصی کاویان و دوستانش.
