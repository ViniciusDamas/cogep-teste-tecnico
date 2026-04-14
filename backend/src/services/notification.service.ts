import axios from 'axios';
import { env } from '../config/env';

export interface NotificationPayload {
  to: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
  errorCode?: number;
  usedFormat?: string;
}

interface Provider {
  send(payload: NotificationPayload): Promise<SendResult>;
  name: string;
}

function normalizePhoneBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.startsWith('+')) return digits;
  return `+${digits}`;
}

/**
 * Drops the leading 9 of a mobile number after the country code + DDD.
 * Used as a fallback for legacy Brazilian WhatsApp accounts registered before
 * the ANATEL 2012 change (+55 DDD 9XXXXXXXX → +55 DDD XXXXXXXX).
 * Returns null if the number is not in the new 13-digit mobile format.
 */
function legacyMobileBR(e164: string): string | null {
  const m = /^\+55(\d{2})9(\d{8})$/.exec(e164);
  if (!m) return null;
  return `+55${m[1]}${m[2]}`;
}

// Twilio WhatsApp sandbox error code for "recipient not in 24h conversation window
// or not an opted-in participant" — used as the signal to retry with legacy format.
const TWILIO_NOT_REACHABLE = 63015;

class MockProvider implements Provider {
  name = 'mock';
  async send(payload: NotificationPayload) {
    console.log(`[notification:mock] → ${payload.to}\n${payload.message}`);
    return { ok: true, id: `mock-${Date.now()}`, usedFormat: payload.to };
  }
}

class TwilioProvider implements Provider {
  name = 'twilio';
  constructor(
    private accountSid: string,
    private authToken: string,
    private from: string,
  ) {}

  private baseUrl(): string {
    return `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages`;
  }

  private authConfig() {
    return {
      auth: { username: this.accountSid, password: this.authToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000,
    };
  }

  /**
   * Sends and waits up to ~4s for a terminal status. Twilio WhatsApp failures
   * (like 63015 "recipient not reachable") arrive asynchronously AFTER the POST,
   * so we poll the Messages/{sid}.json resource briefly to surface them.
   */
  private async attempt(to: string, message: string): Promise<SendResult> {
    let sid: string;
    try {
      const body = new URLSearchParams({
        From: this.from,
        To: `whatsapp:${to}`,
        Body: message,
      });
      const { data } = await axios.post(`${this.baseUrl()}.json`, body, this.authConfig());
      sid = data.sid;
      console.log(`[notification:twilio] queued sid=${sid} to=${to}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const code = Number(err.response?.data?.code);
        const msg = err.response?.data?.message ?? err.message;
        console.warn(`[notification:twilio] POST failed to=${to} code=${code} msg=${msg}`);
        return { ok: false, error: msg, errorCode: code };
      }
      return { ok: false, error: 'unknown' };
    }

    // Poll for terminal status — failures like 63015 arrive async.
    const terminal = new Set(['delivered', 'read', 'sent', 'failed', 'undelivered']);
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const { data } = await axios.get(`${this.baseUrl()}/${sid}.json`, this.authConfig());
        if (terminal.has(data.status)) {
          const ok = ['sent', 'delivered', 'read'].includes(data.status);
          const code = data.error_code ? Number(data.error_code) : undefined;
          console.log(
            `[notification:twilio] terminal sid=${sid} status=${data.status}${code ? ' code=' + code : ''}`,
          );
          return {
            ok,
            id: sid,
            error: data.error_message ?? undefined,
            errorCode: code,
            usedFormat: to,
          };
        }
      } catch (err) {
        const msg = axios.isAxiosError(err) ? err.message : 'unknown';
        console.warn(`[notification:twilio] polling error sid=${sid}: ${msg} — retrying`);
      }
    }

    // Still pending after ~4s — treat as success (in-flight).
    console.log(`[notification:twilio] still pending sid=${sid} — treating as success`);
    return { ok: true, id: sid, usedFormat: to };
  }

  async send(payload: NotificationPayload): Promise<SendResult> {
    const first = await this.attempt(payload.to, payload.message);
    if (first.ok) return first;

    if (first.errorCode === TWILIO_NOT_REACHABLE) {
      const fallback = legacyMobileBR(payload.to);
      if (fallback && fallback !== payload.to) {
        console.log(
          `[notification:twilio] retrying with legacy BR format ${payload.to} → ${fallback}`,
        );
        const retry = await this.attempt(fallback, payload.message);
        if (retry.ok) {
          console.log(
            `[notification:twilio] legacy format succeeded — consider updating stored number to ${fallback}`,
          );
        }
        return retry;
      }
    }
    return first;
  }
}

function buildProvider(): Provider {
  if (!env.NOTIFICATIONS_ENABLED) return new MockProvider();
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    return new TwilioProvider(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_AUTH_TOKEN,
      env.TWILIO_WHATSAPP_FROM,
    );
  }
  console.warn(
    '[notification] NOTIFICATIONS_ENABLED=true but Twilio creds missing — falling back to mock',
  );
  return new MockProvider();
}

const provider = buildProvider();

console.log(`[notification] provider=${provider.name} enabled=${env.NOTIFICATIONS_ENABLED}`);

export async function notify(phoneRaw: string, message: string, context?: Record<string, unknown>) {
  const to = normalizePhoneBR(phoneRaw);
  if (!to) {
    console.warn('[notification] invalid phone, skipping', { phoneRaw });
    return { ok: false, error: 'invalid phone' };
  }
  return provider.send({ to, message, context });
}

export function buildStageChangeMessage(opts: {
  personName: string;
  protocol: string;
  fromStage: string;
  toStage: string;
}): string {
  const url = `${env.PUBLIC_APP_URL}/consulta/${opts.protocol}`;
  return [
    `Olá ${opts.personName}!`,
    '',
    `Seu processo de regularização fundiária ${opts.protocol} avançou de etapa:`,
    `▸ De: ${opts.fromStage}`,
    `▸ Para: ${opts.toStage}`,
    '',
    `Acompanhe em: ${url}`,
    '',
    'COGEP — Companhia de Geotecnologias do Paraná',
  ].join('\n');
}
