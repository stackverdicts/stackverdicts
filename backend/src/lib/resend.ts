import { Resend } from 'resend';
import { env } from '../config/env';

if (!env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(env.RESEND_API_KEY);

export const FROM_EMAIL = env.RESEND_FROM_EMAIL || 'noreply@prizecrunch.com';
