import { randomInt } from 'node:crypto';
import { normalizeReferralCode, REFERRALS_PER_BOOST_CREDIT } from '@offroad/shared';
import type { PrismaClient } from '../prisma/generated/client';

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERRAL_CODE_LENGTH = 8;

type ReferralDb = {
  user: Pick<PrismaClient['user'], 'findUnique' | 'update' | 'count'>;
};

function randomReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_ALPHABET[randomInt(REFERRAL_ALPHABET.length)]!;
  }
  return code;
}

export async function generateUniqueReferralCode(db: ReferralDb): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = randomReferralCode();
    const existing = await db.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error('Could not generate unique referral code');
}

export async function ensureUserReferralCode(db: ReferralDb, userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (!user) throw new Error('User not found');
  if (user.referralCode) return user.referralCode;

  const referralCode = await generateUniqueReferralCode(db);
  await db.user.update({
    where: { id: userId },
    data: { referralCode },
  });
  return referralCode;
}

export async function processReferralOnSignup(
  db: ReferralDb,
  newUserId: string,
  referralCodeRaw?: string | null,
): Promise<void> {
  const referralCode = normalizeReferralCode(referralCodeRaw);
  if (!referralCode) return;

  const referrer = await db.user.findUnique({
    where: { referralCode },
    select: { id: true },
  });
  if (!referrer || referrer.id === newUserId) return;

  await db.user.update({
    where: { id: newUserId },
    data: { referredById: referrer.id },
  });

  const referralCount = await db.user.count({ where: { referredById: referrer.id } });
  if (referralCount > 0 && referralCount % REFERRALS_PER_BOOST_CREDIT === 0) {
    await db.user.update({
      where: { id: referrer.id },
      data: { boostCredits: { increment: 1 } },
    });
  }
}
