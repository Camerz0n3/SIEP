import { z } from 'zod';

const envSchema = z.object({
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().startsWith('whatsapp:'),
  CAMERON_PHONE_NUMBER: z.string().startsWith('whatsapp:'),

  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_PERSONAL_REFRESH_TOKEN: z.string().min(1),
  GOOGLE_KOJA_REFRESH_TOKEN: z.string().optional(),

  // Google Gemini (AI brain — free tier)
  GEMINI_API_KEY: z.string().min(1),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  TIMEZONE: z.string().default('Europe/Zurich'),
  VERBIER_LAT: z.string().default('46.0967'),
  VERBIER_LNG: z.string().default('7.2286'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map(
      (i) => `  - ${i.path.join('.')}: ${i.message}`
    );
    console.error(
      `\n❌ Missing or invalid environment variables:\n${missing.join('\n')}\n\nCheck your .env file or Railway environment variables.\n`
    );
    process.exit(1);
  }

  _env = result.data;
  return _env;
}
