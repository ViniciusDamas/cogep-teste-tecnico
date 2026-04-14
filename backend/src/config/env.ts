import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('cogep'),
  DB_PASSWORD: z.string().default('cogep'),
  DB_NAME: z.string().default('cogep'),
  JWT_SECRET: z.string().min(8).default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  NOTIFICATIONS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().default('whatsapp:+14155238886'),
  PUBLIC_APP_URL: z.string().default('http://localhost:4200'),
  // Lista separada por vírgula de origens permitidas (ou * para liberar geral)
  CORS_ORIGINS: z.string().default('http://localhost:4200,http://localhost:3000'),
});

export const env = schema.parse(process.env);
