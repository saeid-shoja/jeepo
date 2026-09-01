import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  type BlogPost,
  type BlogPostAdmin,
  estimateReadingMinutesFromHtml,
  normalizeBlogSlug,
} from '@offroad/shared';
import type { BlogPostStatus, Prisma } from '../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBlogPostDto, UpdateBlogPostDto } from './dto';

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  bodyJson: Prisma.JsonValue | null;
  coverImage: string;
  tags: string[];
  status: BlogPostStatus;
  readingMinutes: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) { }

  private mapPublic(row: BlogRow): BlogPost {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      coverImage: row.coverImage,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      readingMinutes: row.readingMinutes,
      tags: row.tags,
      bodyHtml: row.bodyHtml,
    };
  }

  private mapAdmin(row: BlogRow): BlogPostAdmin {
    return {
      ...this.mapPublic(row),
      status: row.status,
      bodyJson: (row.bodyJson as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async findPublished(): Promise<BlogPost[]> {
    const rows = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => this.mapPublic(row));
  }

  async findPublishedBySlug(slug: string): Promise<BlogPost | null> {
    const row = await this.prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
    return row ? this.mapPublic(row) : null;
  }

  async findPublishedSlugs(): Promise<string[]> {
    const rows = await this.prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
      orderBy: [{ publishedAt: 'desc' }],
    });
    return rows.map((r) => r.slug);
  }

  async findAllAdmin(params: { page?: number; limit?: number; status?: BlogPostStatus }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 20));
    const where: Prisma.BlogPostWhereInput = params.status ? { status: params.status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      posts: rows.map((row) => this.mapAdmin(row)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findByIdAdmin(id: string): Promise<BlogPostAdmin> {
    const row = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('مقاله یافت نشد');
    return this.mapAdmin(row);
  }

  async create(data: CreateBlogPostDto): Promise<BlogPostAdmin> {
    const slug = normalizeBlogSlug(data.slug);
    if (!slug) throw new BadRequestException('اسلاگ معتبر نیست');

    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('این اسلاگ قبلاً استفاده شده است');

    const status = data.status ?? 'DRAFT';
    const readingMinutes = estimateReadingMinutesFromHtml(data.bodyHtml);
    const now = new Date();

    const row = await this.prisma.blogPost.create({
      data: {
        slug,
        title: data.title.trim(),
        excerpt: data.excerpt.trim(),
        bodyHtml: data.bodyHtml,
        bodyJson: (data.bodyJson as Prisma.InputJsonValue) ?? undefined,
        coverImage: data.coverImage.trim(),
        tags: data.tags ?? [],
        status,
        readingMinutes,
        publishedAt: status === 'PUBLISHED' ? now : null,
      },
    });

    return this.mapAdmin(row);
  }

  async update(id: string, data: UpdateBlogPostDto): Promise<BlogPostAdmin> {
    const current = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('مقاله یافت نشد');

    let slug = current.slug;
    if (data.slug != null) {
      slug = normalizeBlogSlug(data.slug);
      if (!slug) throw new BadRequestException('اسلاگ معتبر نیست');
      if (slug !== current.slug) {
        const taken = await this.prisma.blogPost.findUnique({ where: { slug } });
        if (taken) throw new BadRequestException('این اسلاگ قبلاً استفاده شده است');
      }
    }

    const bodyHtml = data.bodyHtml ?? current.bodyHtml;
    const nextStatus = data.status ?? current.status;
    const wasPublished = current.status === 'PUBLISHED';
    const willPublish = nextStatus === 'PUBLISHED';

    let publishedAt = current.publishedAt;
    if (willPublish && !wasPublished) {
      publishedAt = new Date();
    } else if (!willPublish) {
      publishedAt = null;
    }

    const row = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title.trim() } : {}),
        slug,
        ...(data.excerpt != null ? { excerpt: data.excerpt.trim() } : {}),
        ...(data.bodyHtml != null ? { bodyHtml: data.bodyHtml } : {}),
        ...(data.bodyJson !== undefined
          ? { bodyJson: (data.bodyJson as Prisma.InputJsonValue) ?? undefined }
          : {}),
        ...(data.coverImage != null ? { coverImage: data.coverImage.trim() } : {}),
        ...(data.tags != null ? { tags: data.tags } : {}),
        status: nextStatus,
        readingMinutes: estimateReadingMinutesFromHtml(bodyHtml),
        publishedAt,
      },
    });

    return this.mapAdmin(row);
  }

  async updateStatus(id: string, status: BlogPostStatus): Promise<BlogPostAdmin> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const current = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('مقاله یافت نشد');
    await this.prisma.blogPost.delete({ where: { id } });
    return { deleted: true };
  }
}
