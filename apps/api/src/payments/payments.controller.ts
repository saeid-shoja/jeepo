import { Controller, Get, Inject, Logger, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/custom.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    @Inject('WEB_URL') private readonly webUrl: string,
  ) {}

  @Public()
  @Get('zibal/callback')
  async zibalCallback(
    @Query('trackId') trackId: string,
    @Query('success') success: string,
    @Query('orderId') orderId: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const base = this.webUrl.replace(/\/$/, '');

    try {
      const result = await this.paymentsService.handleZibalCallback({
        trackId,
        success,
        orderId,
        status,
      });

      if (result.ok && result.orderId) {
        return res.redirect(
          `${base}/checkout/success?orderId=${encodeURIComponent(result.orderId)}`,
        );
      }

      const params = new URLSearchParams();
      if (result.orderId) params.set('orderId', result.orderId);
      if (result.reason) params.set('reason', result.reason);
      return res.redirect(`${base}/checkout/failed?${params.toString()}`);
    } catch (err) {
      this.logger.error(`Zibal callback error: ${String(err)}`);
      return res.redirect(`${base}/checkout/failed?reason=server_error`);
    }
  }
}
