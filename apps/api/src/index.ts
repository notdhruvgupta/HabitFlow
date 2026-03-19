import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { authRouter }       from './routes/auth'
import { habitsRouter }     from './routes/habits'
import { logsRouter }       from './routes/logs'
import { analyticsRouter }  from './routes/analytics'
import { remindersRouter, categoriesRouter, usersRouter, partnersRouter } from './routes/other'
import { redis }            from './lib/redis'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests' } }))
app.use('/api',      rateLimit({ windowMs: 60 * 1000,      max: 300 }))

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',                      authRouter)
app.use('/api/users',                     usersRouter)
app.use('/api/habits',                    habitsRouter)
app.use('/api/habits/:habitId/logs',      logsRouter)
app.use('/api/habits/:habitId/reminders', remindersRouter)
app.use('/api/categories',                categoriesRouter)
app.use('/api/analytics',                 analyticsRouter)
app.use('/api/partners',                  partnersRouter)

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  await redis.connect().catch(() => console.warn('[Redis] running without cache'))
  app.listen(PORT, () => console.log(`[API] listening on http://localhost:${PORT}`))
}

main()
