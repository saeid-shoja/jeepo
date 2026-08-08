import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { syncDefaultCategories } from './sync-default-categories';

@Injectable()
export class CategoriesBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap(): void {
    // Do not await — Nest runs this hook before the HTTP server listens.
    // Blocking here delayed PORT readiness by ~45–60s and failed health probes.
    setImmediate(() => {
      void this.syncInBackground();
    });
  }

  private async syncInBackground(): Promise<void> {
    try {
      await syncDefaultCategories({
        library: this.prisma.library,
        category: this.prisma.category,
        product: this.prisma.product,
      });
      this.logger.log('Default libraries and categories are ready');
    } catch (err) {
      this.logger.error(
        'Failed to sync default categories — run `pnpm db:deploy` against this DATABASE_URL if tables are missing',
        err,
      );
    }
  }
}
