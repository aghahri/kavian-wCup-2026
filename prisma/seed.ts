import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function referralCode(): string {
  return randomBytes(4).toString("hex");
}

const matches = [
  {
    homeTeam: "Mexico",
    awayTeam: "South Africa",
    homeTeamFa: "مکزیک",
    awayTeamFa: "آفریقای جنوبی",
    homeTeamAr: "المكسيك",
    awayTeamAr: "جنوب أفريقيا",
    stage: "گروه A",
    stageEn: "Group A",
    stageAr: "المجموعة أ",
    kickoffAt: new Date("2026-06-11T19:00:00Z"),
  },
  {
    homeTeam: "South Korea",
    awayTeam: "Czech Republic",
    homeTeamFa: "کره جنوبی",
    awayTeamFa: "چک",
    homeTeamAr: "كوريا الجنوبية",
    awayTeamAr: "التشيك",
    stage: "گروه A",
    stageEn: "Group A",
    stageAr: "المجموعة أ",
    kickoffAt: new Date("2026-06-12T02:00:00Z"),
  },
  {
    homeTeam: "Canada",
    awayTeam: "Bosnia and Herzegovina",
    homeTeamFa: "کانادا",
    awayTeamFa: "بوسنی و هرزگوین",
    homeTeamAr: "كندا",
    awayTeamAr: "البوسنة والهرسك",
    stage: "گروه B",
    stageEn: "Group B",
    stageAr: "المجموعة ب",
    kickoffAt: new Date("2026-06-13T01:00:00Z"),
  },
  {
    homeTeam: "USA",
    awayTeam: "Paraguay",
    homeTeamFa: "آمریکا",
    awayTeamFa: "پاراگوئه",
    homeTeamAr: "الولايات المتحدة",
    awayTeamAr: "باراغواي",
    stage: "گروه D",
    stageEn: "Group D",
    stageAr: "المجموعة د",
    kickoffAt: new Date("2026-06-13T01:00:00Z"),
  },
  {
    homeTeam: "Iran",
    awayTeam: "New Zealand",
    homeTeamFa: "ایران",
    awayTeamFa: "نیوزیلند",
    homeTeamAr: "إيران",
    awayTeamAr: "نيوزيلندا",
    stage: "گروه G",
    stageEn: "Group G",
    stageAr: "المجموعة ج",
    kickoffAt: new Date("2026-06-16T01:00:00Z"),
  },
  {
    homeTeam: "Brazil",
    awayTeam: "Morocco",
    homeTeamFa: "برزیل",
    awayTeamFa: "مراکش",
    homeTeamAr: "البرازيل",
    awayTeamAr: "المغرب",
    stage: "گروه C",
    stageEn: "Group C",
    stageAr: "المجموعة ج",
    kickoffAt: new Date("2026-06-14T01:00:00Z"),
  },
  {
    homeTeam: "France",
    awayTeam: "Senegal",
    homeTeamFa: "فرانسه",
    awayTeamFa: "سنگال",
    homeTeamAr: "فرنسا",
    awayTeamAr: "السنغال",
    stage: "گروه I",
    stageEn: "Group I",
    stageAr: "المجموعة I",
    kickoffAt: new Date("2026-06-17T01:00:00Z"),
  },
  {
    homeTeam: "Argentina",
    awayTeam: "Algeria",
    homeTeamFa: "آرژانتین",
    awayTeamFa: "الجزایر",
    homeTeamAr: "الأرجنتين",
    awayTeamAr: "الجزائر",
    stage: "گروه J",
    stageEn: "Group J",
    stageAr: "المجموعة J",
    kickoffAt: new Date("2026-06-17T19:00:00Z"),
  },
  {
    homeTeam: "England",
    awayTeam: "Croatia",
    homeTeamFa: "انگلیس",
    awayTeamFa: "کرواسی",
    homeTeamAr: "إنجلترا",
    awayTeamAr: "كرواتيا",
    stage: "گروه L",
    stageEn: "Group L",
    stageAr: "المجموعة L",
    kickoffAt: new Date("2026-06-18T01:00:00Z"),
  },
  {
    homeTeam: "Spain",
    awayTeam: "Cape Verde",
    homeTeamFa: "اسپانیا",
    awayTeamFa: "کیپ ورد",
    homeTeamAr: "إسبانيا",
    awayTeamAr: "الرأس الأخضر",
    stage: "گروه H",
    stageEn: "Group H",
    stageAr: "المجموعة H",
    kickoffAt: new Date("2026-06-16T19:00:00Z"),
  },
];

async function main() {
  await prisma.userBadge.deleteMany();
  await prisma.referralClick.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.tournamentPrediction.deleteMany();
  await prisma.tournamentMembership.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.adBanner.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.uiTranslation.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paymentSettings.deleteMany();

  await prisma.user.create({
    data: {
      name: "کاویان",
      phone: "+989120000000",
      isAdmin: true,
      isVip: true,
      referralCode: referralCode(),
    },
  });

  await prisma.user.createMany({
    data: [
      { name: "علی", phone: "+989121111111", referralCode: referralCode() },
      { name: "Sara", phone: "+989122222222", referralCode: referralCode() },
      { name: "رضا", phone: "+989123333333", referralCode: referralCode() },
    ],
  });

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }

  const freeTournament = await prisma.tournament.create({
    data: {
      slug: "kavian-open-league",
      nameFa: "لیگ باز کاویان",
      nameEn: "Kavian Open League",
      nameAr: "دوري كافيان المفتوح",
      descriptionFa: "لیگ رایگان پیش‌بینی برای همه",
      descriptionEn: "Free prediction league for everyone",
      descriptionAr: "دوري توقعات مجاني للجميع",
      isVip: false,
      isActive: true,
    },
  });

  const vipTournament = await prisma.tournament.create({
    data: {
      slug: "kavian-vip-league",
      nameFa: "لیگ VIP کاویان",
      nameEn: "Kavian VIP League",
      nameAr: "دوري كافيان VIP",
      descriptionFa: "لیگ ویژه با جوایز حمایت‌شده",
      descriptionEn: "Premium league with sponsored prizes",
      descriptionAr: "دوري مميز بجوائز برعاية",
      isVip: true,
      isActive: true,
    },
  });

  await prisma.prize.createMany({
    data: [
      {
        tournamentId: freeTournament.id,
        titleFa: "جایزه نفر اول — اسپانسر ورزشی",
        titleEn: "1st place prize — Sports sponsor",
        titleAr: "جائزة المركز الأول — راعٍ رياضي",
        sponsorName: "SportCo",
        rankFrom: 1,
        rankTo: 1,
      },
      {
        tournamentId: vipTournament.id,
        titleFa: "جایزه VIP — کیت تیم ملی",
        titleEn: "VIP prize — National team kit",
        titleAr: "جائزة VIP — طقم المنتخب",
        sponsorName: "FanGear",
        rankFrom: 1,
        rankTo: 3,
      },
    ],
  });

  await prisma.adBanner.create({
    data: {
      title: "World Cup 2026 — Official Fan Zone",
      linkUrl: "https://example.com/fanzone",
      placement: "home_top",
      isActive: true,
      sortOrder: 0,
    },
  });

  await prisma.paymentSettings.create({
    data: {
      id: "default",
      paymentsEnabled: false,
      vipPaymentsEnabled: false,
      providerName: "placeholder",
      currency: "IRR",
      vipPriceLabel: "VIP League Pass",
      notes: "No payment gateway connected yet. Toggle when ready.",
    },
  });

  console.log(
    `Seeded ${matches.length} matches, 2 tournaments, admin (کاویان / 09120000000)`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
