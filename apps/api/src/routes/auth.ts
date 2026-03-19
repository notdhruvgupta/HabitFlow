import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt'
import { validate } from '../middleware/validate'
import { authenticate, type AuthRequest } from '../middleware/auth'
import { RegisterSchema, LoginSchema, RefreshSchema } from '@habitflow/shared'

export const authRouter = Router()

// POST /auth/register
authRouter.post('/register', validate(RegisterSchema), async (req, res) => {
  const { email, username, password, timezone } = req.body

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  })
  if (existing) {
    const field = existing.email === email ? 'email' : 'username'
    return res.status(409).json({ error: `That ${field} is already taken` })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, username, passwordHash, timezone },
    select: { id: true, email: true, username: true, timezone: true, createdAt: true },
  })

  const payload = { sub: user.id, email: user.email }
  return res.status(201).json({
    user,
    accessToken:  signAccess(payload),
    refreshToken: signRefresh(payload),
  })
})

// POST /auth/login
authRouter.post('/login', validate(LoginSchema), async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const payload = { sub: user.id, email: user.email }
  return res.json({
    accessToken:  signAccess(payload),
    refreshToken: signRefresh(payload),
  })
})

// POST /auth/refresh
authRouter.post('/refresh', validate(RefreshSchema), (req, res) => {
  try {
    const payload = verifyRefresh(req.body.refreshToken)
    return res.json({ accessToken: signAccess({ sub: payload.sub, email: payload.email }) })
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' })
  }
})

// POST /auth/logout  (client should discard tokens; endpoint for future blocklist)
authRouter.post('/logout', authenticate, (_req, res) => {
  return res.json({ message: 'Logged out' })
})
