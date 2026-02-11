'use server';

import { prisma } from '@/lib/prisma';

export type WaitlistState = {
  status: 'idle' | 'success' | 'duplicate' | 'error';
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitWaitlist(
  _prevState: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!email || !EMAIL_PATTERN.test(email)) {
    return {
      status: 'error',
      message: 'INVALID EMAIL FORMAT',
    };
  }

  const existing = await prisma.waitlist.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      status: 'duplicate',
      message: 'RE-ENLISTMENT NOT REQUIRED',
    };
  }

  await prisma.waitlist.create({
    data: { email },
  });

  return {
    status: 'success',
    message: 'COMMUNICATION RECEIVED',
  };
}
