import {
  estimateReadingMinutesFromHtml,
  paragraphsToBlogHtml,
  paragraphsToTiptapDoc,
} from '@offroad/shared';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { syncDefaultCategories } from '../src/categories/sync-default-categories';
import { PrismaClient } from '../src/prisma/generated/client';
import { BLOG_SEED_POSTS } from './blog-seed-posts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  await syncDefaultCategories({
    library: prisma.library,
    category: prisma.category,
    product: prisma.product,
  });

  const adminExists = await prisma.user.findUnique({ where: { phone: '09333092013' } });
  if (!adminExists) {
    const hashed = await bcrypt.hash('saeidshoja', 12);
    await prisma.user.create({
      data: {
        phone: '09333092013',
        email: 'jeepoinfo@gmail.com',
        name: 'مدیر فروشگاه',
        password: hashed,
        role: 'ADMIN',
        isSuperAdmin: true,
        city: 'تهران',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  } else if (!adminExists.isSuperAdmin) {
    await prisma.user.update({
      where: { phone: '09333092013' },
      data: { isSuperAdmin: true },
    });
  }

  const cat = await prisma.category.findFirst({ where: { slug: 'tires-rims' } });
  if (cat) {
    const shopProductCount = await prisma.product.count({ where: { advertiser: 'SHOP' } });
    if (shopProductCount === 0) {
      const admin = await prisma.user.findUnique({ where: { phone: '09333092013' } });
      await prisma.product.create({
        data: {
          title: 'لاستیک ۳۳ اینچ گرندپیت',
          description: 'لاستیک آفرود سایز ۳۳ اینچ برند گرندپیت، مناسب برای تویوتا\nوضعیت: آکبند',
          price: 45000000,
          images: '[]',
          categoryId: cat.id,
          advertiser: 'SHOP',
          hasGuarantee: true,
          isBoosted: false,
          status: 'ACTIVE',
          city: 'تهران',
          userId: admin?.id,
          carBrands: { create: [{ brandCode: 'TOYOTA' }] },
        },
      });
      console.log('Sample products created');
    }
  }

  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    for (const post of BLOG_SEED_POSTS) {
      const bodyHtml = paragraphsToBlogHtml([...post.body]);
      await prisma.blogPost.create({
        data: {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          bodyHtml,
          bodyJson: paragraphsToTiptapDoc([...post.body]),
          coverImage: post.coverImage,
          tags: [...post.tags],
          status: 'PUBLISHED',
          readingMinutes: estimateReadingMinutesFromHtml(bodyHtml),
          publishedAt: new Date(post.publishedAt),
        },
      });
    }
    console.log('Blog posts seeded');
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
