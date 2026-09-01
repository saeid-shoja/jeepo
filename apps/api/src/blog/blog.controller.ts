import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminPermission, Public, Roles } from '../auth/custom.decorator';
import { SWAGGER_BEARER_KEY } from '../swagger';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto, UpdateBlogPostStatusDto } from './dto';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private blogService: BlogService) { }

  @Public()
  @Get('posts')
  findPublished() {
    return this.blogService.findPublished();
  }

  @Public()
  @Get('posts/slugs')
  findPublishedSlugs() {
    return this.blogService.findPublishedSlugs();
  }

  @Public()
  @Get('posts/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findPublishedBySlug(slug);
  }
}

@ApiTags('Admin Blog')
@ApiBearerAuth(SWAGGER_BEARER_KEY)
@Roles('ADMIN')
@Controller('admin/blog/posts')
export class AdminBlogController {
  constructor(private blogService: BlogService) { }

  @AdminPermission('blog')
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED',
  ) {
    return this.blogService.findAllAdmin({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
    });
  }

  @AdminPermission('blog')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findByIdAdmin(id);
  }

  @AdminPermission('blog')
  @Post()
  create(@Body() body: CreateBlogPostDto) {
    return this.blogService.create(body);
  }

  @AdminPermission('blog')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBlogPostDto) {
    return this.blogService.update(id, body);
  }

  @AdminPermission('blog')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateBlogPostStatusDto) {
    return this.blogService.updateStatus(id, body.status);
  }

  @AdminPermission('blog')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
