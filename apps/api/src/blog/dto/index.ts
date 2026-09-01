import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { BlogPostStatus } from '../../prisma/generated/client';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  excerpt!: string;

  @IsString()
  @IsNotEmpty()
  bodyHtml!: string;

  @IsOptional()
  bodyJson?: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  coverImage!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'] as const)
  status?: BlogPostStatus;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  bodyHtml?: string;

  @IsOptional()
  bodyJson?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'] as const)
  status?: BlogPostStatus;
}

export class UpdateBlogPostStatusDto {
  @IsEnum(['DRAFT', 'PUBLISHED'] as const)
  status!: BlogPostStatus;
}
