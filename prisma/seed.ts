import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const matches = [
  {
    homeTeam: "Mexico",
    awayTeam: "South Africa",
    homeTeamFa: "مکزیک",
    awayTeamFa: "آفریقای جنوبی",
    stage: "گروه A",
    kickoffAt: new Date("2026-06-11T19:00:00Z"),
  },
  {
    homeTeam: "South Korea",
    awayTeam: "UEFA Playoff D",
    homeTeamFa: "کره جنوبی",
    awayTeamFa: "برنده پلی‌آف یوفا D",
    stage: "گروه A",
    kickoffAt: new Date("2026-06-12T02:00:00Z"),
  },
  {
    homeTeam: "Canada",
    awayTeam: "UEFA Playoff A",
    homeTeamFa: "کانادا",
    awayTeamFa: "برنده پلی‌آف یوفا A",
    stage: "گروه B",
    kickoffAt: new Date("2026-06-13T01:00:00Z"),
  },
  {
    homeTeam: "USA",
    awayTeam: "Paraguay",
    homeTeamFa: "آمریکا",
    awayTeamFa: "پاراگوئه",
    stage: "گروه D",
    kickoffAt: new Date("2026-06-13T01:00:00Z"),
  },
  {
    homeTeam: "Qatar",
    awayTeam: "Switzerland",
    homeTeamFa: "قطر",
    awayTeamFa: "سوئیس",
    stage: "گروه B",
    kickoffAt: new Date("2026-06-13T19:00:00Z"),
  },
  {
    homeTeam: "Brazil",
    awayTeam: "Morocco",
    homeTeamFa: "برزیل",
    awayTeamFa: "مراکش",
    stage: "گروه C",
    kickoffAt: new Date("2026-06-14T01:00:00Z"),
  },
  {
    homeTeam: "Haiti",
    awayTeam: "Scotland",
    homeTeamFa: "هائیتی",
    awayTeamFa: "اسکاتلند",
    stage: "گروه C",
    kickoffAt: new Date("2026-06-14T01:00:00Z"),
  },
  {
    homeTeam: "Australia",
    awayTeam: "UEFA Playoff C",
    homeTeamFa: "استرالیا",
    awayTeamFa: "برنده پلی‌آف یوفا C",
    stage: "گروه D",
    kickoffAt: new Date("2026-06-14T01:00:00Z"),
  },
  {
    homeTeam: "Germany",
    awayTeam: "Curaçao",
    homeTeamFa: "آلمان",
    awayTeamFa: "کوراسائو",
    stage: "گروه E",
    kickoffAt: new Date("2026-06-15T01:00:00Z"),
  },
  {
    homeTeam: "Netherlands",
    awayTeam: "Japan",
    homeTeamFa: "هلند",
    awayTeamFa: "ژاپن",
    stage: "گروه F",
    kickoffAt: new Date("2026-06-15T01:00:00Z"),
  },
  {
    homeTeam: "Ivory Coast",
    awayTeam: "Ecuador",
    homeTeamFa: "ساحل عاج",
    awayTeamFa: "اکوادور",
    stage: "گروه F",
    kickoffAt: new Date("2026-06-15T19:00:00Z"),
  },
  {
    homeTeam: "Iran",
    awayTeam: "New Zealand",
    homeTeamFa: "ایران",
    awayTeamFa: "نیوزیلند",
    stage: "گروه G",
    kickoffAt: new Date("2026-06-16T01:00:00Z"),
  },
  {
    homeTeam: "Belgium",
    awayTeam: "Egypt",
    homeTeamFa: "بلژیک",
    awayTeamFa: "مصر",
    stage: "گروه G",
    kickoffAt: new Date("2026-06-16T01:00:00Z"),
  },
  {
    homeTeam: "Spain",
    awayTeam: "Cape Verde",
    homeTeamFa: "اسپانیا",
    awayTeamFa: "کیپ ورد",
    stage: "گروه H",
    kickoffAt: new Date("2026-06-16T19:00:00Z"),
  },
  {
    homeTeam: "Saudi Arabia",
    awayTeam: "Uruguay",
    homeTeamFa: "عربستان",
    awayTeamFa: "اروگوئه",
    stage: "گروه H",
    kickoffAt: new Date("2026-06-16T19:00:00Z"),
  },
  {
    homeTeam: "France",
    awayTeam: "Senegal",
    homeTeamFa: "فرانسه",
    awayTeamFa: "سنگال",
    stage: "گروه I",
    kickoffAt: new Date("2026-06-17T01:00:00Z"),
  },
  {
    homeTeam: "Argentina",
    awayTeam: "Algeria",
    homeTeamFa: "آرژانتین",
    awayTeamFa: "الجزایر",
    stage: "گروه J",
    kickoffAt: new Date("2026-06-17T19:00:00Z"),
  },
  {
    homeTeam: "Austria",
    awayTeam: "Jordan",
    homeTeamFa: "اتریش",
    awayTeamFa: "اردن",
    stage: "گروه J",
    kickoffAt: new Date("2026-06-17T19:00:00Z"),
  },
  {
    homeTeam: "Portugal",
    awayTeam: "UEFA Playoff B",
    homeTeamFa: "پرتغال",
    awayTeamFa: "برنده پلی‌آف یوفا B",
    stage: "گروه K",
    kickoffAt: new Date("2026-06-18T01:00:00Z"),
  },
  {
    homeTeam: "England",
    awayTeam: "Croatia",
    homeTeamFa: "انگلیس",
    awayTeamFa: "کرواسی",
    stage: "گروه L",
    kickoffAt: new Date("2026-06-18T01:00:00Z"),
  },
];

async function main() {
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "کاویان",
      phone: "09120000000",
      isAdmin: true,
    },
  });

  await prisma.user.createMany({
    data: [
      { name: "علی", phone: "09121111111" },
      { name: "سارا", phone: "09122222222" },
      { name: "رضا", phone: "09123333333" },
    ],
  });

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }

  console.log(`Seeded ${matches.length} matches and admin user (کاویان / 09120000000)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
