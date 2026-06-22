import { Injectable, Logger } from '@nestjs/common';

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

export interface PushResult {
  sent: number;
  failed: number;
  /** Tokens that Expo rejected (failed ticket) — caller may mark/prune these. */
  failedTokens: string[];
  /** Tokens Expo reports as no longer valid (DeviceNotRegistered) — prune. */
  unregisteredTokens: string[];
}

/** Expo accepts at most 100 messages per request. */
const EXPO_BATCH_SIZE = 100;

/**
 * Sends push notifications via the Expo Push API.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * Uses the global fetch (Node 22) so no SDK dependency is required.
 * Invalid/empty token lists are skipped silently. Requests are chunked to
 * Expo's 100-message limit and per-message tickets are inspected so a single
 * bad token doesn't mark the whole batch as failed.
 */
@Injectable()
export class PushSender {
  private readonly logger = new Logger(PushSender.name);
  private readonly endpoint = 'https://exp.host/--/api/v2/push/send';

  async send(messages: ExpoMessage[]): Promise<PushResult> {
    const valid = messages.filter((m) => m.to.startsWith('ExponentPushToken'));
    const result: PushResult = { sent: 0, failed: 0, failedTokens: [], unregisteredTokens: [] };
    if (valid.length === 0) return result;

    for (let i = 0; i < valid.length; i += EXPO_BATCH_SIZE) {
      const chunk = valid.slice(i, i + EXPO_BATCH_SIZE);
      await this.sendChunk(chunk, result);
    }
    return result;
  }

  private async sendChunk(chunk: ExpoMessage[], result: PushResult): Promise<void> {
    try {
      const res: { ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> } =
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

      if (!res.ok) {
        this.logger.warn(`Expo push failed: ${res.status} ${await res.text()}`);
        result.failed += chunk.length;
        result.failedTokens.push(...chunk.map((m) => m.to));
        return;
      }

      // Expo returns one ticket per message, in request order.
      const json = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];
      chunk.forEach((msg, idx) => {
        const ticket = tickets[idx];
        if (ticket && ticket.status === 'ok') {
          result.sent += 1;
        } else {
          result.failed += 1;
          result.failedTokens.push(msg.to);
          if (ticket?.details?.error === 'DeviceNotRegistered') {
            result.unregisteredTokens.push(msg.to);
          }
        }
      });
    } catch (err) {
      this.logger.warn(`Expo push error: ${(err as Error).message}`);
      result.failed += chunk.length;
      result.failedTokens.push(...chunk.map((m) => m.to));
    }
  }
}
