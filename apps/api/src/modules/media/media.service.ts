import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import type { PresignUploadDto, PresignUploadResult } from '@schoolbridge/types';

const ALLOWED_PREFIXES = ['image/', 'application/pdf'];

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Cloudinary signed direct uploads. The API never proxies file bytes — it
 * computes an HMAC-style SHA-1 signature for the upload params; the client POSTs
 * the file straight to Cloudinary with that signature and persists the returned
 * secure_url. Disabled (503) when CLOUDINARY_URL is not configured.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly cfg: CloudinaryConfig | null;

  constructor(private readonly config: ConfigService) {
    this.cfg = this.parseUrl(this.config.get<string>('CLOUDINARY_URL'));
    if (!this.cfg) {
      this.logger.warn('CLOUDINARY_URL not configured — media uploads are disabled');
    }
  }

  /** Parse cloudinary://<api_key>:<api_secret>@<cloud_name> */
  private parseUrl(url: string | undefined): CloudinaryConfig | null {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'cloudinary:') return null;
      const apiKey = decodeURIComponent(parsed.username);
      const apiSecret = decodeURIComponent(parsed.password);
      const cloudName = parsed.hostname;
      if (!apiKey || !apiSecret || !cloudName) return null;
      return { cloudName, apiKey, apiSecret };
    } catch {
      return null;
    }
  }

  private require(): CloudinaryConfig {
    if (!this.cfg) {
      throw new ServiceUnavailableException('Media storage is not configured');
    }
    return this.cfg;
  }

  /**
   * Cloudinary signature: sha1 of the alphabetically-sorted signed params
   * (`key=value` joined by `&`) with the api_secret appended. `file`, `api_key`
   * and `resource_type` are NOT signed.
   */
  private sign(params: Record<string, string>, apiSecret: string): string {
    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return createHash('sha1').update(toSign + apiSecret).digest('hex');
  }

  presignUpload(schoolId: string, dto: PresignUploadDto): PresignUploadResult {
    const cfg = this.require();

    if (!ALLOWED_PREFIXES.some((p) => dto.contentType.startsWith(p))) {
      throw new BadRequestException('Only images and PDF attachments are allowed');
    }

    // Date.now() is fine in the app runtime (only restricted in workflow scripts).
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `schoolbridge/${schoolId}`;
    const publicId = randomUUID();

    // Only these params are signed (must match what the client sends, minus file/api_key).
    const signedParams: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp,
    };
    const signature = this.sign(signedParams, cfg.apiSecret);

    return {
      // `auto` lets Cloudinary store images and raw files (PDF) alike.
      uploadUrl: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`,
      fields: {
        ...signedParams,
        api_key: cfg.apiKey,
        signature,
      },
    };
  }
}
