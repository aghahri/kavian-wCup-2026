import { randomUUID } from "crypto";
import { maskPhone, normalizeSmsRecipient } from "@/lib/phone";

const SAMANTEL_URL = "https://sms.samantel.ir/services/rest/index.php";

export type SamantelSendResult = {
  called: boolean;
  customerId: string;
  serverId: string | null;
  providerStatus: string;
  httpStatus: number;
  ok: boolean;
};

type SamantelMessageResponse = {
  customerId?: string;
  serverId?: string | number;
  status?: string | number;
  message?: string;
  error?: string | number;
};

type SamantelApiResponse = {
  status?: string | number;
  message?: string;
  error?: string | number;
  messages?: SamantelMessageResponse[];
  data?: {
    messages?: SamantelMessageResponse[];
    status?: string | number;
  };
  result?: SamantelMessageResponse | SamantelMessageResponse[];
};

function isSuccessStatus(status: string | number | undefined): boolean {
  if (status === undefined || status === null || status === "") return false;
  const normalized = String(status).trim().toLowerCase();
  if (["error", "failed", "false", "0", "-1", "no"].includes(normalized)) {
    return false;
  }
  if (["1", "ok", "success", "sent", "true", "200", "accepted"].includes(normalized)) {
    return true;
  }
  const numeric = Number(status);
  return Number.isFinite(numeric) && numeric > 0;
}

function buildProviderStatus(
  httpStatus: number,
  messageStatus: string | number | undefined,
  topStatus: string | number | undefined,
  serverId: string | null
): string {
  const parts = [`http:${httpStatus}`];
  if (messageStatus !== undefined) parts.push(`msgStatus:${messageStatus}`);
  if (topStatus !== undefined) parts.push(`topStatus:${topStatus}`);
  if (serverId) parts.push(`serverId:${serverId}`);
  return parts.join("|");
}

export function logSamantelResult(input: {
  recipient: string;
  httpStatus: number;
  serverId: string | null;
  providerStatus: string;
  ok: boolean;
  called: boolean;
}): void {
  console.info(
    "[samantel-sms]",
    JSON.stringify({
      called: input.called,
      recipient: maskPhone(input.recipient),
      httpStatus: input.httpStatus,
      serverId: input.serverId,
      providerStatus: input.providerStatus,
      ok: input.ok,
    })
  );
}

export async function sendSamantelSms(
  phone: string,
  body: string
): Promise<SamantelSendResult> {
  const username = process.env.SAMANTEL_SMS_USERNAME ?? "";
  const password = process.env.SAMANTEL_SMS_PASSWORD ?? "";
  const sender = process.env.SAMANTEL_SMS_SENDER ?? "";
  const customerId = randomUUID();
  const recipient = normalizeSmsRecipient(phone);

  if (!username || !password || !sender) {
    const providerStatus = "missing_credentials";
    const result: SamantelSendResult = {
      called: false,
      customerId,
      serverId: null,
      providerStatus,
      httpStatus: 0,
      ok: false,
    };
    logSamantelResult({
      recipient: phone,
      httpStatus: 0,
      serverId: null,
      providerStatus,
      ok: false,
      called: false,
    });
    return result;
  }

  const payload = {
    username,
    password,
    method: "send",
    messages: [
      {
        sender,
        recipient,
        body,
        customerId,
      },
    ],
  };

  try {
    const response = await fetch(SAMANTEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const httpStatus = response.status;
    const raw = await response.text();
    let parsed: SamantelApiResponse = {};

    try {
      parsed = JSON.parse(raw) as SamantelApiResponse;
    } catch {
      parsed = { status: httpStatus, message: raw.slice(0, 200) };
    }

    const messageResult =
      parsed.messages?.[0] ??
      (Array.isArray(parsed.result) ? parsed.result[0] : parsed.result) ??
      parsed.data?.messages?.[0] ??
      ({} as SamantelMessageResponse);

    const messageStatus = messageResult.status ?? messageResult.error;
    const topStatus = parsed.status ?? parsed.error ?? parsed.data?.status;
    const serverId = messageResult.serverId != null ? String(messageResult.serverId) : null;

    const ok =
      isSuccessStatus(messageStatus) ||
      isSuccessStatus(topStatus) ||
      (response.ok && Boolean(serverId));

    const providerStatus = buildProviderStatus(httpStatus, messageStatus, topStatus, serverId);

    const result: SamantelSendResult = {
      called: true,
      customerId: messageResult.customerId ?? customerId,
      serverId,
      providerStatus,
      httpStatus,
      ok,
    };

    logSamantelResult({
      recipient: phone,
      httpStatus,
      serverId,
      providerStatus,
      ok,
      called: true,
    });

    return result;
  } catch (error) {
    const providerStatus = `network_error:${error instanceof Error ? error.name : "unknown"}`;
    const result: SamantelSendResult = {
      called: true,
      customerId,
      serverId: null,
      providerStatus,
      httpStatus: 0,
      ok: false,
    };
    logSamantelResult({
      recipient: phone,
      httpStatus: 0,
      serverId: null,
      providerStatus,
      ok: false,
      called: true,
    });
    return result;
  }
}
