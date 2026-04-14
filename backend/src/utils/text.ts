import { z } from 'zod';

const REPLACEMENT = '\uFFFD';

export function normalizeText(value: string): string {
  return value.normalize('NFC').trim();
}

export function hasReplacementChar(value: string): boolean {
  return value.includes(REPLACEMENT);
}

export const safeText = (min: number, max: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine((v) => !hasReplacementChar(v), {
      message: 'Texto contém caracteres inválidos (encoding). Reenvie em UTF-8.',
    })
    .transform(normalizeText);

export const optionalSafeText = (max: number) =>
  z
    .string()
    .max(max)
    .refine((v) => !hasReplacementChar(v), {
      message: 'Texto contém caracteres inválidos (encoding). Reenvie em UTF-8.',
    })
    .transform(normalizeText)
    .optional()
    .nullable();
