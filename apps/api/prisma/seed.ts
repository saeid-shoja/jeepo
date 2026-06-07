import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { syncDefaultCategories } from '../src/categories/sync-default-categories';
import { PrismaClient } from '../src/prisma/generated/client';

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
        email: 'admin@jeepo.ir',
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
