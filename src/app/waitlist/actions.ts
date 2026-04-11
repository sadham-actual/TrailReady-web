'use server';

import { createSupabaseServiceClient } from '@/lib/supabase/server';

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

  try {
    const supabase = createSupabaseServiceClient();

    const { data: existing, error: existingErr } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingErr) {
      return { status: 'error', message: 'DATABASE TRANSMISSION FAILED' };
    }

    if (existing) {
      return {
        status: 'duplicate',
        message: 'RE-ENLISTMENT NOT REQUIRED',
      };
    }

    const { error: insertErr } = await supabase
      .from('waitlist')
      .insert({ id: crypto.randomUUID(), email, status: 'PENDING' });

    if (insertErr) {
      return { status: 'error', message: 'DATABASE TRANSMISSION FAILED' };
    }

    return {
      status: 'success',
      message: 'COMMUNICATION RECEIVED',
    };
  } catch {
    return { status: 'error', message: 'DATABASE TRANSMISSION FAILED' };
  }
}
