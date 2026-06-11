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

type SamantelDataItem = {
  serverId?: string | number;
  customerId?: string | number;
  Mobile?: string;
};

type SamantelApiResponse = {
  code?: number;
  message?: string;
  data?: SamantelDataItem[];
};

function buildProviderStatus(
  called: boolean,
  httpStatus: number,
  code: number | undefined,
  serverId: string | null
): string {
  const parts = [`called:${called ? "yes" : "no"}`, `http:${httpStatus}`];
  if (code !== undefined) parts.push(`code:${code}`);
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
  const requestCustomerId = randomUUID();
  const recipient = normalizeSmsRecipient(phone);

  if (!username || !password || !sender) {
    const providerStatus = "called:no|missing_credentials";
    const result: SamantelSendResult = {
      called: false,
      customerId: requestCustomerId,
      serverId: null,
      providerStatus,
      httpStatus: 0,
      ok: false,
    };
    logSamantelResult({
      recipient: phone,
      httpStatus: 0,
      serverId: null,
      providerStatus: result.providerStatus,
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
        customerId: requestCustomerId,
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
      const providerStatus = `called:yes|http:${httpStatus}|code:parse_error`;
      const result: SamantelSendResult = {
        called: true,
        customerId: requestCustomerId,
        serverId: null,
        providerStatus,
        httpStatus,
        ok: false,
      };
      logSamantelResult({
        recipient: phone,
        httpStatus,
        serverId: null,
        providerStatus,
        ok: false,
        called: true,
      });
      return result;
    }

    const first = parsed.data?.[0];
    const serverId = first?.serverId != null ? String(first.serverId) : null;
    const customerId =
      first?.customerId != null ? String(first.customerId) : requestCustomerId;

    const ok =
      httpStatus === 200 && parsed.code === 200 && first?.serverId != null;

    const providerStatus = buildProviderStatus(true, httpStatus, parsed.code, serverId);

    const result: SamantelSendResult = {
      called: true,
      customerId,
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
    const providerStatus = `called:yes|network_error:${error instanceof Error ? error.name : "unknown"}`;
    const result: SamantelSendResult = {
      called: true,
      customerId: requestCustomerId,
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
