import { PrismaClient } from '../src/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seedCategories() {
  const groups = [
    { name: 'موتور و انتقال', slug: 'engine-drivetrain', sortOrder: 1 },
    { name: 'شاسی و تعلیق', slug: 'chassis', sortOrder: 2 },
    { name: 'برق و روشنایی', slug: 'electrical', sortOrder: 3 },
    { name: 'ظاهر و تجهیزات', slug: 'gear-style', sortOrder: 4 },
    { name: 'سایر', slug: 'misc-group', sortOrder: 5 },
  ];

  const groupIds = new Map<string, string>();

  for (const g of groups) {
    const row = await prisma.category.upsert({
      where: { slug: g.slug },
      update: { name: g.name, group: 'PART', sortOrder: g.sortOrder, parentId: null },
      create: { ...g, group: 'PART' },
    });
    groupIds.set(g.slug, row.id);
  }

  await prisma.category.upsert({
    where: { slug: 'motorcycle-atv' },
    update: {
      name: 'موتورسیکلت و چهارچرخ',
      group: 'PART',
      sortOrder: 0,
      parentId: null,
    },
    create: {
      name: 'موتورسیکلت و چهارچرخ',
      slug: 'motorcycle-atv',
      group: 'PART',
      sortOrder: 0,
    },
  });

  const children = [
    { name: 'دنده و انتقال قدرت', slug: 'transmission', parentSlug: 'engine-drivetrain', sortOrder: 1 },
    { name: 'لوازم یدکی انجین', slug: 'engine-parts', parentSlug: 'engine-drivetrain', sortOrder: 2 },
    { name: 'تعلیق و زیربندی', slug: 'suspension', parentSlug: 'chassis', sortOrder: 1 },
    { name: 'لاستیک و رینگ', slug: 'tires-rims', parentSlug: 'chassis', sortOrder: 2 },
    { name: 'چراغ و نور', slug: 'lighting', parentSlug: 'electrical', sortOrder: 1 },
    { name: 'راهنما و مسیریاب', slug: 'navigation', parentSlug: 'electrical', sortOrder: 2 },
    { name: 'اکسسوری و تزئینات', slug: 'accessories', parentSlug: 'gear-style', sortOrder: 1 },
    { name: 'لباس و تجهیزات', slug: 'clothing-gear', parentSlug: 'gear-style', sortOrder: 2 },
  ];

  for (const cat of children) {
    const parentId = groupIds.get(cat.parentSlug);
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        group: 'PART',
        sortOrder: cat.sortOrder,
        parentId: parentId ?? null,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        group: 'PART',
        sortOrder: cat.sortOrder,
        parentId: parentId ?? null,
      },
    });
  }

  const other = await prisma.category.findUnique({ where: { slug: 'other' } });
  const misc = await prisma.category.findUnique({ where: { slug: 'misc-group' } });
  if (other && misc) {
    await prisma.product.updateMany({
      where: { categoryId: other.id },
      data: { categoryId: misc.id },
    });
    await prisma.category.delete({ where: { id: other.id } });
  } else if (other) {
    await prisma.category.delete({ where: { id: other.id } });
  }
}

async function main() {
  await seedCategories();

  const adminExists = await prisma.user.findUnique({ where: { phone: '09333092013' } });
  if (!adminExists) {
    const hashed = await bcrypt.hash('saeidshoja', 12);
    await prisma.user.create({
      data: {
        phone: '09333092013',
        name: 'مدیر فروشگاه',
        password: hashed,
        role: 'ADMIN',
        city: 'تهران',
      },
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
          description:
            'لاستیک آفرود سایز ۳۳ اینچ برند گرندپیت، مناسب برای تویوتا\nوضعیت: آکبند',
          price: 45000000,
          images: '[]',
          categoryId: cat.id,
          advertiser: 'SHOP',
          hasGuarantee: true,
          isBoosted: false,
          status: 'ACTIVE',
          city: 'تهران',
          userId: admin?.id,
          carBrands: { create: [{ brand: 'TOYOTA' }] },
        },
      });
      await prisma.product.create({
        data: {
          title: 'کمک فنر آفرود بیلشتاین',
          description: 'کمک فنر مخصوص آفرود برند بیلشتاین، اکبند و گارانتی',
          price: 28500000,
          images: '[]',
          categoryId: cat.id,
          advertiser: 'SHOP',
          hasGuarantee: true,
          isBoosted: true,
          status: 'ACTIVE',
          city: 'تهران',
          userId: admin?.id,
        },
      });
      console.log('Sample products created');
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
