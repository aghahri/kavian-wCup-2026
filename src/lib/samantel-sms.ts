import { randomUUID } from "crypto";
import { normalizeSmsRecipient } from "@/lib/phone";

const SAMANTEL_URL = "https://sms.samantel.ir/services/rest/index.php";

export type SamantelSendResult = {
  customerId: string;
  serverId: string | null;
  providerStatus: string;
  ok: boolean;
};

type SamantelMessageResponse = {
  customerId?: string;
  serverId?: string;
  status?: string | number;
  message?: string;
};

type SamantelApiResponse = {
  status?: string | number;
  message?: string;
  messages?: SamantelMessageResponse[];
  data?: {
    messages?: SamantelMessageResponse[];
  };
};

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
    return {
      customerId,
      serverId: null,
      providerStatus: "missing_credentials",
      ok: false,
    };
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let parsed: SamantelApiResponse = {};

    try {
      parsed = JSON.parse(raw) as SamantelApiResponse;
    } catch {
      parsed = { status: response.status, message: raw.slice(0, 200) };
    }

    const messageResult =
      parsed.messages?.[0] ?? parsed.data?.messages?.[0] ?? ({} as SamantelMessageResponse);

    const providerStatus = String(
      messageResult.status ?? parsed.status ?? (response.ok ? "sent" : "error")
    );
    const serverId = messageResult.serverId ? String(messageResult.serverId) : null;
    const ok =
      response.ok &&
      !["error", "failed", "0", "false"].includes(providerStatus.toLowerCase());

    return {
      customerId: messageResult.customerId ?? customerId,
      serverId,
      providerStatus,
      ok,
    };
  } catch {
    return {
      customerId,
      serverId: null,
      providerStatus: "network_error",
      ok: false,
    };
  }
}
