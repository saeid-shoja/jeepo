import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { syncDefaultCategories } from './sync-default-categories';

@Injectable()
export class CategoriesBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
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
