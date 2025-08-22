import { z } from 'zod';

const schema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	PORT: z.coerce.number().default(4000),
	ALLOWED_ORIGIN: z.string().url().default('http://localhost:8080'),
	JWT_SECRET: z.string().min(16),
	ACCESS_TOKEN_TTL: z.string().default('15m'),
	REFRESH_TOKEN_TTL_MS: z.coerce.number().default(7 * 24 * 60 * 60 * 1000),
	REDIS_URL: z.string().optional(),
	DATABASE_URL: z.string().optional(),
	STORAGE_PROVIDER: z.enum(['local']).default('local').or(z.string()),
	QUEUE_CONCURRENCY: z.coerce.number().default(2),
	METRICS_ENABLED: z.enum(['true', 'false']).default('true'),
});

export function loadConfig(env = process.env) {
	const parsed = schema.safeParse(env);
	if (!parsed.success) {
		throw new Error('Invalid environment configuration: ' + parsed.error.message);
	}
	return parsed.data;
}