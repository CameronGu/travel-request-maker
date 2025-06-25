import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(32, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be set' }),
  // Add other required env vars here as needed
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment variable validation failed:');
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path[0]}: ${issue.message}`);
  }
  process.exit(1);
} else {
  console.log('✅ Environment variables validated.');
} 