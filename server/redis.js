import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let redisClient = null;

export function getRedisClient() {
	if (redisClient) return redisClient;
	const url = process.env.REDIS_URL || '';
	if (!url) return null;
	try {
		const Redis = require('ioredis');
		redisClient = new Redis(url, {
			lazyConnect: true,
			retryStrategy(times) {
				return Math.min(times * 200, 2000);
			}
		});
		return redisClient;
	} catch (_e) {
		return null;
	}
}

export async function ensureRedisConnected() {
	const client = getRedisClient();
	if (!client) return false;
	try {
		if (!client.status || client.status === 'end') {
			await client.connect();
		}
		await client.ping();
		return true;
	} catch (_e) {
		return false;
	}
}