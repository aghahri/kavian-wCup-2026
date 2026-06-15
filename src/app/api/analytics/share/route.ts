import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/api-headers";

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "share-analytics.jsonl");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = String(body.event ?? "");
    if (event !== "share_shokoofaloo") {
      return NextResponse.json({ error: "INVALID" }, { status: 400, headers: NO_STORE_HEADERS });
    }

    const record = {
      event,
      source: String(body.source ?? "share_toolbar"),
      page: String(body.page ?? ""),
      locale: String(body.locale ?? ""),
      at: new Date().toISOString(),
    };

    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(LOG_FILE, `${JSON.stringify(record)}\n`, "utf8");

    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
  }
}
