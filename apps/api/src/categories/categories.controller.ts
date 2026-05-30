import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public, Roles } from '../auth/custom.decorator';
import type { CategoriesService } from './categories.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.categoriesService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Roles('ADMIN')
  @Post('seed')
  seed() {
    return this.categoriesService.seed();
  }
}
