import { randomUUID } from "crypto";
import { maskPhone, maskSmsRecipient } from "@/lib/phone";

const SAMANTEL_URL = "https://sms.samantel.ir/services/rest/index.php";
const SMS_RECIPIENT_PATTERN = /^98\d{10}$/;

export type SamantelSendResult = {
  called: boolean;
  customerId: string;
  serverId: string | null;
  providerStatus: string;
  httpStatus: number;
  ok: boolean;
};

export type SendSamantelSmsParams = {
  /** Must already be 989XXXXXXXXX */
  recipient: string;
  /** Domestic/display phone for logging only (09XXXXXXXXX) */
  inputPhone: string;
  body: string;
};

type SamantelDataItem = {
  serverId?: string | number;
  ServerId?: string | number;
  customerId?: string | number;
  CustomerId?: string | number;
  Mobile?: string;
};

type SamantelApiResponse = {
  code?: number | string;
  message?: string;
  data?: SamantelDataItem[] | SamantelDataItem;
};

function normalizeDataArray(data: SamantelApiResponse["data"]): SamantelDataItem[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

function readServerId(item: SamantelDataItem | undefined): string | null {
  if (!item) return null;
  const rawServerId = item.serverId ?? item.ServerId;
  return rawServerId == null ? null : String(rawServerId);
}

function readCustomerId(item: SamantelDataItem | undefined): string | null {
  if (!item) return null;
  const raw = item.customerId ?? item.CustomerId;
  return raw == null ? null : String(raw);
}

function normalizeParsedCode(code: number | string | undefined): number | undefined {
  if (code === undefined || code === null || code === "") return undefined;
  const numeric = Number(code);
  return Number.isFinite(numeric) ? numeric : undefined;
}

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
  inputPhone: string;
  recipient: string;
  httpStatus: number;
  parsedCode?: number;
  parsedDataLength?: number;
  serverId: string | null;
  providerStatus: string;
  ok: boolean;
  called: boolean;
}): void {
  console.info(
    "[samantel-sms]",
    JSON.stringify({
      called: input.called,
      inputPhoneMasked: maskPhone(input.inputPhone),
      normalizedRecipientMasked: maskSmsRecipient(input.recipient),
      httpStatus: input.httpStatus,
      parsedCode: input.parsedCode ?? null,
      parsedDataLength: input.parsedDataLength ?? 0,
      serverId: input.serverId,
      providerStatus: input.providerStatus,
      ok: input.ok,
    })
  );
}

export async function sendSamantelSms(
  params: SendSamantelSmsParams
): Promise<SamantelSendResult> {
  const { recipient, inputPhone, body } = params;
  const requestCustomerId = randomUUID();

  if (!SMS_RECIPIENT_PATTERN.test(recipient)) {
    const providerStatus = "called:no|invalid_recipient_format";
    const result: SamantelSendResult = {
      called: false,
      customerId: requestCustomerId,
      serverId: null,
      providerStatus,
      httpStatus: 0,
      ok: false,
    };
    logSamantelResult({
      inputPhone,
      recipient,
      httpStatus: 0,
      serverId: null,
      providerStatus,
      ok: false,
      called: false,
    });
    return result;
  }

  const username = process.env.SAMANTEL_SMS_USERNAME ?? "";
  const password = process.env.SAMANTEL_SMS_PASSWORD ?? "";
  const sender = process.env.SAMANTEL_SMS_SENDER ?? "";

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
      inputPhone,
      recipient,
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
        inputPhone,
        recipient,
        httpStatus,
        serverId: null,
        providerStatus,
        ok: false,
        called: true,
      });
      return result;
    }

    const dataItems = normalizeDataArray(parsed.data);
    const dataLength = dataItems.length;
    const first = dataItems[0];
    const serverId = readServerId(first);
    const customerId = readCustomerId(first) ?? requestCustomerId;
    const parsedCode = normalizeParsedCode(parsed.code);

    const ok = httpStatus === 200 && parsedCode === 200 && !!serverId;

    const providerStatus = buildProviderStatus(true, httpStatus, parsedCode, serverId);

    const result: SamantelSendResult = {
      called: true,
      customerId,
      serverId,
      providerStatus,
      httpStatus,
      ok,
    };

    logSamantelResult({
      inputPhone,
      recipient,
      httpStatus,
      parsedCode,
      parsedDataLength: dataLength,
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
      inputPhone,
      recipient,
      httpStatus: 0,
      serverId: null,
      providerStatus,
      ok: false,
      called: true,
    });
    return result;
  }
}
