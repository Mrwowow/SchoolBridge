import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sends SMS via the Termii API (Nigeria).
 * https://developers.termii.com/messaging
 *
 * No-ops when TERMII_API_KEY is unset so local/dev runs don't fail; the
 * message is logged instead. Used for critical alerts (absence, fees, OTP).
 */
@Injectable()
export class SmsSender {
  private readonly logger = new Logger(SmsSender.name);
  private readonly endpoint = 'https://api.ng.termii.com/api/sms/send';

  constructor(private readonly config: ConfigService) {}

  async send(to: string, message: string): Promise<boolean> {
    const apiKey = this.config.get<string>('TERMII_API_KEY');
    const sender = this.config.get<string>('TERMII_SENDER_ID', 'SchoolBrdg');

    if (!apiKey) {
      this.logger.debug(`[SMS stub → ${to}] ${message}`);
      return false;
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: sender,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: apiKey,
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Termii SMS failed for ${to}: ${res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`Termii SMS error for ${to}: ${(err as Error).message}`);
      return false;
    }
  }
}
