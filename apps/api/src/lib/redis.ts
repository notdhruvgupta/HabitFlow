import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
})

redis.on('error', (err) => {
  console.error('[Redis] connection error:', err.message)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const STREAK_KEY  = (habitId: string) => `streak:${habitId}`
export const SESSION_KEY = (userId: string)  => `session:${userId}`
export const INSIGHT_KEY = (userId: string, weekOf: string) => `insight:${userId}:${weekOf}`

export async function cacheStreak(habitId: string, current: number, longest: number) {
  await redis.setex(STREAK_KEY(habitId), 3600, JSON.stringify({ current, longest }))
}

export async function getCachedStreak(habitId: string) {
  const raw = await redis.get(STREAK_KEY(habitId))
  return raw ? (JSON.parse(raw) as { current: number; longest: number }) : null
}

export async function invalidateStreak(habitId: string) {
  await redis.del(STREAK_KEY(habitId))
}
