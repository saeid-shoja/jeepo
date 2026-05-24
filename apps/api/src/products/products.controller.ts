import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Public } from '../auth/custom.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Public()
  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('cities') cities?: string,
    @Query('carBrand') carBrand?: string,
    @Query('sortBy') sortBy?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('postedWithin') postedWithin?: string,
  ) {
    return this.productsService.findAll({
      type,
      categoryId,
      carBrand,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      city,
      cities: cities
        ? cities.split(',').map((c) => c.trim()).filter(Boolean)
        : undefined,
      sortBy,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      postedWithin,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() body: any, @Request() req: { user: { userId: string } }) {
    return this.productsService.create(body, req.user.userId);
  }

  @Post('public')
  createPublic(@Body() body: any, @Request() req: { user: { userId: string } }) {
    return this.productsService.create({ ...body, type: 'CLIENT' }, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.productsService.update(id, body, req.user.userId, req.user.role);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.productsService.remove(id, req.user.userId, req.user.role);
  }
}
