import { Module } from '@nestjs/common';
import { CategoriesController, LibrariesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesBootstrapService } from './categories-bootstrap.service';

@Module({
  controllers: [CategoriesController, LibrariesController],
  providers: [CategoriesService, CategoriesBootstrapService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
