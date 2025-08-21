import { getRedisClient, ensureRedisConnected } from './redis.js';

const WINDOW_MS = 60_000;

export function createRateLimiter({ limitPerMinute = 100, keyGenerator } = {}) {
	const localMap = new Map();
	return async function rateLimiter(req, res, next) {
		const key = (keyGenerator ? keyGenerator(req) : req.ip) || req.ip;
		const now = Date.now();
		const window = Math.floor(now / WINDOW_MS);
		const redis = getRedisClient();

		if (redis && await ensureRedisConnected()) {
			try {
				const redisKey = `rl:${key}:${window}`;
				const count = await redis.incr(redisKey);
				if (count === 1) await redis.pexpire(redisKey, WINDOW_MS);
				if (count > limitPerMinute) {
					return res.status(429).json({
						error: { code: 'rate_limited', message: 'Too many requests', requestId: req.id },
					});
				}
				return next();
			} catch (_e) {
				// fallthrough to local
			}
		}

		const keyWindow = `${key}:${window}`;
		const current = localMap.get(keyWindow) || 0;
		if (current >= limitPerMinute) {
			return res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests', requestId: req.id } });
		}
		localMap.set(keyWindow, current + 1);
		return next();
	};
}