import { Inject, Injectable, Logger } from '@nestjs/common';

const ZIBAL_BASE = 'https://gateway.zibal.ir';

/** Shop prices are Toman; Zibal expects Rial (×10). */
export function tomanToRial(toman: number): number {
  return Math.round(toman * 10);
}

export type ZibalRequestPayload = {
  merchant: string;
  amount: number;
  callbackUrl: string;
  description?: string;
  orderId?: string;
  mobile?: string;
};

export type ZibalRequestResponse = {
  trackId?: number;
  result: number;
  message: string;
};

export type ZibalVerifyResponse = {
  paidAt?: string;
  cardNumber?: string;
  status?: number;
  amount?: number;
  refNumber?: number;
  description?: string;
  orderId?: string;
  result: number;
  message: string;
};

@Injectable()
export class ZibalService {
  private readonly logger = new Logger(ZibalService.name);

  constructor(@Inject('ZIBAL_MERCHANT') private readonly merchant: string) {}

  getStartUrl(trackId: number | string): string {
    return `${ZIBAL_BASE}/start/${trackId}`;
  }

  async requestPayment(payload: Omit<ZibalRequestPayload, 'merchant'>): Promise<ZibalRequestResponse> {
    const body: ZibalRequestPayload = {
      merchant: this.merchant,
      ...payload,
    };

    const res = await fetch(`${ZIBAL_BASE}/v1/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as ZibalRequestResponse;
    if (!res.ok) {
      this.logger.warn(`Zibal request HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
  }

  async verifyPayment(trackId: number | string): Promise<ZibalVerifyResponse> {
    const res = await fetch(`${ZIBAL_BASE}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant: this.merchant,
        trackId: Number(trackId),
      }),
    });

    const data = (await res.json()) as ZibalVerifyResponse;
    if (!res.ok) {
      this.logger.warn(`Zibal verify HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
  }
}
